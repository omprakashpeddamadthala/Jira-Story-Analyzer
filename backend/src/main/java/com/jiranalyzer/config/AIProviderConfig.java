package com.jiranalyzer.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiranalyzer.exception.AiAnalysisException;
import com.jiranalyzer.service.AIService;
import com.jiranalyzer.service.impl.GeminiServiceImpl;
import com.jiranalyzer.service.impl.OpenAIServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.ChatClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
@Slf4j
public class AIProviderConfig {

    @Bean
    @ConditionalOnProperty(name = "ai.provider", havingValue = "openai", matchIfMissing = true)
    public AIService openAIService(ChatClient chatClient, AIProperties aiProperties) {
        validateApiKey(aiProperties.getOpenai().getApiKey(), "OpenAI");
        log.info("==> Active AI Provider: OpenAI (model: {})", aiProperties.getOpenai().getModel());
        return new OpenAIServiceImpl(chatClient, aiProperties);
    }

    @Bean
    @ConditionalOnProperty(name = "ai.provider", havingValue = "gemini")
    public AIService geminiService(RestTemplate restTemplate, AIProperties aiProperties, ObjectMapper objectMapper) {
        validateApiKey(aiProperties.getGemini().getApiKey(), "Gemini");
        log.info("==> Active AI Provider: Gemini (model: {})", aiProperties.getGemini().getModel());
        return new GeminiServiceImpl(restTemplate, aiProperties, objectMapper);
    }

    private void validateApiKey(String apiKey, String providerName) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new AiAnalysisException(
                    providerName + " API key is not configured. Please set the 'ai."
                            + providerName.toLowerCase() + ".api-key' property in application.yml "
                            + "or provide it via environment variable.");
        }
    }
}
