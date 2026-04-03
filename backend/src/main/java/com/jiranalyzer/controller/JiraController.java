package com.jiranalyzer.controller;

import com.jiranalyzer.dto.response.ApiResponse;
import com.jiranalyzer.dto.response.JiraStoryResponse;
import com.jiranalyzer.service.JiraService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
