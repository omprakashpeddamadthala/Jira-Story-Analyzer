package com.jiranalyzer.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiranalyzer.config.AIProperties;
import com.jiranalyzer.exception.AiAnalysisException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GeminiServiceImplTest {

    @Mock
    private RestTemplate restTemplate;

    private GeminiServiceImpl geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        AIProperties properties = new AIProperties();
        properties.getGemini().setApiKey("test-gemini-key");
        properties.getGemini().setModel("gemini-2.0-flash");
        geminiService = new GeminiServiceImpl(restTemplate, properties, objectMapper);
    }

    @Test
    void shouldReturnProviderName() {
        assertEquals("gemini", geminiService.getProviderName());
    }

    @Test
    void shouldGenerateResponse() {
        String geminiResponse = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "Test Gemini response"
                          }
                        ]
                      }
                    }
                  ]
                }
                """;

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(geminiResponse, HttpStatus.OK));

        String result = geminiService.generateResponse("Test prompt");

        assertEquals("Test Gemini response", result);
        verify(restTemplate).postForEntity(anyString(), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void shouldThrowAiAnalysisExceptionOnAuthError() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED));

        AiAnalysisException exception = assertThrows(AiAnalysisException.class,
                () -> geminiService.generateResponse("Test prompt"));

        assertTrue(exception.getMessage().contains("authentication failed"));
    }

    @Test
    void shouldThrowAiAnalysisExceptionOnForbiddenError() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.FORBIDDEN));

        AiAnalysisException exception = assertThrows(AiAnalysisException.class,
                () -> geminiService.generateResponse("Test prompt"));

        assertTrue(exception.getMessage().contains("authentication failed"));
    }

    @Test
    void shouldThrowAiAnalysisExceptionOnGenericError() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("Connection timeout"));

        AiAnalysisException exception = assertThrows(AiAnalysisException.class,
                () -> geminiService.generateResponse("Test prompt"));

        assertTrue(exception.getMessage().contains("Gemini API call failed"));
    }

    @Test
    void shouldThrowOnEmptyResponse() {
        String emptyResponse = """
                {
                  "candidates": []
                }
                """;

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(emptyResponse, HttpStatus.OK));

        assertThrows(AiAnalysisException.class,
                () -> geminiService.generateResponse("Test prompt"));
    }

    @Test
    void shouldThrowOnMalformedResponse() {
        String malformedResponse = "not valid json";

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(malformedResponse, HttpStatus.OK));

        assertThrows(AiAnalysisException.class,
                () -> geminiService.generateResponse("Test prompt"));
    }

    @Test
    void shouldThrowOnMissingApiKeyAtCallTime() {
        AIProperties properties = new AIProperties();
        properties.getGemini().setApiKey("");
        properties.getGemini().setModel("gemini-2.0-flash");
        GeminiServiceImpl serviceWithNoKey = new GeminiServiceImpl(restTemplate, properties, objectMapper);

        AiAnalysisException exception = assertThrows(AiAnalysisException.class,
                () -> serviceWithNoKey.generateResponse("Test prompt"));

        assertTrue(exception.getMessage().contains("API key is not configured"));
    }

    @Test
    void shouldThrowOnNullApiKeyAtCallTime() {
        AIProperties properties = new AIProperties();
        properties.getGemini().setApiKey(null);
        properties.getGemini().setModel("gemini-2.0-flash");
        GeminiServiceImpl serviceWithNullKey = new GeminiServiceImpl(restTemplate, properties, objectMapper);

        AiAnalysisException exception = assertThrows(AiAnalysisException.class,
                () -> serviceWithNullKey.generateResponse("Test prompt"));

        assertTrue(exception.getMessage().contains("API key is not configured"));
    }
}
