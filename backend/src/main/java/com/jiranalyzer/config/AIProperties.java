package com.jiranalyzer.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "ai")
@Getter
@Setter
public class AIProperties {

    /**
     * The active AI provider. Supported values: "openai", "gemini".
     * Defaults to "openai" if not specified.
     */
    private String provider = "openai";

    private OpenAIConfig openai = new OpenAIConfig();
    private GeminiConfig gemini = new GeminiConfig();

    @Getter
    @Setter
    public static class OpenAIConfig {
        private String apiKey = "";
        private String model = "gpt-4o";
        private double temperature = 0.7;
    }

    @Getter
    @Setter
    public static class GeminiConfig {
        private String apiKey = "";
        private String model = "gemini-2.0-flash";
        private double temperature = 0.7;
    }
}
