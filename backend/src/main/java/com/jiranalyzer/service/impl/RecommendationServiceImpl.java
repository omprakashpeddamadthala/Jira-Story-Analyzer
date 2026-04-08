package com.jiranalyzer.service.impl;

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
import java.util.List;
import java.util.stream.Collectors;

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

            CRITICAL: For filePath in fileModifications, you MUST use paths from the "Source Files" list below.
            These are the actual files that exist in each repository. Do NOT invent or guess file paths.
            Only reference files that appear in the source files list.
            All paths must be relative to the repository root (e.g. "src/main/java/com/example/MyClass.java").
            Return ONLY the JSON object, no markdown fences, no extra text.
            """;

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
        String repoContext = buildRepoContextString(scanResult);

        try {
            String ac = request.getAcceptanceCriteria() != null
                    && !request.getAcceptanceCriteria().isBlank()
                    ? request.getAcceptanceCriteria() : "Not provided";
            String prompt = String.format(RECOMMENDATION_PROMPT,
                    request.getTitle(),
                    request.getDescription(),
                    ac,
                    repoContext);

            String aiResponse = aiService.generateResponse(prompt);
            log.debug("AI recommendation response length: {}", aiResponse.length());

            String jsonContent = extractJson(aiResponse);
            JsonNode json = objectMapper.readTree(jsonContent);

            return parseRecommendationResponse(json, request.getJiraKey());
        } catch (AiAnalysisException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to generate recommendations: {}", ex.getMessage(), ex);
            throw new AiAnalysisException("Failed to generate recommendations: " + ex.getMessage(), ex);
        }
    }

    private String buildRepoContextString(RepoScanResponse scanResult) {
        StringBuilder sb = new StringBuilder();
        sb.append("Folder: ").append(scanResult.getFolderPath()).append("\n");
        sb.append("Total repositories: ").append(scanResult.getTotalRepos()).append("\n\n");

        for (RepoScanResponse.RepoInfo repo : scanResult.getRepositories()) {
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
            if (repo.getSourceFiles() != null && !repo.getSourceFiles().isEmpty()) {
                sb.append("- Source Files (use these exact paths in fileModifications):\n");
                for (String file : repo.getSourceFiles()) {
                    sb.append("  - ").append(file).append("\n");
                }
            }
            sb.append("\n");
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
