package com.jiranalyzer.service;

/**
 * Common interface for AI provider implementations.
 * Allows runtime switching between different AI providers (OpenAI, Gemini, etc.)
 * based on configuration.
 */
public interface AIService {

    /**
     * Generate a response from the AI provider for the given prompt.
     *
     * @param prompt the text prompt to send to the AI provider
     * @return the AI-generated response text
     */
    String generateResponse(String prompt);

    /**
     * Get the name of the active AI provider.
     *
     * @return provider name (e.g., "openai", "gemini")
     */
    String getProviderName();
}
