package com.jiranalyzer.service.impl;

import com.jiranalyzer.dto.request.AnalyzeStoryRequest;
import com.jiranalyzer.dto.response.AnalyzedStoryResponse;
import com.jiranalyzer.entity.AnalyzedStory;
import com.jiranalyzer.exception.AiAnalysisException;
import com.jiranalyzer.repository.AnalyzedStoryRepository;
import com.jiranalyzer.service.AIService;
import com.jiranalyzer.service.AiAnalysisService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Optional;

@Service
@Slf4j
public class AiAnalysisServiceImpl implements AiAnalysisService {

    private final AIService aiService;
    private final AnalyzedStoryRepository analyzedStoryRepository;

    public AiAnalysisServiceImpl(AIService aiService, AnalyzedStoryRepository analyzedStoryRepository) {
        this.aiService = aiService;
        this.analyzedStoryRepository = analyzedStoryRepository;
        log.info("AiAnalysisService initialized with provider: {}", aiService.getProviderName());
    }

    @Override
    public AnalyzedStoryResponse analyzeStory(AnalyzeStoryRequest request) {
        log.info("Analyzing story: {} - {}", request.getJiraKey(), request.getTitle());

        try {
            String copilotPrompt = generateCopilotPrompt(request);

            Optional<AnalyzedStory> existingStory = analyzedStoryRepository.findByJiraKey(request.getJiraKey());

            AnalyzedStory story;
            if (existingStory.isPresent()) {
                story = existingStory.get();
                log.info("Updating existing analysis for story: {}", request.getJiraKey());
            } else {
                story = new AnalyzedStory();
                story.setJiraKey(request.getJiraKey());
            }

            story.setTitle(request.getTitle());
            story.setDescription(request.getDescription());
            story.setAcceptanceCriteria(request.getAcceptanceCriteria());
            story.setDefinitionOfDone(request.getDefinitionOfDone());
            story.setCopilotPrompt(copilotPrompt);

            AnalyzedStory savedStory = analyzedStoryRepository.save(story);
            log.info("Story analysis saved with ID: {}", savedStory.getId());

            return mapToResponse(savedStory);
        } catch (Exception ex) {
            log.error("Failed to analyze story {}: {}", request.getJiraKey(), ex.getMessage(), ex);
            throw new AiAnalysisException("Failed to analyze story: " + ex.getMessage(), ex);
        }
    }

    @Override
    public void analyzeStoryStreaming(AnalyzeStoryRequest request, SseEmitter emitter) {
        log.info("Streaming analysis for story: {} - {}", request.getJiraKey(), request.getTitle());

        String copilotPrompt = null;

        try {
            // Send start event
            sendSseEvent(emitter, "start", "{\"jiraKey\":" + escapeJson(request.getJiraKey()) + ",\"provider\":" + escapeJson(aiService.getProviderName()) + "}");

            // Generate and stream copilot prompt
            sendSseEvent(emitter, "section-start", "{\"section\":\"copilotPrompt\",\"label\":\"GitHub Copilot Prompt\"}");
            copilotPrompt = generateCopilotPrompt(request);
            sendSseEvent(emitter, "section-complete", "{\"section\":\"copilotPrompt\",\"content\":" + escapeJson(copilotPrompt) + "}");

            // Save to database
            AnalyzedStory savedStory = saveAnalyzedStory(request, copilotPrompt);
            AnalyzedStoryResponse response = mapToResponse(savedStory);

            // Send final complete event with full response
            String responseJson = "{\"id\":" + escapeJson(String.valueOf(response.getId())) + ",\"jiraKey\":" + escapeJson(response.getJiraKey()) + ",\"createdAt\":" + escapeJson(String.valueOf(response.getCreatedAt())) + ",\"updatedAt\":" + escapeJson(String.valueOf(response.getUpdatedAt())) + "}";
            sendSseEvent(emitter, "complete", responseJson);
            emitter.complete();
            log.info("Streaming analysis completed for story: {}", request.getJiraKey());
        } catch (Exception ex) {
            log.error("Streaming analysis failed for story {}: {}", request.getJiraKey(), ex.getMessage(), ex);
            try {
                String errorMsg = ex.getMessage() != null ? ex.getMessage() : "Unknown error";
                sendSseEvent(emitter, "error", "{\"message\":" + escapeJson(errorMsg) + "}");
                emitter.complete();
            } catch (Exception sendEx) {
                log.error("Failed to send error event: {}", sendEx.getMessage());
                emitter.completeWithError(ex);
            }
        }
    }

    private void sendSseEvent(SseEmitter emitter, String eventName, String data) throws IOException {
        emitter.send(SseEmitter.event()
                .name(eventName)
                .data(data));
    }

    private String escapeJson(String value) {
        if (value == null) return "null";
        StringBuilder sb = new StringBuilder("\"");
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        sb.append("\"");
        return sb.toString();
    }

    private AnalyzedStory saveAnalyzedStory(AnalyzeStoryRequest request, String copilotPrompt) {
        Optional<AnalyzedStory> existingStory = analyzedStoryRepository.findByJiraKey(request.getJiraKey());

        AnalyzedStory story;
        if (existingStory.isPresent()) {
            story = existingStory.get();
            log.info("Updating existing analysis for story: {}", request.getJiraKey());
        } else {
            story = new AnalyzedStory();
            story.setJiraKey(request.getJiraKey());
        }

        story.setTitle(request.getTitle());
        story.setDescription(request.getDescription());
        story.setAcceptanceCriteria(request.getAcceptanceCriteria());
        story.setDefinitionOfDone(request.getDefinitionOfDone());
        story.setCopilotPrompt(copilotPrompt);

        AnalyzedStory savedStory = analyzedStoryRepository.save(story);
        log.info("Story analysis saved with ID: {}", savedStory.getId());
        return savedStory;
    }

    private String generateCopilotPrompt(AnalyzeStoryRequest request) {
        String template = """
                You are an expert AI software engineer.

                Your task is to analyze the complete codebase and generate an implementation prompt \
                that can be directly used with GitHub Copilot.

                Follow the steps below carefully:

                --------------------------------------
                STEP 1: INPUT FROM JIRA
                --------------------------------------
                You will receive:
                - Title: {title}
                - Description: {description}
                - Acceptance Criteria: {acceptanceCriteria}
                - Definition of Done: {definitionOfDone}

                --------------------------------------
                STEP 2: CODEBASE ANALYSIS
                --------------------------------------
                - Analyze entire codebase
                - Identify modules, services, controllers, APIs, DB
                - Detect reusable components
                - Identify change points

                --------------------------------------
                STEP 3: PROMPT GENERATION
                --------------------------------------
                Generate a detailed Copilot prompt:
                - Context-aware
                - File-level guidance
                - Methods/classes to modify
                - Validations, edge cases
                - Follow coding standards

                --------------------------------------
                STEP 4: OUTPUT FORMAT
                --------------------------------------
                Return ONLY ONE markdown response following the STRICT template below.
                Do NOT include any extra text outside the markdown block.

                --------------------------------------
                OUTPUT TEMPLATE (STRICT)
                --------------------------------------

                # GitHub Copilot Implementation Prompt

                ## Feature Title
                <Insert Title>

                ## Description
                <Insert Description>

                ## Acceptance Criteria
                - <criteria>

                ## Definition of Done
                - <DoD>

                ## Codebase Context
                - Relevant Modules:
                - Services:
                - Controllers:
                - Database Tables:
                - APIs:

                ## Implementation Plan
                1. <Step>

                ## Detailed Instructions for Copilot
                - Modify/Create:
                - Add validations:
                - Handle edge cases:
                - Follow patterns:

                ## Expected Outcome
                <Final result>
                """;

        return callAi(template, request);
    }

    private String callAi(String template, AnalyzeStoryRequest request) {
        try {
            String prompt = template
                    .replace("{title}", request.getTitle())
                    .replace("{description}", request.getDescription())
                    .replace("{acceptanceCriteria}", request.getAcceptanceCriteria())
                    .replace("{definitionOfDone}", request.getDefinitionOfDone());

            log.debug("Calling AI ({}) for story: {} with prompt length: {}",
                    aiService.getProviderName(), request.getJiraKey(), prompt.length());
            String content = aiService.generateResponse(prompt);
            log.debug("AI response received for story: {}, length: {}", request.getJiraKey(), content.length());
            return content;
        } catch (AiAnalysisException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("AI call failed for story {}: {}", request.getJiraKey(), ex.getMessage());
            throw new AiAnalysisException("AI analysis failed: " + ex.getMessage(), ex);
        }
    }

    private AnalyzedStoryResponse mapToResponse(AnalyzedStory story) {
        return AnalyzedStoryResponse.builder()
                .id(story.getId())
                .jiraKey(story.getJiraKey())
                .title(story.getTitle())
                .description(story.getDescription())
                .acceptanceCriteria(story.getAcceptanceCriteria())
                .definitionOfDone(story.getDefinitionOfDone())
                .copilotPrompt(story.getCopilotPrompt())
                .createdAt(story.getCreatedAt())
                .updatedAt(story.getUpdatedAt())
                .build();
    }
}
