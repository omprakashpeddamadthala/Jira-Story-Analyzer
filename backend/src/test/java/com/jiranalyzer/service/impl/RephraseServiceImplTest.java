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

        String aiResponse = "{" +
                "\"rephrasedTitle\": \"Implement User Authentication Login Page\"," +
                "\"rephrasedDescription\": \"Develop a secure login page that allows users to authenticate using email and password.\"," +
                "\"rephrasedAcceptanceCriteria\": \"Given a registered user, when they enter valid credentials, then they are authenticated and redirected to the dashboard.\"," +
                "\"refinedStory\": \"## Refined Title\\nImplement User Authentication Login Page\\n\\n## Refined Description\\nDevelop a secure login page.\"" +
                "}";

        when(aiService.generateResponse(anyString())).thenReturn(aiResponse);

        RephraseResponse response = rephraseService.rephrase(request);

        assertNotNull(response);
        assertEquals("Add login feature", response.getOriginalTitle());
        assertEquals("Implement User Authentication Login Page", response.getRephrasedTitle());
        assertNotNull(response.getRephrasedDescription());
        assertNotNull(response.getRephrasedAcceptanceCriteria());
        assertNotNull(response.getRefinedStory());
        assertTrue(response.getRefinedStory().contains("Implement User Authentication Login Page"));
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

    @Test
    void shouldBuildRefinedStoryWhenAiDoesNotReturnIt() {
        RephraseRequest request = RephraseRequest.builder()
                .title("Title")
                .description("Desc")
                .acceptanceCriteria("AC")
                .build();

        // AI returns only three keys, no refinedStory
        String aiResponse = """
                {
                  "rephrasedTitle": "Better Title",
                  "rephrasedDescription": "Better Desc",
                  "rephrasedAcceptanceCriteria": "Better AC"
                }
                """;

        when(aiService.generateResponse(anyString())).thenReturn(aiResponse);

        RephraseResponse response = rephraseService.rephrase(request);

        assertNotNull(response.getRefinedStory());
        assertTrue(response.getRefinedStory().contains("Better Title"));
        assertTrue(response.getRefinedStory().contains("Better Desc"));
        assertTrue(response.getRefinedStory().contains("Better AC"));
    }

    @Test
    void shouldReturnRefinedStoryFromAiWhenProvided() {
        RephraseRequest request = RephraseRequest.builder()
                .title("Title")
                .description("Desc")
                .acceptanceCriteria("AC")
                .build();

        String fullStory = "## Refined Title\nGreat Title\n\n## Description\nGreat Desc";
        String aiResponse = "{" +
                "\"rephrasedTitle\": \"Great Title\"," +
                "\"rephrasedDescription\": \"Great Desc\"," +
                "\"rephrasedAcceptanceCriteria\": \"Great AC\"," +
                "\"refinedStory\": \"## Refined Title\\nGreat Title\\n\\n## Description\\nGreat Desc\"" +
                "}";

        when(aiService.generateResponse(anyString())).thenReturn(aiResponse);

        RephraseResponse response = rephraseService.rephrase(request);

        assertEquals(fullStory, response.getRefinedStory());
    }

    @Test
    void shouldInjectStoryFieldsIntoPrompt() {
        RephraseRequest request = RephraseRequest.builder()
                .title("My Title")
                .description("My Description")
                .acceptanceCriteria("My AC")
                .build();

        String aiResponse = """
                {
                  "rephrasedTitle": "T",
                  "rephrasedDescription": "D",
                  "rephrasedAcceptanceCriteria": "A",
                  "refinedStory": "story"
                }
                """;

        when(aiService.generateResponse(anyString())).thenReturn(aiResponse);

        rephraseService.rephrase(request);

        // Capture the prompt sent to the AI
        var captor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(aiService).generateResponse(captor.capture());
        String prompt = captor.getValue();

        // Verify the prompt contains the exact template markers and injected values
        assertTrue(prompt.contains("Senior Technical Architect"), "Prompt should contain the role");
        assertTrue(prompt.contains("My Title"), "Prompt should inject title");
        assertTrue(prompt.contains("My Description"), "Prompt should inject description");
        assertTrue(prompt.contains("My AC"), "Prompt should inject acceptance criteria");
        assertTrue(prompt.contains("Refined Title"), "Prompt should request refined title section");
        assertTrue(prompt.contains("Acceptance Criteria (Testable)"), "Prompt should request AC section");
        assertTrue(prompt.contains("Dependencies / Integrations"), "Prompt should request dependencies section");
        assertTrue(prompt.contains("Quality Checklist"), "Prompt should contain quality checklist");
    }

    @Test
    void shouldHandleNullAcceptanceCriteria() {
        RephraseRequest request = RephraseRequest.builder()
                .title("Title")
                .description("Description")
                .acceptanceCriteria(null)
                .build();

        String aiResponse = """
                {
                  "rephrasedTitle": "Better Title",
                  "rephrasedDescription": "Better Desc",
                  "rephrasedAcceptanceCriteria": "Better AC",
                  "refinedStory": "Full story"
                }
                """;

        when(aiService.generateResponse(anyString())).thenReturn(aiResponse);

        RephraseResponse response = rephraseService.rephrase(request);

        assertNotNull(response);
        assertEquals("Better Title", response.getRephrasedTitle());

        // Verify "Not provided" was injected for null AC
        var captor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(aiService).generateResponse(captor.capture());
        assertTrue(captor.getValue().contains("Not provided"));
    }
}
