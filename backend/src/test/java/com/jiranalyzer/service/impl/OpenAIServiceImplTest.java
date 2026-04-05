package com.jiranalyzer.service.impl;

import com.jiranalyzer.config.AIProperties;
import com.jiranalyzer.exception.AiAnalysisException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.Generation;
import org.springframework.ai.chat.prompt.Prompt;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OpenAIServiceImplTest {

    @Mock
    private ChatClient chatClient;

    private OpenAIServiceImpl openAIService;

    @BeforeEach
    void setUp() {
        AIProperties properties = new AIProperties();
        properties.getOpenai().setApiKey("test-key");
        properties.getOpenai().setModel("gpt-4o");
        openAIService = new OpenAIServiceImpl(chatClient, properties);
    }

    @Test
    void shouldReturnProviderName() {
        assertEquals("openai", openAIService.getProviderName());
    }

    @Test
    void shouldGenerateResponse() {
        Generation generation = new Generation("Test AI response");
        ChatResponse chatResponse = new ChatResponse(java.util.List.of(generation));

        when(chatClient.call(any(Prompt.class))).thenReturn(chatResponse);

        String result = openAIService.generateResponse("Test prompt");

        assertEquals("Test AI response", result);
        verify(chatClient).call(any(Prompt.class));
    }

    @Test
    void shouldThrowAiAnalysisExceptionOnAuthError() {
        when(chatClient.call(any(Prompt.class)))
                .thenThrow(new RuntimeException("401 Unauthorized"));

        AiAnalysisException exception = assertThrows(AiAnalysisException.class,
                () -> openAIService.generateResponse("Test prompt"));

        assertTrue(exception.getMessage().contains("authentication failed"));
    }

    @Test
    void shouldThrowAiAnalysisExceptionOnGenericError() {
        when(chatClient.call(any(Prompt.class)))
                .thenThrow(new RuntimeException("Connection timeout"));

        AiAnalysisException exception = assertThrows(AiAnalysisException.class,
                () -> openAIService.generateResponse("Test prompt"));

        assertTrue(exception.getMessage().contains("OpenAI API call failed"));
    }
}
