package com.jiranalyzer.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiranalyzer.config.AIProperties;
import com.jiranalyzer.exception.AiAnalysisException;
import com.jiranalyzer.service.AIService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
public class GeminiServiceImpl implements AIService {

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

    private final RestTemplate restTemplate;
    private final AIProperties aiProperties;
    private final ObjectMapper objectMapper;

    public GeminiServiceImpl(RestTemplate restTemplate, AIProperties aiProperties, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.aiProperties = aiProperties;
        this.objectMapper = objectMapper;
        log.info("Gemini AI Service initialized with model: {}", aiProperties.getGemini().getModel());
    }

    @Override
    public String generateResponse(String prompt) {
        validateApiKey();
        try {
            log.debug("Calling Gemini with prompt length: {}", prompt.length());

            Map<String, Object> requestBody = buildRequestBody(prompt);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String url = GEMINI_API_URL
                    .replace("{model}", aiProperties.getGemini().getModel())
                    .replace("{apiKey}", aiProperties.getGemini().getApiKey());

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            String content = extractContent(response.getBody());
            log.debug("Gemini response received, length: {}", content.length());
            return content;
        } catch (HttpClientErrorException ex) {
            log.error("Gemini API call failed with status {}: {}", ex.getStatusCode(), ex.getMessage());
            if (ex.getStatusCode().value() == 401 || ex.getStatusCode().value() == 403) {
                throw new AiAnalysisException(
                        "Gemini API authentication failed. Please check your API key configuration.", ex);
            }
            throw new AiAnalysisException("Gemini API call failed: " + ex.getMessage(), ex);
        } catch (AiAnalysisException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Gemini call failed: {}", ex.getMessage());
            throw new AiAnalysisException("Gemini API call failed: " + ex.getMessage(), ex);
        }
    }

    @Override
    public String getProviderName() {
        return "gemini";
    }

    private Map<String, Object> buildRequestBody(String prompt) {
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> contentPart = Map.of("parts", List.of(textPart));
        Map<String, Object> generationConfig = Map.of(
                "temperature", aiProperties.getGemini().getTemperature()
        );

        return Map.of(
                "contents", List.of(contentPart),
                "generationConfig", generationConfig
        );
    }

    private void validateApiKey() {
        String apiKey = aiProperties.getGemini().getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new AiAnalysisException(
                    "Gemini API key is not configured. Please set 'ai.gemini.api-key' in application.yml "
                            + "or provide the GEMINI_API_KEY environment variable.");
        }
    }

    private String extractContent(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode content = candidates.get(0).path("content").path("parts");
                if (content.isArray() && !content.isEmpty()) {
                    return content.get(0).path("text").asText();
                }
            }
            throw new AiAnalysisException("Unexpected Gemini API response format: no content found");
        } catch (AiAnalysisException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AiAnalysisException("Failed to parse Gemini API response: " + ex.getMessage(), ex);
        }
    }
}
