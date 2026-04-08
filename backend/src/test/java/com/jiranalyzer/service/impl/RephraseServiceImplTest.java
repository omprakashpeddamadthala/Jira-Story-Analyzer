package com.jiranalyzer.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiranalyzer.dto.request.RephraseRequest;
import com.jiranalyzer.dto.response.RephraseResponse;
import com.jiranalyzer.exception.AiAnalysisException;
import com.jiranalyzer.service.AIService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RephraseServiceImplTest {

    @Mock
    private AIService aiService;

    private RephraseServiceImpl rephraseService;

    @BeforeEach
    void setUp() {
        rephraseService = new RephraseServiceImpl(aiService, new ObjectMapper());
    }

    @Test
    void shouldRephraseSuccessfully() {
        RephraseRequest request = RephraseRequest.builder()
                .title("Add login feature")
                .description("We need a login page")
                .acceptanceCriteria("User can log in")
                .build();

        String aiResponse = """
                {
                  "rephrasedTitle": "Implement User Authentication Login Page",
                  "rephrasedDescription": "Develop a secure login page that allows users to authenticate using email and password.",
                  "rephrasedAcceptanceCriteria": "Given a registered user, when they enter valid credentials, then they are authenticated and redirected to the dashboard."
                }
                """;

        when(aiService.generateResponse(anyString())).thenReturn(aiResponse);

        RephraseResponse response = rephraseService.rephrase(request);

        assertNotNull(response);
        assertEquals("Add login feature", response.getOriginalTitle());
        assertEquals("Implement User Authentication Login Page", response.getRephrasedTitle());
        assertNotNull(response.getRephrasedDescription());
        assertNotNull(response.getRephrasedAcceptanceCriteria());
        verify(aiService, times(1)).generateResponse(anyString());
    }

    @Test
    void shouldHandleMarkdownCodeFenceInResponse() {
        RephraseRequest request = RephraseRequest.builder()
                .title("Title")
                .description("Desc")
                .acceptanceCriteria("AC")
                .build();

        String aiResponse = """
                ```json
                {
                  "rephrasedTitle": "Better Title",
                  "rephrasedDescription": "Better Desc",
                  "rephrasedAcceptanceCriteria": "Better AC"
                }
                ```
                """;

        when(aiService.generateResponse(anyString())).thenReturn(aiResponse);

        RephraseResponse response = rephraseService.rephrase(request);

        assertNotNull(response);
        assertEquals("Better Title", response.getRephrasedTitle());
    }

    @Test
    void shouldThrowExceptionWhenAiFails() {
        RephraseRequest request = RephraseRequest.builder()
                .title("Title")
                .description("Desc")
                .acceptanceCriteria("AC")
                .build();

        when(aiService.generateResponse(anyString()))
                .thenThrow(new AiAnalysisException("AI service unavailable"));

        assertThrows(AiAnalysisException.class, () -> rephraseService.rephrase(request));
    }

    @Test
    void shouldPreserveOriginalValuesInResponse() {
        RephraseRequest request = RephraseRequest.builder()
                .title("Original Title")
                .description("Original Description")
                .acceptanceCriteria("Original AC")
                .build();

        String aiResponse = """
                {
                  "rephrasedTitle": "New Title",
                  "rephrasedDescription": "New Description",
                  "rephrasedAcceptanceCriteria": "New AC"
                }
                """;

        when(aiService.generateResponse(anyString())).thenReturn(aiResponse);

        RephraseResponse response = rephraseService.rephrase(request);

        assertEquals("Original Title", response.getOriginalTitle());
        assertEquals("Original Description", response.getOriginalDescription());
        assertEquals("Original AC", response.getOriginalAcceptanceCriteria());
        assertEquals("New Title", response.getRephrasedTitle());
    }
}
