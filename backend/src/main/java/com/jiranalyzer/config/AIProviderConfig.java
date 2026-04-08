package com.jiranalyzer.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiranalyzer.service.AIService;
import com.jiranalyzer.service.impl.GeminiServiceImpl;
import com.jiranalyzer.service.impl.OpenAIServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

/**
 * AI Provider Factory configuration.
 *
 * Uses the Strategy Pattern to resolve the active {@link AIService} implementation
 * at startup based on the {@code ai.provider} property and available API keys.
 *
 * Resolution rules:
 * <ol>
 *   <li>If both keys are present, the value of {@code ai.provider} decides.</li>
 *   <li>If only one key is present, that provider is used regardless of {@code ai.provider}.</li>
 *   <li>If no key is present, a warning is logged and the configured provider is used
 *       (calls will fail at runtime with a clear error).</li>
 * </ol>
 */
@Configuration
@Slf4j
public class AIProviderConfig {

    @Bean
    public AIService aiService(
            AIProperties aiProperties,
            @Autowired(required = false) ChatClient chatClient,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {

        String configuredProvider = aiProperties.getProvider();
        boolean hasOpenAiKey = StringUtils.hasText(aiProperties.getOpenai().getApiKey());
        boolean hasGeminiKey = StringUtils.hasText(aiProperties.getGemini().getApiKey());

        String resolvedProvider = resolveProvider(configuredProvider, hasOpenAiKey, hasGeminiKey);

        log.info("==> AI Provider resolution: configured='{}', openai-key={}, gemini-key={}, resolved='{}'",
                configuredProvider, hasOpenAiKey ? "present" : "missing",
                hasGeminiKey ? "present" : "missing", resolvedProvider);

        if ("gemini".equalsIgnoreCase(resolvedProvider)) {
            log.info("==> Active AI Provider: Gemini (model: {})", aiProperties.getGemini().getModel());
            return new GeminiServiceImpl(restTemplate, aiProperties, objectMapper);
        }

        // Default to OpenAI
        if (chatClient == null) {
            throw new IllegalStateException(
                    "AI provider resolved to 'openai' but Spring AI ChatClient bean is not available. "
                            + "Ensure OPENAI_API_KEY is set and spring-ai-openai-spring-boot-starter is on the classpath.");
        }
        log.info("==> Active AI Provider: OpenAI (model: {})", aiProperties.getOpenai().getModel());
        return new OpenAIServiceImpl(chatClient, aiProperties);
    }

    /**
     * Resolve which provider to activate based on configured value and available keys.
     */
    private String resolveProvider(String configured, boolean hasOpenAiKey, boolean hasGeminiKey) {
        if (hasOpenAiKey && hasGeminiKey) {
            log.info("Both AI API keys present — using configured provider: {}", configured);
            return configured;
        }
        if (hasOpenAiKey && !hasGeminiKey) {
            if (!"openai".equalsIgnoreCase(configured)) {
                log.warn("ai.provider='{}' but only OPENAI_API_KEY is available — falling back to openai", configured);
            }
            return "openai";
        }
        if (!hasOpenAiKey && hasGeminiKey) {
            if (!"gemini".equalsIgnoreCase(configured)) {
                log.warn("ai.provider='{}' but only GEMINI_API_KEY is available — falling back to gemini", configured);
            }
            return "gemini";
        }
        // Neither key present — use configured provider; runtime calls will fail with clear error
        log.warn("No AI API keys configured. AI analysis calls will fail until a key is provided.");
        return configured;
    }
}
