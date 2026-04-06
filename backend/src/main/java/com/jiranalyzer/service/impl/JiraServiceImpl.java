package com.jiranalyzer.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiranalyzer.service.JiraSettingsService;
import com.jiranalyzer.dto.response.JiraStoryResponse;
import com.jiranalyzer.exception.JiraApiException;
import com.jiranalyzer.service.JiraService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class JiraServiceImpl implements JiraService {

    private final RestTemplate restTemplate;
    private final JiraSettingsService settingsService;
    private final ObjectMapper objectMapper;

    public JiraServiceImpl(RestTemplate restTemplate, JiraSettingsService settingsService, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.settingsService = settingsService;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<JiraStoryResponse> fetchAssignedStories() {
        log.info("Fetching assigned Jira stories");
        String baseUrl = normalizeBaseUrl(settingsService.getEffectiveBaseUrl());
        log.debug("Jira base URL: {}", baseUrl);
        log.debug("Jira email: {}", settingsService.getEffectiveEmail());
        
        String token = settingsService.getEffectiveApiToken();
        log.debug("API token length: {}", token != null ? token.length() : 0);
        
        // First get current user info to get accountId
        String myselfUrl = baseUrl + "/rest/api/3/myself";
        log.debug("Myself URL: {}", myselfUrl);
        String accountId;
        try {
            HttpEntity<String> entity = new HttpEntity<>(createAuthHeaders(settingsService.getEffectiveEmail(), settingsService.getEffectiveApiToken()));
            ResponseEntity<String> response = restTemplate.exchange(myselfUrl, HttpMethod.GET, entity, String.class);
            JsonNode myself = objectMapper.readTree(response.getBody());
            accountId = myself.get("accountId").asText();
            log.info("Current user accountId: {}", accountId);
        } catch (Exception ex) {
            log.error("Failed to get current user info: {}", ex.getMessage());
            throw new JiraApiException("Failed to get current user info", ex);
        }
        
        // Use accountId in JQL
        String jql = "assignee = '" + accountId + "' AND project = 'SCRUM' AND statusCategory != 3";
        log.info("JQL query: {}", jql);
        
        String url = settingsService.getEffectiveBaseUrl() + "/rest/api/3/search/jql";

        try {
            HttpHeaders headers = createAuthHeaders(settingsService.getEffectiveEmail(), settingsService.getEffectiveApiToken());
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> body = new HashMap<>();
            body.put("jql", jql);
            body.put("fields", List.of("summary", "description", "status", "priority", "assignee", "issuetype"));
            body.put("maxResults", 50);
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);
            
            log.info("Jira API raw response: {}", response.getBody());
            return parseJiraSearchResponse(response.getBody());
        } catch (RestClientException ex) {
            log.error("Failed to fetch Jira stories: {}", ex.getMessage(), ex);
            throw new JiraApiException("Failed to fetch assigned stories from Jira", ex);
        }
    }

    @Override
    public JiraStoryResponse fetchStoryByKey(String jiraKey) {
        log.info("Fetching Jira story by key: {}", jiraKey);
        String baseUrl = normalizeBaseUrl(settingsService.getEffectiveBaseUrl());
        String url = baseUrl + "/rest/api/3/issue/" + jiraKey
                + "?fields=summary,description,status,priority,assignee,issuetype";

        try {
            HttpEntity<String> entity = new HttpEntity<>(createAuthHeaders(settingsService.getEffectiveEmail(), settingsService.getEffectiveApiToken()));
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            return parseSingleIssue(objectMapper.readTree(response.getBody()));
        } catch (RestClientException ex) {
            log.error("Failed to fetch Jira story {}: {}", jiraKey, ex.getMessage(), ex);
            throw new JiraApiException("Failed to fetch story " + jiraKey + " from Jira", ex);
        } catch (Exception ex) {
            log.error("Failed to parse Jira story {}: {}", jiraKey, ex.getMessage(), ex);
            throw new JiraApiException("Failed to parse story " + jiraKey, ex);
        }
    }

    @Override
    public Map<String, Object> testConnection(String testBaseUrl, String testEmail, String testApiToken) {
        log.info("Testing Jira connection. Provided baseUrl: '{}', email: '{}'. Provided token length: {}", 
                testBaseUrl, testEmail, testApiToken != null ? testApiToken.length() : "null");
        
        Map<String, Object> result = new HashMap<>();
        try {
            String baseUrl = (testBaseUrl != null && !testBaseUrl.isBlank()) 
                    ? normalizeBaseUrl(testBaseUrl) 
                    : normalizeBaseUrl(settingsService.getEffectiveBaseUrl());
            String email = (testEmail != null && !testEmail.isBlank()) 
                    ? testEmail 
                    : settingsService.getEffectiveEmail();
            String token = (testApiToken != null && !testApiToken.isBlank()) 
                    ? testApiToken 
                    : settingsService.getEffectiveApiToken();

            log.info("Effective credentials for test -> baseUrl: '{}', email: '{}', token length: {}, token startsWith: '{}', token endsWith: '{}'", 
                baseUrl, email, token != null ? token.length() : "null", 
                token != null && token.length() > 3 ? token.substring(0, 3) : "NA",
                token != null && token.length() > 3 ? token.substring(token.length() - 3) : "NA");

            if (baseUrl == null || baseUrl.isBlank()) {
                result.put("success", false);
                result.put("error", "Jira base URL is missing. Please configure it.");
                return result;
            }
            if (email == null || email.isBlank() || token == null || token.isBlank()) {
                result.put("success", false);
                result.put("error", "Jira email or API token is missing. Please configure them.");
                return result;
            }
            log.info("Testing connection to: {}", baseUrl);
            
            String myselfUrl = baseUrl + "/rest/api/3/myself";
            HttpEntity<String> entity = new HttpEntity<>(createAuthHeaders(email, token));
            ResponseEntity<String> response = restTemplate.exchange(myselfUrl, HttpMethod.GET, entity, String.class);
            JsonNode myself = objectMapper.readTree(response.getBody());
            result.put("success", true);
            result.put("displayName", getTextValue(myself, "displayName"));
            result.put("email", getTextValue(myself, "emailAddress"));
            log.info("Jira connection test successful for user: {}", result.get("displayName"));
        } catch (RestClientException ex) {
            log.warn("Jira connection test failed (REST error): {}", ex.getMessage());
            result.put("success", false);
            result.put("error", "Invalid credentials or URL unreachable: " + ex.getMessage());
        } catch (Exception ex) {
            log.warn("Jira connection test failed: {}", ex.getMessage());
            result.put("success", false);
            result.put("error", ex.getMessage());
        }
        return result;
    }

    private HttpHeaders createAuthHeaders(String email, String apiToken) {
        HttpHeaders headers = new HttpHeaders();
        String auth = email + ":" + apiToken;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encodedAuth);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        log.debug("Authorization header length: {}, email used: {}", encodedAuth.length(), email);
        return headers;
    }

    private List<JiraStoryResponse> parseJiraSearchResponse(String responseBody) {
        List<JiraStoryResponse> stories = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode issues = root.get("issues");
            int total = root.has("total") ? root.get("total").asInt() : 0;
            log.info("Jira API returned {} stories", total);
            if (issues != null && issues.isArray()) {
                for (JsonNode issue : issues) {
                    stories.add(parseSingleIssue(issue));
                }
            }
        } catch (Exception ex) {
            log.error("Failed to parse Jira response: {}", ex.getMessage(), ex);
            throw new JiraApiException("Failed to parse Jira API response", ex);
        }
        return stories;
    }

    private JiraStoryResponse parseSingleIssue(JsonNode issue) {
        JsonNode fields = issue.get("fields");
        return JiraStoryResponse.builder()
                .key(getTextValue(issue, "key"))
                .summary(getTextValue(fields, "summary"))
                .description(extractDescription(fields != null ? fields.get("description") : null))
                .status(getNestedTextValue(fields, "status", "name"))
                .priority(getNestedTextValue(fields, "priority", "name"))
                .assignee(getNestedTextValue(fields, "assignee", "displayName"))
                .storyType(getNestedTextValue(fields, "issuetype", "name"))
                .build();
    }

    private String extractDescription(JsonNode descriptionNode) {
        if (descriptionNode == null || descriptionNode.isNull()) {
            return "";
        }
        if (descriptionNode.isTextual()) {
            return descriptionNode.asText();
        }
        // Atlassian Document Format (ADF) - extract text content
        StringBuilder text = new StringBuilder();
        extractTextFromAdf(descriptionNode, text);
        return text.toString().trim();
    }

    private void extractTextFromAdf(JsonNode node, StringBuilder text) {
        if (node == null) {
            return;
        }
        if (node.has("text")) {
            text.append(node.get("text").asText());
        }
        if (node.has("content") && node.get("content").isArray()) {
            for (JsonNode child : node.get("content")) {
                extractTextFromAdf(child, text);
            }
            if ("paragraph".equals(getTextValue(node, "type"))
                    || "heading".equals(getTextValue(node, "type"))) {
                text.append("\n");
            }
        }
    }

    private String getTextValue(JsonNode node, String field) {
        if (node != null && node.has(field) && !node.get(field).isNull()) {
            return node.get(field).asText();
        }
        return "";
    }

    private String getNestedTextValue(JsonNode node, String parent, String child) {
        if (node != null && node.has(parent) && !node.get(parent).isNull()) {
            return getTextValue(node.get(parent), child);
        }
        return "";
    }

    private String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null) {
            return "";
        }
        // Remove trailing slash to avoid double slashes when appending paths
        return baseUrl.replaceAll("/+$", "");
    }
}
