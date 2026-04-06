package com.jiranalyzer.controller;

import com.jiranalyzer.dto.response.ApiResponse;
import com.jiranalyzer.dto.response.JiraStoryResponse;
import com.jiranalyzer.service.JiraService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/jira")
@Slf4j
public class JiraController {

    private final JiraService jiraService;

    public JiraController(JiraService jiraService) {
        this.jiraService = jiraService;
    }

    @GetMapping("/stories")
    public ResponseEntity<ApiResponse<List<JiraStoryResponse>>> getAssignedStories() {
        log.info("GET /api/v1/jira/stories - Fetching assigned stories");
        List<JiraStoryResponse> stories = jiraService.fetchAssignedStories();
        return ResponseEntity.ok(ApiResponse.success(stories, "Fetched " + stories.size() + " assigned stories"));
    }

    @GetMapping("/stories/{key}")
    public ResponseEntity<ApiResponse<JiraStoryResponse>> getStoryByKey(@PathVariable String key) {
        log.info("GET /api/v1/jira/stories/{} - Fetching story by key", key);
        JiraStoryResponse story = jiraService.fetchStoryByKey(key);
        return ResponseEntity.ok(ApiResponse.success(story, "Story fetched successfully"));
    }

    /**
     * POST /api/v1/jira/test-connection
     * Verifies provided Jira credentials by calling /rest/api/3/myself.
     */
    @PostMapping("/test-connection")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testConnection(@RequestBody com.jiranalyzer.dto.request.JiraConfigRequest request) {
        log.info("POST /api/v1/jira/test-connection - Testing Jira connection with provided credentials");
        
        // If the token is empty (masked in UI and unmodified), let's use the one currently active in the service.
        // But since we need the current active token to test, we need access to JiraSettingsService.
        // Wait, instead of directly injecting it here, let JiraService handle resolving the token or we can inject JiraSettingsService.
        // We'll inject JiraSettingsService here to grab the effective token if the request token is empty. 
        // Better yet: we don't have JiraSettingsService injected here right now. Let's just do it directly.
        // Wait, I can't inject it easily without changing the constructor. Let's change the constructor to include JiraSettingsService.
        // Actually, the simplest way is to let the JiraService handle it. Let me just pass the request token.
        // If it's empty, JiraService testConnection can just use the settingsService.getEffectiveApiToken().
        // So I'll just pass request values as-is.
        
        Map<String, Object> result = jiraService.testConnection(request.getBaseUrl(), request.getEmail(), request.getApiToken());
        boolean success = Boolean.TRUE.equals(result.get("success"));
        String message = success ? "Connection successful" : "Connection failed";
        return ResponseEntity.ok(ApiResponse.success(result, message));
    }
}
