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
            You are an expert business analyst and technical writer.

            Your task is to rephrase and improve the following Jira story components to make them clearer, \
            more precise, and more actionable for developers.

            INPUT:
            - Title: %s
            - Description: %s
            - Acceptance Criteria: %s

            RULES:
            - Keep the original intent and scope intact.
            - Make the language clear, concise, and unambiguous.
            - Use active voice and specific technical language.
            - For acceptance criteria, use testable "Given/When/Then" format where appropriate.
            - Do NOT add new requirements not implied by the original.

            IMPORTANT: Return your response as valid JSON with exactly these three keys:
            {
              "rephrasedTitle": "improved title here",
              "rephrasedDescription": "improved description here",
              "rephrasedAcceptanceCriteria": "improved acceptance criteria here"
            }

            Return ONLY the JSON object, no markdown, no extra text.
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
            String prompt = String.format(REPHRASE_PROMPT,
                    request.getTitle(),
                    request.getDescription(),
                    request.getAcceptanceCriteria());

            String aiResponse = aiService.generateResponse(prompt);
            log.debug("AI rephrase response length: {}", aiResponse.length());

            // Parse JSON response from AI
            String jsonContent = extractJson(aiResponse);
            JsonNode json = objectMapper.readTree(jsonContent);

            return RephraseResponse.builder()
                    .originalTitle(request.getTitle())
                    .originalDescription(request.getDescription())
                    .originalAcceptanceCriteria(request.getAcceptanceCriteria())
                    .rephrasedTitle(getJsonText(json, "rephrasedTitle", request.getTitle()))
                    .rephrasedDescription(getJsonText(json, "rephrasedDescription", request.getDescription()))
                    .rephrasedAcceptanceCriteria(getJsonText(json, "rephrasedAcceptanceCriteria", request.getAcceptanceCriteria()))
                    .build();
        } catch (AiAnalysisException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to rephrase story: {}", ex.getMessage(), ex);
            throw new AiAnalysisException("Failed to rephrase story: " + ex.getMessage(), ex);
        }
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
