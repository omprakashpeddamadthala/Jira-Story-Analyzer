package com.jiranalyzer.service;

import com.jiranalyzer.dto.response.JiraStoryResponse;

import java.util.List;
import java.util.Map;

public interface JiraService {

    List<JiraStoryResponse> fetchAssignedStories();

    JiraStoryResponse fetchStoryByKey(String jiraKey);

    /**
     * Tests a Jira connection using provided credentials.
     * Returns a map with "success" (boolean), "displayName" and "email" on success,
     * or "success" false and "error" message on failure.
     */
    Map<String, Object> testConnection(String baseUrl, String email, String apiToken);
}
