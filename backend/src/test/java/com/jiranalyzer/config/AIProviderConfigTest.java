package com.jiranalyzer.config;

import com.jiranalyzer.service.AIService;
import com.jiranalyzer.service.impl.GeminiServiceImpl;
import com.jiranalyzer.service.impl.OpenAIServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class AIProviderConfigTest {

    @SpringBootTest
    @ActiveProfiles("test")
    @TestPropertySource(properties = {
            "ai.provider=openai",
            "ai.openai.api-key=test-openai-key",
            "spring.ai.openai.api-key=test-openai-key"
    })
    static class OpenAIProviderTest {

        @Autowired
        private AIService aiService;

        @Test
        void shouldLoadOpenAIProvider() {
            assertNotNull(aiService);
            assertInstanceOf(OpenAIServiceImpl.class, aiService);
            assertEquals("openai", aiService.getProviderName());
        }
    }

    @SpringBootTest
    @ActiveProfiles("test")
    @TestPropertySource(properties = {
            "ai.provider=gemini",
            "ai.gemini.api-key=test-gemini-key",
            "spring.ai.openai.api-key=not-used"
    })
    static class GeminiProviderTest {

        @Autowired
        private AIService aiService;

        @Test
        void shouldLoadGeminiProvider() {
            assertNotNull(aiService);
            assertInstanceOf(GeminiServiceImpl.class, aiService);
            assertEquals("gemini", aiService.getProviderName());
        }
    }

    @Test
    void shouldCreateOpenAIServiceWithoutApiKey() {
        AIProviderConfig config = new AIProviderConfig();
        AIProperties properties = new AIProperties();
        properties.setProvider("openai");
        properties.getOpenai().setApiKey("");

        ChatClient mockChatClient = mock(ChatClient.class);
        AIService service = config.openAIService(mockChatClient, properties);

        assertNotNull(service);
        assertInstanceOf(OpenAIServiceImpl.class, service);
    }

    @Test
    void shouldCreateGeminiServiceWithoutApiKey() {
        AIProviderConfig config = new AIProviderConfig();
        AIProperties properties = new AIProperties();
        properties.setProvider("gemini");
        properties.getGemini().setApiKey("");

        RestTemplate mockRestTemplate = mock(RestTemplate.class);
        ObjectMapper objectMapper = new ObjectMapper();
        AIService service = config.geminiService(mockRestTemplate, properties, objectMapper);

        assertNotNull(service);
        assertInstanceOf(GeminiServiceImpl.class, service);
    }

    @Test
    void shouldCreateOpenAIServiceWithValidApiKey() {
        AIProviderConfig config = new AIProviderConfig();
        AIProperties properties = new AIProperties();
        properties.setProvider("openai");
        properties.getOpenai().setApiKey("valid-key");

        ChatClient mockChatClient = mock(ChatClient.class);
        AIService service = config.openAIService(mockChatClient, properties);

        assertNotNull(service);
        assertEquals("openai", service.getProviderName());
    }

    @Test
    void shouldCreateGeminiServiceWithValidApiKey() {
        AIProviderConfig config = new AIProviderConfig();
        AIProperties properties = new AIProperties();
        properties.setProvider("gemini");
        properties.getGemini().setApiKey("valid-key");

        RestTemplate mockRestTemplate = mock(RestTemplate.class);
        ObjectMapper objectMapper = new ObjectMapper();
        AIService service = config.geminiService(mockRestTemplate, properties, objectMapper);

        assertNotNull(service);
        assertEquals("gemini", service.getProviderName());
    }
}
