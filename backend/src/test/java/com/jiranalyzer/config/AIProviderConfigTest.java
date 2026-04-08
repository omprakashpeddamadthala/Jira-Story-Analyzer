package com.jiranalyzer.config;

import com.jiranalyzer.service.AIService;
import com.jiranalyzer.service.impl.GeminiServiceImpl;
import com.jiranalyzer.service.impl.OpenAIServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.ChatClient;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class AIProviderConfigTest {

    private final AIProviderConfig config = new AIProviderConfig();
    private final RestTemplate mockRestTemplate = mock(RestTemplate.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ChatClient mockChatClient = mock(ChatClient.class);

    @Test
    void shouldResolveOpenAIWhenBothKeysPresent() {
        AIProperties properties = createProperties("openai", "openai-key", "gemini-key");

        AIService service = config.aiService(properties, mockChatClient, mockRestTemplate, objectMapper);

        assertNotNull(service);
        assertInstanceOf(OpenAIServiceImpl.class, service);
        assertEquals("openai", service.getProviderName());
    }

    @Test
    void shouldResolveGeminiWhenBothKeysPresent() {
        AIProperties properties = createProperties("gemini", "openai-key", "gemini-key");

        AIService service = config.aiService(properties, mockChatClient, mockRestTemplate, objectMapper);

        assertNotNull(service);
        assertInstanceOf(GeminiServiceImpl.class, service);
        assertEquals("gemini", service.getProviderName());
    }

    @Test
    void shouldFallbackToOpenAIWhenOnlyOpenAIKeyPresent() {
        AIProperties properties = createProperties("gemini", "openai-key", null);

        AIService service = config.aiService(properties, mockChatClient, mockRestTemplate, objectMapper);

        assertNotNull(service);
        assertInstanceOf(OpenAIServiceImpl.class, service);
    }

    @Test
    void shouldFallbackToGeminiWhenOnlyGeminiKeyPresent() {
        AIProperties properties = createProperties("openai", null, "gemini-key");

        AIService service = config.aiService(properties, mockChatClient, mockRestTemplate, objectMapper);

        assertNotNull(service);
        assertInstanceOf(GeminiServiceImpl.class, service);
    }

    @Test
    void shouldCreateGeminiServiceWithoutApiKey() {
        AIProperties properties = createProperties("gemini", null, null);

        AIService service = config.aiService(properties, mockChatClient, mockRestTemplate, objectMapper);

        assertNotNull(service);
        assertInstanceOf(GeminiServiceImpl.class, service);
    }

    @Test
    void shouldThrowWhenOpenAIResolvedButNoChatClient() {
        AIProperties properties = createProperties("openai", null, null);

        assertThrows(IllegalStateException.class,
                () -> config.aiService(properties, null, mockRestTemplate, objectMapper));
    }

    @Test
    void shouldCreateOpenAIServiceWithValidApiKey() {
        AIProperties properties = createProperties("openai", "valid-key", null);

        AIService service = config.aiService(properties, mockChatClient, mockRestTemplate, objectMapper);

        assertNotNull(service);
        assertEquals("openai", service.getProviderName());
    }

    @Test
    void shouldCreateGeminiServiceWithValidApiKey() {
        AIProperties properties = createProperties("gemini", null, "valid-key");

        AIService service = config.aiService(properties, mockChatClient, mockRestTemplate, objectMapper);

        assertNotNull(service);
        assertEquals("gemini", service.getProviderName());
    }

    private AIProperties createProperties(String provider, String openAiKey, String geminiKey) {
        AIProperties properties = new AIProperties();
        properties.setProvider(provider);
        if (openAiKey != null) {
            properties.getOpenai().setApiKey(openAiKey);
        }
        if (geminiKey != null) {
            properties.getGemini().setApiKey(geminiKey);
        }
        return properties;
    }
}
