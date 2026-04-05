package com.jiranalyzer.service.impl;

import com.jiranalyzer.dto.request.AnalyzeStoryRequest;
import com.jiranalyzer.dto.response.AnalyzedStoryResponse;
import com.jiranalyzer.entity.AnalyzedStory;
import com.jiranalyzer.exception.AiAnalysisException;
import com.jiranalyzer.repository.AnalyzedStoryRepository;
import com.jiranalyzer.service.AIService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiAnalysisServiceImplTest {

    @Mock
    private AIService aiService;

    @Mock
    private AnalyzedStoryRepository analyzedStoryRepository;

    private AiAnalysisServiceImpl aiAnalysisService;

    @BeforeEach
    void setUp() {
        when(aiService.getProviderName()).thenReturn("openai");
        aiAnalysisService = new AiAnalysisServiceImpl(aiService, analyzedStoryRepository);
    }

    @Test
    void shouldAnalyzeStorySuccessfully() {
        AnalyzeStoryRequest request = AnalyzeStoryRequest.builder()
                .jiraKey("TEST-123")
                .title("Test Story")
                .description("Test description")
                .acceptanceCriteria("Test criteria")
                .definitionOfDone("Test done")
                .build();

        when(aiService.generateResponse(anyString())).thenReturn("AI generated content");
        when(analyzedStoryRepository.findByJiraKey("TEST-123")).thenReturn(Optional.empty());

        AnalyzedStory savedStory = AnalyzedStory.builder()
                .id(UUID.randomUUID())
                .jiraKey("TEST-123")
                .title("Test Story")
                .description("Test description")
                .acceptanceCriteria("Test criteria")
                .definitionOfDone("Test done")
                .simplifiedSummary("AI generated content")
                .implementationPlan("AI generated content")
                .apiContracts("AI generated content")
                .testSuggestions("AI generated content")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(analyzedStoryRepository.save(any(AnalyzedStory.class))).thenReturn(savedStory);

        AnalyzedStoryResponse response = aiAnalysisService.analyzeStory(request);

        assertNotNull(response);
        assertEquals("TEST-123", response.getJiraKey());
        assertEquals("Test Story", response.getTitle());
        verify(aiService, times(4)).generateResponse(anyString());
        verify(analyzedStoryRepository).save(any(AnalyzedStory.class));
    }

    @Test
    void shouldUpdateExistingStory() {
        AnalyzeStoryRequest request = AnalyzeStoryRequest.builder()
                .jiraKey("TEST-123")
                .title("Updated Story")
                .description("Updated description")
                .acceptanceCriteria("Updated criteria")
                .definitionOfDone("Updated done")
                .build();

        AnalyzedStory existingStory = AnalyzedStory.builder()
                .id(UUID.randomUUID())
                .jiraKey("TEST-123")
                .title("Old Story")
                .createdAt(LocalDateTime.now())
                .build();

        when(aiService.generateResponse(anyString())).thenReturn("Updated AI content");
        when(analyzedStoryRepository.findByJiraKey("TEST-123")).thenReturn(Optional.of(existingStory));
        when(analyzedStoryRepository.save(any(AnalyzedStory.class))).thenReturn(existingStory);

        AnalyzedStoryResponse response = aiAnalysisService.analyzeStory(request);

        assertNotNull(response);
        verify(analyzedStoryRepository).save(any(AnalyzedStory.class));
    }

    @Test
    void shouldThrowExceptionWhenAiFails() {
        AnalyzeStoryRequest request = AnalyzeStoryRequest.builder()
                .jiraKey("TEST-456")
                .title("Failing Story")
                .description("Description")
                .acceptanceCriteria("Criteria")
                .definitionOfDone("Done")
                .build();

        when(aiService.generateResponse(anyString()))
                .thenThrow(new AiAnalysisException("AI service unavailable"));

        assertThrows(AiAnalysisException.class,
                () -> aiAnalysisService.analyzeStory(request));
    }

    @Test
    void shouldCallAiServiceFourTimesForCompleteAnalysis() {
        AnalyzeStoryRequest request = AnalyzeStoryRequest.builder()
                .jiraKey("TEST-789")
                .title("Test Story")
                .description("Description")
                .acceptanceCriteria("Criteria")
                .definitionOfDone("Done")
                .build();

        when(aiService.generateResponse(anyString())).thenReturn("Generated content");
        when(analyzedStoryRepository.findByJiraKey("TEST-789")).thenReturn(Optional.empty());

        AnalyzedStory savedStory = AnalyzedStory.builder()
                .id(UUID.randomUUID())
                .jiraKey("TEST-789")
                .title("Test Story")
                .description("Description")
                .simplifiedSummary("Generated content")
                .implementationPlan("Generated content")
                .apiContracts("Generated content")
                .testSuggestions("Generated content")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(analyzedStoryRepository.save(any(AnalyzedStory.class))).thenReturn(savedStory);

        aiAnalysisService.analyzeStory(request);

        // Verify AI is called 4 times: summary, implementation plan, API contracts, test suggestions
        verify(aiService, times(4)).generateResponse(anyString());
    }
}
