package com.jiranalyzer.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiranalyzer.config.JiraConfig;
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
import java.util.List;

@Service
@Slf4j
public class JiraServiceImpl implements JiraService {

    private final RestTemplate restTemplate;
    private final JiraConfig jiraConfig;
    private final ObjectMapper objectMapper;

    public JiraServiceImpl(RestTemplate restTemplate, JiraConfig jiraConfig, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.jiraConfig = jiraConfig;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<JiraStoryResponse> fetchAssignedStories() {
        log.info("Fetching assigned Jira stories");
        String jql = "assignee=currentUser() AND status != Done ORDER BY updated DESC";
        String url = jiraConfig.getBaseUrl() + "/rest/api/3/search?jql=" + encodeJql(jql)
                + "&fields=summary,description,status,priority,assignee,issuetype&maxResults=50";

        try {
            HttpEntity<String> entity = new HttpEntity<>(createAuthHeaders());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            return parseJiraSearchResponse(response.getBody());
        } catch (RestClientException ex) {
            log.error("Failed to fetch Jira stories: {}", ex.getMessage(), ex);
            throw new JiraApiException("Failed to fetch assigned stories from Jira", ex);
        }
    }

    @Override
    public JiraStoryResponse fetchStoryByKey(String jiraKey) {
        log.info("Fetching Jira story by key: {}", jiraKey);
        String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue/" + jiraKey
                + "?fields=summary,description,status,priority,assignee,issuetype";

        try {
            HttpEntity<String> entity = new HttpEntity<>(createAuthHeaders());
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

    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String auth = jiraConfig.getEmail() + ":" + jiraConfig.getApiToken();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encodedAuth);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private String encodeJql(String jql) {
        return java.net.URLEncoder.encode(jql, StandardCharsets.UTF_8);
    }

    private List<JiraStoryResponse> parseJiraSearchResponse(String responseBody) {
        List<JiraStoryResponse> stories = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode issues = root.get("issues");
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
                .description(extractDescription(fields.get("description")))
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
}
