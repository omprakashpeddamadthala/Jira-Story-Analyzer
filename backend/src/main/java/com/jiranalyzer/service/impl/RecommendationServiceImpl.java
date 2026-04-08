package com.jiranalyzer.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiranalyzer.dto.request.GenerateRecommendationsRequest;
import com.jiranalyzer.dto.response.RecommendationResponse;
import com.jiranalyzer.dto.response.RecommendationResponse.ChangeRecommendation;
import com.jiranalyzer.dto.response.RepoScanResponse;
import com.jiranalyzer.exception.AiAnalysisException;
import com.jiranalyzer.service.AIService;
import com.jiranalyzer.service.RecommendationService;
import com.jiranalyzer.service.RepoScanService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
public class RecommendationServiceImpl implements RecommendationService {

    private final AIService aiService;
    private final RepoScanService repoScanService;
    private final ObjectMapper objectMapper;

    private static final String RECOMMENDATION_PROMPT = """
            You are an expert software architect and developer. Analyze the following Jira story requirements \
            and the scanned repository context, then generate specific change recommendations.

            ## Story
            - Title: %s
            - Description: %s
            - Acceptance Criteria: %s

            ## Repository Context
            %s

            ## Instructions
            Based on the story requirements and the repository structure, generate a JSON response with:
            1. A high-level summary of what needs to change
            2. Which repositories are impacted
            3. Specific file-level changes with rationale, risk assessment, and structured modifications

            IMPORTANT: Return ONLY valid JSON matching this exact schema:
            {
              "summary": "High-level summary of recommended changes",
              "impactedRepos": ["repo-name-1", "repo-name-2"],
              "changes": [
                {
                  "repo": "repo-name",
                  "files": ["path/to/file1.java", "path/to/file2.ts"],
                  "rationale": "Why this change is needed",
                  "risk": "low|medium|high",
                  "patch": "Human-readable description of the code changes",
                  "fileModifications": [
                    {
                      "filePath": "path/to/file1.java",
                      "action": "modify",
                      "searchContent": "exact original code snippet to find",
                      "replaceContent": "replacement code snippet"
                    }
                  ]
                }
              ]
            }

            For fileModifications:
            - action must be "modify", "create", or "delete"
            - For "modify": searchContent is the exact code to find, replaceContent is the replacement
            - For "create": filePath is the new file, replaceContent is the full file content, searchContent is empty
            - For "delete": filePath is the file to delete, searchContent and replaceContent are empty
            - Keep searchContent and replaceContent as focused snippets (not entire files)

            CRITICAL: For filePath in fileModifications, you MUST use paths from the "Source Files" list above.
            These are the actual files that exist in each repository. Do NOT invent or guess file paths.
            Only reference files that appear in the source files list.
            All paths must be relative to the repository root (e.g. "src/main/java/com/example/MyClass.java").
            Return ONLY the JSON object, no markdown fences, no extra text.
            """;

    /**
     * Conservative token limit for the model context window.
     * Reserve ~4,000 tokens for the response to avoid truncated JSON output.
     */
    private static final int MAX_PROMPT_TOKENS = 12_000;

    /** Rough estimate: 1 token ≈ 4 characters for English / code text. */
    private static final int CHARS_PER_TOKEN = 4;

    public RecommendationServiceImpl(AIService aiService, RepoScanService repoScanService,
                                     ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.repoScanService = repoScanService;
        this.objectMapper = objectMapper;
    }

    @Override
    public RecommendationResponse generateRecommendations(GenerateRecommendationsRequest request) {
        log.info("Generating recommendations for story: {}", request.getJiraKey());

        if (!repoScanService.hasCachedScan(request.getFolderPath())) {
            throw new IllegalArgumentException(
                    "No scanned repository context found for: " + request.getFolderPath()
                            + ". Please scan the folder first.");
        }

        RepoScanResponse scanResult = repoScanService.getCachedScan(request.getFolderPath());

        try {
            String ac = request.getAcceptanceCriteria() != null
                    && !request.getAcceptanceCriteria().isBlank()
                    ? request.getAcceptanceCriteria() : "Not provided";

            // Build the full prompt to check if it fits within the token limit
            String fullRepoContext = buildRepoContextString(scanResult);
            String fullPrompt = String.format(RECOMMENDATION_PROMPT,
                    request.getTitle(), request.getDescription(), ac, fullRepoContext);

            int estimatedTokens = estimateTokenCount(fullPrompt);
            log.info("Estimated prompt tokens: {} (limit: {})", estimatedTokens, MAX_PROMPT_TOKENS);

            if (estimatedTokens <= MAX_PROMPT_TOKENS) {
                // Single call — fits within the token limit
                return callAiAndParse(fullPrompt, request.getJiraKey());
            }

            // Chunked approach — split repo context and make multiple AI calls
            log.info("Prompt exceeds token limit, splitting into chunks");
            List<String> contextChunks = splitRepoContext(scanResult, request.getTitle(),
                    request.getDescription(), ac);
            log.info("Split into {} chunk(s)", contextChunks.size());

            List<RecommendationResponse> partialResponses = new ArrayList<>();
            for (int i = 0; i < contextChunks.size(); i++) {
                String chunkPrompt = String.format(RECOMMENDATION_PROMPT,
                        request.getTitle(), request.getDescription(), ac, contextChunks.get(i));
                log.info("Processing chunk {}/{} — estimated tokens: {}",
                        i + 1, contextChunks.size(), estimateTokenCount(chunkPrompt));
                partialResponses.add(callAiAndParse(chunkPrompt, request.getJiraKey()));
            }

            return mergeResponses(partialResponses, request.getJiraKey());
        } catch (AiAnalysisException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to generate recommendations: {}", ex.getMessage(), ex);
            throw new AiAnalysisException("Failed to generate recommendations: " + ex.getMessage(), ex);
        }
    }

    /**
     * Call the AI service with a single prompt and parse the JSON response.
     * If the response is truncated JSON, attempt to repair it. If repair fails,
     * retry once with an explicit instruction to keep the response concise.
     */
    private RecommendationResponse callAiAndParse(String prompt, String jiraKey) throws Exception {
        String aiResponse = aiService.generateResponse(prompt);
        log.debug("AI recommendation response length: {}", aiResponse.length());
        String jsonContent = extractJson(aiResponse);

        // Try to parse directly
        JsonNode json = tryParseJson(jsonContent);
        if (json != null) {
            return parseRecommendationResponse(json, jiraKey);
        }

        // JSON is truncated — try to repair it
        log.warn("AI returned truncated JSON (length={}), attempting repair", jsonContent.length());
        String repaired = repairTruncatedJson(jsonContent);
        json = tryParseJson(repaired);
        if (json != null) {
            log.info("Successfully parsed repaired JSON");
            return parseRecommendationResponse(json, jiraKey);
        }

        // Repair failed — retry once with a shorter-response instruction
        log.warn("JSON repair failed, retrying with concise prompt");
        String concisePrompt = prompt + "\n\nIMPORTANT: Keep your response under 2000 tokens. "
                + "Limit fileModifications to the 3 most important changes per repository. "
                + "Use short, concise values for all string fields.";
        aiResponse = aiService.generateResponse(concisePrompt);
        jsonContent = extractJson(aiResponse);

        json = tryParseJson(jsonContent);
        if (json != null) {
            return parseRecommendationResponse(json, jiraKey);
        }

        // Final attempt — repair the retry response
        repaired = repairTruncatedJson(jsonContent);
        json = tryParseJson(repaired);
        if (json != null) {
            log.info("Successfully parsed repaired retry JSON");
            return parseRecommendationResponse(json, jiraKey);
        }

        throw new AiAnalysisException(
                "AI returned incomplete JSON that could not be repaired. "
                        + "The response may have been truncated by the model's output token limit.");
    }

    /**
     * Attempt to parse JSON, returning null instead of throwing on failure.
     */
    private JsonNode tryParseJson(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    /**
     * Attempt to repair truncated JSON by closing open strings, arrays, and objects.
     * <p>
     * This handles the common case where the AI model hits its output token limit
     * mid-response, leaving unterminated JSON structures.
     */
    private String repairTruncatedJson(String json) {
        if (json == null || json.isBlank()) {
            return "{}";
        }

        StringBuilder sb = new StringBuilder(json);

        // 1. If we're inside an unterminated string, close it
        boolean inString = false;
        boolean escaped = false;
        for (int i = 0; i < sb.length(); i++) {
            char c = sb.charAt(i);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (c == '\\') {
                escaped = true;
                continue;
            }
            if (c == '"') {
                inString = !inString;
            }
        }
        if (inString) {
            sb.append('"');
        }

        // 2. Close open arrays and objects by scanning bracket depth
        List<Character> openBrackets = new ArrayList<>();
        inString = false;
        escaped = false;
        for (int i = 0; i < sb.length(); i++) {
            char c = sb.charAt(i);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (c == '\\') {
                escaped = true;
                continue;
            }
            if (c == '"') {
                inString = !inString;
                continue;
            }
            if (inString) continue;
            if (c == '{') openBrackets.add('}');
            else if (c == '[') openBrackets.add(']');
            else if (c == '}' || c == ']') {
                if (!openBrackets.isEmpty()) {
                    openBrackets.remove(openBrackets.size() - 1);
                }
            }
        }

        // 3. Remove any trailing partial key-value (e.g. ", \"someKey\": " with no value)
        String current = sb.toString().stripTrailing();
        // Remove trailing colon (key with no value)
        if (current.endsWith(":")) {
            current = current.substring(0, current.length() - 1).stripTrailing();
            // Also remove the trailing key string
            int lastQuote = current.lastIndexOf('"');
            int secondLastQuote = current.lastIndexOf('"', lastQuote - 1);
            if (secondLastQuote >= 0) {
                current = current.substring(0, secondLastQuote).stripTrailing();
            }
        }
        // Remove trailing comma
        if (current.endsWith(",")) {
            current = current.substring(0, current.length() - 1);
        }
        sb = new StringBuilder(current);

        // 4. Append closing brackets in reverse order
        for (int i = openBrackets.size() - 1; i >= 0; i--) {
            sb.append(openBrackets.get(i));
        }

        log.debug("Repaired JSON length: {} (original: {})", sb.length(), json.length());
        return sb.toString();
    }

    /**
     * Estimate token count using a simple character-based heuristic.
     */
    private int estimateTokenCount(String text) {
        return text.length() / CHARS_PER_TOKEN;
    }

    /**
     * Split the repository context into chunks that each fit within the token
     * budget when combined with the prompt template and story fields.
     * <p>
     * Repositories are kept whole when possible. If a single repository's context
     * still exceeds the budget, its source-file list is truncated to fit.
     */
    private List<String> splitRepoContext(RepoScanResponse scanResult, String title,
                                          String description, String ac) {
        // Calculate the overhead — everything in the prompt except the repo context placeholder
        String overhead = String.format(RECOMMENDATION_PROMPT, title, description, ac, "");
        int overheadTokens = estimateTokenCount(overhead);
        int budgetPerChunk = MAX_PROMPT_TOKENS - overheadTokens;

        String header = "Folder: " + scanResult.getFolderPath() + "\n"
                + "Total repositories: " + scanResult.getTotalRepos() + "\n\n";
        int headerTokens = estimateTokenCount(header);

        List<String> chunks = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder(header);
        int currentTokens = headerTokens;

        for (RepoScanResponse.RepoInfo repo : scanResult.getRepositories()) {
            String repoBlock = buildSingleRepoContext(repo);
            int repoTokens = estimateTokenCount(repoBlock);

            if (repoTokens > budgetPerChunk - headerTokens) {
                // Single repo is too large — truncate its source file list
                if (currentTokens > headerTokens) {
                    // Flush what we have so far
                    chunks.add(currentChunk.toString());
                    currentChunk = new StringBuilder(header);
                    currentTokens = headerTokens;
                }
                String truncatedBlock = buildTruncatedRepoContext(repo,
                        budgetPerChunk - headerTokens);
                currentChunk.append(truncatedBlock);
                chunks.add(currentChunk.toString());
                currentChunk = new StringBuilder(header);
                currentTokens = headerTokens;
                continue;
            }

            if (currentTokens + repoTokens > budgetPerChunk) {
                // Start a new chunk
                chunks.add(currentChunk.toString());
                currentChunk = new StringBuilder(header);
                currentTokens = headerTokens;
            }

            currentChunk.append(repoBlock);
            currentTokens += repoTokens;
        }

        // Flush remaining
        if (currentTokens > headerTokens) {
            chunks.add(currentChunk.toString());
        }

        // Safety: at least one chunk
        if (chunks.isEmpty()) {
            chunks.add(header);
        }

        return chunks;
    }

    /**
     * Build the context string for a single repository.
     */
    private String buildSingleRepoContext(RepoScanResponse.RepoInfo repo) {
        StringBuilder sb = new StringBuilder();
        appendRepoMetadata(sb, repo);
        if (repo.getSourceFiles() != null && !repo.getSourceFiles().isEmpty()) {
            sb.append("- Source Files (use these exact paths in fileModifications):\n");
            for (String file : repo.getSourceFiles()) {
                sb.append("  - ").append(file).append("\n");
            }
        }
        sb.append("\n");
        return sb.toString();
    }

    /**
     * Build a truncated context string for a single repository whose full
     * source-file list would exceed the token budget.
     */
    private String buildTruncatedRepoContext(RepoScanResponse.RepoInfo repo, int tokenBudget) {
        StringBuilder sb = new StringBuilder();
        appendRepoMetadata(sb, repo);

        int usedTokens = estimateTokenCount(sb.toString());
        int remaining = tokenBudget - usedTokens;

        if (repo.getSourceFiles() != null && !repo.getSourceFiles().isEmpty() && remaining > 0) {
            String headerLine = "- Source Files (use these exact paths in fileModifications) [truncated]:\n";
            sb.append(headerLine);
            remaining -= estimateTokenCount(headerLine);

            int included = 0;
            for (String file : repo.getSourceFiles()) {
                String line = "  - " + file + "\n";
                int lineTokens = estimateTokenCount(line);
                if (remaining - lineTokens < 0) {
                    break;
                }
                sb.append(line);
                remaining -= lineTokens;
                included++;
            }
            int omitted = repo.getSourceFiles().size() - included;
            if (omitted > 0) {
                sb.append("  ... (" + omitted + " more files omitted to fit token limit)\n");
            }
        }
        sb.append("\n");
        return sb.toString();
    }

    /**
     * Append non-source-file metadata for a repository.
     */
    private void appendRepoMetadata(StringBuilder sb, RepoScanResponse.RepoInfo repo) {
        sb.append("### Repository: ").append(repo.getName()).append("\n");
        sb.append("- Path: ").append(repo.getPath()).append("\n");
        sb.append("- Languages: ").append(String.join(", ", repo.getLanguages())).append("\n");
        sb.append("- Frameworks: ").append(String.join(", ", repo.getFrameworks())).append("\n");
        sb.append("- Package Manager: ").append(repo.getPackageManager()).append("\n");
        sb.append("- Total Files: ").append(repo.getTotalFiles()).append("\n");

        if (repo.getEntryPoints() != null && !repo.getEntryPoints().isEmpty()) {
            sb.append("- Entry Points: ").append(String.join(", ", repo.getEntryPoints())).append("\n");
        }
        if (repo.getKeyModules() != null && !repo.getKeyModules().isEmpty()) {
            sb.append("- Key Modules: ").append(String.join(", ", repo.getKeyModules())).append("\n");
        }
        if (repo.getStructure() != null) {
            if (repo.getStructure().getTopLevelDirs() != null) {
                sb.append("- Top-level dirs: ")
                        .append(String.join(", ", repo.getStructure().getTopLevelDirs())).append("\n");
            }
            if (repo.getStructure().getTopLevelFiles() != null) {
                sb.append("- Top-level files: ")
                        .append(String.join(", ", repo.getStructure().getTopLevelFiles())).append("\n");
            }
        }
    }

    /**
     * Merge multiple partial recommendation responses into a single response.
     * Summaries are concatenated and de-duplicated repos/changes are combined.
     */
    private RecommendationResponse mergeResponses(List<RecommendationResponse> responses, String jiraKey) {
        if (responses.size() == 1) {
            return responses.get(0);
        }

        List<String> summaries = new ArrayList<>();
        Set<String> impactedRepos = new LinkedHashSet<>();
        List<ChangeRecommendation> allChanges = new ArrayList<>();

        for (RecommendationResponse r : responses) {
            if (r.getSummary() != null && !r.getSummary().isBlank()) {
                summaries.add(r.getSummary());
            }
            if (r.getImpactedRepos() != null) {
                impactedRepos.addAll(r.getImpactedRepos());
            }
            if (r.getChanges() != null) {
                allChanges.addAll(r.getChanges());
            }
        }

        String mergedSummary = String.join(" | ", summaries);
        log.info("Merged {} partial responses — {} total changes across {} repos",
                responses.size(), allChanges.size(), impactedRepos.size());

        return RecommendationResponse.builder()
                .summary(mergedSummary)
                .jiraKey(jiraKey)
                .impactedRepos(new ArrayList<>(impactedRepos))
                .changes(allChanges)
                .build();
    }

    private String buildRepoContextString(RepoScanResponse scanResult) {
        StringBuilder sb = new StringBuilder();
        sb.append("Folder: ").append(scanResult.getFolderPath()).append("\n");
        sb.append("Total repositories: ").append(scanResult.getTotalRepos()).append("\n\n");

        for (RepoScanResponse.RepoInfo repo : scanResult.getRepositories()) {
            sb.append(buildSingleRepoContext(repo));
        }
        return sb.toString();
    }

    private RecommendationResponse parseRecommendationResponse(JsonNode json, String jiraKey) {
        String summary = json.has("summary") ? json.get("summary").asText() : "No summary provided";

        List<String> impactedRepos = new ArrayList<>();
        if (json.has("impactedRepos") && json.get("impactedRepos").isArray()) {
            for (JsonNode repo : json.get("impactedRepos")) {
                impactedRepos.add(repo.asText());
            }
        }

        List<ChangeRecommendation> changes = new ArrayList<>();
        if (json.has("changes") && json.get("changes").isArray()) {
            for (JsonNode change : json.get("changes")) {
                List<String> files = new ArrayList<>();
                if (change.has("files") && change.get("files").isArray()) {
                    for (JsonNode file : change.get("files")) {
                        files.add(file.asText());
                    }
                }

                List<RecommendationResponse.FileModification> fileMods = new ArrayList<>();
                if (change.has("fileModifications") && change.get("fileModifications").isArray()) {
                    for (JsonNode mod : change.get("fileModifications")) {
                        fileMods.add(RecommendationResponse.FileModification.builder()
                                .filePath(mod.has("filePath") ? mod.get("filePath").asText() : "")
                                .action(mod.has("action") ? mod.get("action").asText() : "modify")
                                .searchContent(mod.has("searchContent") ? mod.get("searchContent").asText() : "")
                                .replaceContent(mod.has("replaceContent") ? mod.get("replaceContent").asText() : "")
                                .build());
                    }
                }

                changes.add(ChangeRecommendation.builder()
                        .repo(change.has("repo") ? change.get("repo").asText() : "unknown")
                        .files(files)
                        .rationale(change.has("rationale") ? change.get("rationale").asText() : "")
                        .risk(change.has("risk") ? change.get("risk").asText() : "medium")
                        .patch(change.has("patch") ? change.get("patch").asText() : "")
                        .fileModifications(fileMods)
                        .build());
            }
        }

        return RecommendationResponse.builder()
                .summary(summary)
                .jiraKey(jiraKey)
                .impactedRepos(impactedRepos)
                .changes(changes)
                .build();
    }

    private String extractJson(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            int start = trimmed.indexOf('\n');
            int end = trimmed.lastIndexOf("```");
            if (start >= 0 && end > start) {
                trimmed = trimmed.substring(start + 1, end).trim();
            }
        }
        int braceStart = trimmed.indexOf('{');
        int braceEnd = trimmed.lastIndexOf('}');
        if (braceStart >= 0 && braceEnd > braceStart) {
            return trimmed.substring(braceStart, braceEnd + 1);
        }
        return trimmed;
    }
}
