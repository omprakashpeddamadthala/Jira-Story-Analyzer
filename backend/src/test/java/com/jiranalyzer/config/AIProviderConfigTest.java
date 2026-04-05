package com.jiranalyzer.config;

import com.jiranalyzer.exception.AiAnalysisException;
import com.jiranalyzer.service.AIService;
import com.jiranalyzer.service.impl.GeminiServiceImpl;
import com.jiranalyzer.service.impl.OpenAIServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

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
    void shouldThrowErrorWhenOpenAIKeyMissing() {
        AIProviderConfig config = new AIProviderConfig();
        AIProperties properties = new AIProperties();
        properties.setProvider("openai");
        properties.getOpenai().setApiKey("");

        assertThrows(AiAnalysisException.class, () ->
                config.openAIService(null, properties));
    }

    @Test
    void shouldThrowErrorWhenGeminiKeyMissing() {
        AIProviderConfig config = new AIProviderConfig();
        AIProperties properties = new AIProperties();
        properties.setProvider("gemini");
        properties.getGemini().setApiKey("");

        assertThrows(AiAnalysisException.class, () ->
                config.geminiService(null, properties, null));
    }

    @Test
    void shouldThrowErrorWhenOpenAIKeyIsNull() {
        AIProviderConfig config = new AIProviderConfig();
        AIProperties properties = new AIProperties();
        properties.getOpenai().setApiKey(null);

        assertThrows(AiAnalysisException.class, () ->
                config.openAIService(null, properties));
    }

    @Test
    void shouldThrowErrorWhenGeminiKeyIsNull() {
        AIProviderConfig config = new AIProviderConfig();
        AIProperties properties = new AIProperties();
        properties.getGemini().setApiKey(null);

        assertThrows(AiAnalysisException.class, () ->
                config.geminiService(null, properties, null));
    }

    @Test
    void shouldThrowErrorWhenOpenAIKeyIsBlank() {
        AIProviderConfig config = new AIProviderConfig();
        AIProperties properties = new AIProperties();
        properties.getOpenai().setApiKey("   ");

        assertThrows(AiAnalysisException.class, () ->
                config.openAIService(null, properties));
    }
}
