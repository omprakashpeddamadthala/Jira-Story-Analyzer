package com.jiranalyzer.service.impl;

import com.jiranalyzer.config.AIProperties;
import com.jiranalyzer.exception.AiAnalysisException;
import com.jiranalyzer.service.AIService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;

@Slf4j
public class OpenAIServiceImpl implements AIService {

    private final ChatClient chatClient;
    private final AIProperties aiProperties;

    public OpenAIServiceImpl(ChatClient chatClient, AIProperties aiProperties) {
        this.chatClient = chatClient;
        this.aiProperties = aiProperties;
        log.info("OpenAI AI Service initialized with model: {}", aiProperties.getOpenai().getModel());
    }

    @Override
    public String generateResponse(String prompt) {
        validateApiKey();
        try {
            log.debug("Calling OpenAI with prompt length: {}", prompt.length());
            ChatResponse response = chatClient.call(new Prompt(prompt));
            String content = response.getResult() != null && response.getResult().getOutput() != null
                    ? response.getResult().getOutput().getContent()
                    : null;
            if (content == null) {
                throw new AiAnalysisException("OpenAI returned an empty or null response");
            }
            log.debug("OpenAI response received, length: {}", content.length());
            return content;
        } catch (AiAnalysisException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("OpenAI call failed: {}", ex.getMessage());
            String message = ex.getMessage() != null ? ex.getMessage() : "";
            if (message.contains("content type [text/plain]")
                    || message.contains("content type [text/html]")) {
                throw new AiAnalysisException(
                        "OpenAI API returned an unexpected error response. "
                                + "This typically indicates an invalid API key, expired key, or account billing issue. "
                                + "Please verify your OPENAI_API_KEY is correct and your OpenAI account is active at "
                                + "https://platform.openai.com/api-keys",
                        ex);
            }
            if (message.contains("authentication")
                    || message.contains("401")
                    || message.contains("403")) {
                throw new AiAnalysisException(
                        "OpenAI API authentication failed. Please check your API key configuration.", ex);
            }
            throw new AiAnalysisException("OpenAI API call failed: " + ex.getMessage(), ex);
        }
    }

    @Override
    public String getProviderName() {
        return "openai";
    }

    private void validateApiKey() {
        String apiKey = aiProperties.getOpenai().getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new AiAnalysisException(
                    "OpenAI API key is not configured. Please set 'ai.openai.api-key' in application.yml "
                            + "or provide the OPENAI_API_KEY environment variable.");
        }
    }
}
