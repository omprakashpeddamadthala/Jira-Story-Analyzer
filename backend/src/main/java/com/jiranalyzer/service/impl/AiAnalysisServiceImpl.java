package com.jiranalyzer.service.impl;

import com.jiranalyzer.dto.request.AnalyzeStoryRequest;
import com.jiranalyzer.dto.response.AnalyzedStoryResponse;
import com.jiranalyzer.entity.AnalyzedStory;
import com.jiranalyzer.exception.AiAnalysisException;
import com.jiranalyzer.repository.AnalyzedStoryRepository;
import com.jiranalyzer.service.AiAnalysisService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class AiAnalysisServiceImpl implements AiAnalysisService {

    private final ChatClient chatClient;
    private final AnalyzedStoryRepository analyzedStoryRepository;

    public AiAnalysisServiceImpl(ChatClient chatClient, AnalyzedStoryRepository analyzedStoryRepository) {
        this.chatClient = chatClient;
        this.analyzedStoryRepository = analyzedStoryRepository;
    }

    @Override
    public AnalyzedStoryResponse analyzeStory(AnalyzeStoryRequest request) {
        log.info("Analyzing story: {} - {}", request.getJiraKey(), request.getTitle());

        try {
            String simplifiedSummary = generateSimplifiedSummary(request);
            String implementationPlan = generateImplementationPlan(request);
            String apiContracts = generateApiContracts(request);
            String testSuggestions = generateTestSuggestions(request);

            AnalyzedStory story = AnalyzedStory.builder()
                    .jiraKey(request.getJiraKey())
                    .title(request.getTitle())
                    .description(request.getDescription())
                    .acceptanceCriteria(request.getAcceptanceCriteria())
                    .definitionOfDone(request.getDefinitionOfDone())
                    .simplifiedSummary(simplifiedSummary)
                    .implementationPlan(implementationPlan)
                    .apiContracts(apiContracts)
                    .testSuggestions(testSuggestions)
                    .build();

            AnalyzedStory savedStory = analyzedStoryRepository.save(story);
            log.info("Story analysis saved with ID: {}", savedStory.getId());

            return mapToResponse(savedStory);
        } catch (Exception ex) {
            log.error("Failed to analyze story {}: {}", request.getJiraKey(), ex.getMessage(), ex);
            throw new AiAnalysisException("Failed to analyze story: " + ex.getMessage(), ex);
        }
    }

    private String generateSimplifiedSummary(AnalyzeStoryRequest request) {
        String template = """
                You are a senior software engineer. Rephrase the following Jira story into a clear, concise, \
                developer-friendly summary that can be understood without any Jira context.

                Title: {title}
                Description: {description}
                Acceptance Criteria: {acceptanceCriteria}
                Definition of Done: {definitionOfDone}

                Provide a simplified summary in 3-5 sentences that captures:
                1. What needs to be built or changed
                2. The core business requirement
                3. Key technical considerations

                Output only the summary, no headers or labels.""";

        return callAi(template, request);
    }

    private String generateImplementationPlan(AnalyzeStoryRequest request) {
        String template = """
                You are a senior software engineer creating a step-by-step implementation plan \
                for GitHub Copilot to assist with coding.

                Title: {title}
                Description: {description}
                Acceptance Criteria: {acceptanceCriteria}
                Definition of Done: {definitionOfDone}

                Generate a detailed, numbered implementation plan with:
                1. Small, focused tasks (each should be completable in under 30 minutes)
                2. File paths and component names where changes are needed
                3. Specific code patterns or approaches to use
                4. Dependencies between tasks
                5. Configuration or environment changes needed

                Format each step as:
                Step N: [Brief title]
                - Description: [What to do]
                - Files: [Which files to create/modify]
                - Approach: [Technical approach]

                Keep it practical and actionable for a developer using AI-assisted coding.""";

        return callAi(template, request);
    }

    private String generateApiContracts(AnalyzeStoryRequest request) {
        String template = """
                You are a senior API architect. Based on the following Jira story, suggest REST API contracts \
                that would need to be created or modified.

                Title: {title}
                Description: {description}
                Acceptance Criteria: {acceptanceCriteria}
                Definition of Done: {definitionOfDone}

                For each API endpoint, provide:
                1. HTTP Method and Path
                2. Request body (JSON schema with types)
                3. Response body (JSON schema with types)
                4. Status codes and their meanings
                5. Query parameters if applicable
                6. Authentication requirements

                Format as clear API documentation. If no API changes are needed, explain why \
                and suggest any internal service contracts instead.""";

        return callAi(template, request);
    }

    private String generateTestSuggestions(AnalyzeStoryRequest request) {
        String template = """
                You are a senior QA engineer and test architect. Based on the following Jira story, \
                suggest comprehensive test cases.

                Title: {title}
                Description: {description}
                Acceptance Criteria: {acceptanceCriteria}
                Definition of Done: {definitionOfDone}

                Generate test cases organized by type:

                1. **Unit Tests**: Test individual functions/methods
                   - Test name, input, expected output, assertion

                2. **Integration Tests**: Test component interactions
                   - Test scenario, setup, execution, verification

                3. **Edge Cases**: Boundary conditions and error scenarios
                   - Scenario, why it matters, expected behavior

                4. **Acceptance Tests**: Map to acceptance criteria
                   - Given/When/Then format

                Be specific with test names and use realistic data examples.""";

        return callAi(template, request);
    }

    private String callAi(String template, AnalyzeStoryRequest request) {
        PromptTemplate promptTemplate = new PromptTemplate(template);
        Prompt prompt = promptTemplate.create(Map.of(
                "title", request.getTitle(),
                "description", request.getDescription(),
                "acceptanceCriteria", request.getAcceptanceCriteria(),
                "definitionOfDone", request.getDefinitionOfDone()
        ));

        ChatResponse response = chatClient.call(prompt);
        return response.getResult().getOutput().getContent();
    }

    private AnalyzedStoryResponse mapToResponse(AnalyzedStory story) {
        return AnalyzedStoryResponse.builder()
                .id(story.getId())
                .jiraKey(story.getJiraKey())
                .title(story.getTitle())
                .description(story.getDescription())
                .acceptanceCriteria(story.getAcceptanceCriteria())
                .definitionOfDone(story.getDefinitionOfDone())
                .simplifiedSummary(story.getSimplifiedSummary())
                .implementationPlan(story.getImplementationPlan())
                .apiContracts(story.getApiContracts())
                .testSuggestions(story.getTestSuggestions())
                .createdAt(story.getCreatedAt())
                .updatedAt(story.getUpdatedAt())
                .build();
    }
}
