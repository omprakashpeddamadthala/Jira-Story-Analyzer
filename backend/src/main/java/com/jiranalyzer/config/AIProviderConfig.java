package com.jiranalyzer.config;

import com.fasterxml.jackson.databind.ObjectMapper;
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
        log.info("==> Active AI Provider: OpenAI (model: {})", aiProperties.getOpenai().getModel());
        if (aiProperties.getOpenai().getApiKey() == null || aiProperties.getOpenai().getApiKey().isBlank()) {
            log.warn("OpenAI API key is not configured. AI analysis calls will fail until the key is provided. "
                    + "Set 'ai.openai.api-key' in application.yml or OPENAI_API_KEY environment variable.");
        }
        return new OpenAIServiceImpl(chatClient, aiProperties);
    }

    @Bean
    @ConditionalOnProperty(name = "ai.provider", havingValue = "gemini")
    public AIService geminiService(RestTemplate restTemplate, AIProperties aiProperties, ObjectMapper objectMapper) {
        log.info("==> Active AI Provider: Gemini (model: {})", aiProperties.getGemini().getModel());
        if (aiProperties.getGemini().getApiKey() == null || aiProperties.getGemini().getApiKey().isBlank()) {
            log.warn("Gemini API key is not configured. AI analysis calls will fail until the key is provided. "
                    + "Set 'ai.gemini.api-key' in application.yml or GEMINI_API_KEY environment variable.");
        }
        return new GeminiServiceImpl(restTemplate, aiProperties, objectMapper);
    }
}
