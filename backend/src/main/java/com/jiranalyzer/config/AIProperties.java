package com.jiranalyzer.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
@ConfigurationProperties(prefix = "ai")
@Getter
@Setter
@Slf4j
public class AIProperties {

    /**
     * The active AI provider. Supported values: "openai", "gemini".
     * Must be set via AI_PROVIDER environment variable.
     */
    private String provider;

    private OpenAIConfig openai = new OpenAIConfig();
    private GeminiConfig gemini = new GeminiConfig();

    @PostConstruct
    public void validate() {
        if (!StringUtils.hasText(provider)) {
            throw new IllegalStateException(
                    "AI provider is not configured. Set AI_PROVIDER environment variable to 'openai' or 'gemini'.");
        }
        if (!"openai".equalsIgnoreCase(provider) && !"gemini".equalsIgnoreCase(provider)) {
            throw new IllegalStateException(
                    "Unsupported AI provider: '" + provider + "'. Supported values: 'openai', 'gemini'.");
        }

        if ("openai".equalsIgnoreCase(provider) && !StringUtils.hasText(openai.getApiKey())) {
            log.warn("AI provider is set to 'openai' but OPENAI_API_KEY is not configured. "
                    + "AI analysis calls will fail until the key is provided.");
        }
        if ("gemini".equalsIgnoreCase(provider) && !StringUtils.hasText(gemini.getApiKey())) {
            log.warn("AI provider is set to 'gemini' but GEMINI_API_KEY is not configured. "
                    + "AI analysis calls will fail until the key is provided.");
        }

        log.info("AI configuration loaded — provider: {}, openai model: {}, gemini model: {}",
                provider, openai.getModel(), gemini.getModel());
    }

    @Getter
    @Setter
    public static class OpenAIConfig {
        private String apiKey;
        private String model;
        private double temperature;
    }

    @Getter
    @Setter
    public static class GeminiConfig {
        private String apiKey;
        private String model;
        private double temperature;
    }
}
