package com.jiranalyzer.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiranalyzer.dto.request.RephraseRequest;
import com.jiranalyzer.dto.response.RephraseResponse;
import com.jiranalyzer.exception.AiAnalysisException;
import com.jiranalyzer.service.AIService;
import com.jiranalyzer.service.RephraseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class RephraseServiceImpl implements RephraseService {

    private final AIService aiService;
    private final ObjectMapper objectMapper;

    private static final String REPHRASE_PROMPT = """
            **Role:** Act as a **Senior Technical Architect** and an expert **JIRA Story writer**.

            **Task:** Rephrase and refine the following JIRA input into a **best-in-class, crystal clear, \
            complete, and easy-to-comprehend** JIRA Story. Ensure it is **accurate, unambiguous, \
            implementation-ready**, and **double-checked for consistency**.

            #### Input
            - **Title:** %s
            - **Description:** %s
            - **Acceptance Criteria:** %s

            #### Rules / Constraints
            1. **Do not change the intended meaning** or introduce new requirements. If something is unclear \
            or missing, **list clarifying questions** instead of guessing.
            2. Use **precise technical wording**, consistent terminology, and correct grammar.
            3. Remove duplicates, contradictions, and vague language (e.g., "etc.", "asap", "should be fine").
            4. Convert implicit requirements into **explicit statements** where clearly implied by the text.
            5. Acceptance Criteria must be **testable**, written in clear bullet points or **Given/When/Then** format.
            6. Ensure the Story includes enough context for engineering, QA, and stakeholders.

            #### Output Format (use exactly these sections)
            1. **Refined Title**
            2. **Refined Description**
               - Background / Context
               - Objective
               - In Scope
               - Out of Scope (if determinable; otherwise state "Not specified")
               - Assumptions (only if explicitly inferable; otherwise "None stated")
            3. **Acceptance Criteria (Testable)**
            4. **Dependencies / Integrations** (if mentioned; else "None stated")
            5. **Risks / Edge Cases** (if mentioned or directly implied; else "None stated")
            6. **Open Questions / Clarifications Needed** (only if required)

            #### Quality Checklist (apply before finalizing)
            - Title is specific and action-oriented.
            - Description clearly states **what + why + who impacted**.
            - No ambiguity; consistent naming.
            - Acceptance criteria are measurable and verifiable.
            - No missing pieces required to start development/testing.

            IMPORTANT: You MUST return your response as valid JSON with exactly these four keys:
            {
              "rephrasedTitle": "the refined title only",
              "rephrasedDescription": "the refined description only (Background, Objective, In Scope, Out of Scope, Assumptions)",
              "rephrasedAcceptanceCriteria": "the refined acceptance criteria only",
              "refinedStory": "the FULL consolidated refined story output including ALL sections above in markdown format"
            }

            Return ONLY the JSON object, no markdown fences, no extra text.
            """;

    public RephraseServiceImpl(AIService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    @Override
    public RephraseResponse rephrase(RephraseRequest request) {
        log.info("Rephrasing story: title='{}' (length={})", 
                truncate(request.getTitle(), 50), request.getDescription().length());

        try {
            String ac = request.getAcceptanceCriteria() != null
                    && !request.getAcceptanceCriteria().isBlank()
                    ? request.getAcceptanceCriteria() : "Not provided";
            String prompt = String.format(REPHRASE_PROMPT,
                    request.getTitle(),
                    request.getDescription(),
                    ac);

            String aiResponse = aiService.generateResponse(prompt);
            log.debug("AI rephrase response length: {}", aiResponse.length());

            // Parse JSON response from AI
            String jsonContent = extractJson(aiResponse);
            JsonNode json = objectMapper.readTree(jsonContent);

            String refinedStory = getJsonText(json, "refinedStory", null);
            String rephrasedTitle = getJsonText(json, "rephrasedTitle", request.getTitle());
            String rephrasedDesc = getJsonText(json, "rephrasedDescription", request.getDescription());
            String rephrasedAc = getJsonText(json, "rephrasedAcceptanceCriteria", ac);

            // If the AI did not return a refinedStory, build one from the individual fields
            if (refinedStory == null || refinedStory.isBlank()) {
                refinedStory = buildRefinedStory(rephrasedTitle, rephrasedDesc, rephrasedAc);
            }

            return RephraseResponse.builder()
                    .originalTitle(request.getTitle())
                    .originalDescription(request.getDescription())
                    .originalAcceptanceCriteria(request.getAcceptanceCriteria())
                    .rephrasedTitle(rephrasedTitle)
                    .rephrasedDescription(rephrasedDesc)
                    .rephrasedAcceptanceCriteria(rephrasedAc)
                    .refinedStory(refinedStory)
                    .build();
        } catch (AiAnalysisException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to rephrase story: {}", ex.getMessage(), ex);
            throw new AiAnalysisException("Failed to rephrase story: " + ex.getMessage(), ex);
        }
    }

    /**
     * Build a consolidated refined story from individual fields when the AI
     * does not return the full refinedStory field.
     */
    private String buildRefinedStory(String title, String description, String acceptanceCriteria) {
        StringBuilder sb = new StringBuilder();
        sb.append("## Refined Title\n").append(title).append("\n\n");
        sb.append("## Refined Description\n").append(description).append("\n\n");
        sb.append("## Acceptance Criteria (Testable)\n").append(acceptanceCriteria).append("\n");
        return sb.toString();
    }

    private String extractJson(String text) {
        // Try to extract JSON from possible markdown code fences
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            int start = trimmed.indexOf('\n');
            int end = trimmed.lastIndexOf("```");
            if (start >= 0 && end > start) {
                trimmed = trimmed.substring(start + 1, end).trim();
            }
        }
        // Find first { and last }
        int braceStart = trimmed.indexOf('{');
        int braceEnd = trimmed.lastIndexOf('}');
        if (braceStart >= 0 && braceEnd > braceStart) {
            return trimmed.substring(braceStart, braceEnd + 1);
        }
        return trimmed;
    }

    private String getJsonText(JsonNode json, String field, String fallback) {
        if (json.has(field) && !json.get(field).isNull()) {
            return json.get(field).asText();
        }
        return fallback;
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        return text.length() > maxLen ? text.substring(0, maxLen) + "..." : text;
    }
}
