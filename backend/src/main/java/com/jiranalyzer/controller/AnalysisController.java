package com.jiranalyzer.controller;

import com.jiranalyzer.dto.request.AnalyzeStoryRequest;
import com.jiranalyzer.dto.response.AnalyzedStoryResponse;
import com.jiranalyzer.dto.response.ApiResponse;
import com.jiranalyzer.service.AiAnalysisService;
import com.jiranalyzer.service.StoryService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analysis")
@Slf4j
public class AnalysisController {

    private final AiAnalysisService aiAnalysisService;
    private final StoryService storyService;

    public AnalysisController(AiAnalysisService aiAnalysisService, StoryService storyService) {
        this.aiAnalysisService = aiAnalysisService;
        this.storyService = storyService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<AnalyzedStoryResponse>> analyzeStory(
            @Valid @RequestBody AnalyzeStoryRequest request) {
        log.info("POST /api/v1/analysis/analyze - Analyzing story: {}", request.getJiraKey());
        AnalyzedStoryResponse response = aiAnalysisService.analyzeStory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Story analyzed successfully"));
    }

    @GetMapping("/stories")
    public ResponseEntity<ApiResponse<List<AnalyzedStoryResponse>>> getAllAnalyzedStories() {
        log.info("GET /api/v1/analysis/stories - Fetching all analyzed stories");
        List<AnalyzedStoryResponse> stories = storyService.getAllAnalyzedStories();
        return ResponseEntity.ok(ApiResponse.success(stories, "Fetched " + stories.size() + " analyzed stories"));
    }

    @GetMapping("/stories/{id}")
    public ResponseEntity<ApiResponse<AnalyzedStoryResponse>> getAnalyzedStoryById(@PathVariable UUID id) {
        log.info("GET /api/v1/analysis/stories/{} - Fetching analyzed story", id);
        AnalyzedStoryResponse response = storyService.getAnalyzedStoryById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Story fetched successfully"));
    }

    @GetMapping("/stories/jira/{jiraKey}")
    public ResponseEntity<ApiResponse<AnalyzedStoryResponse>> getAnalyzedStoryByJiraKey(
            @PathVariable String jiraKey) {
        log.info("GET /api/v1/analysis/stories/jira/{} - Fetching analyzed story by Jira key", jiraKey);
        AnalyzedStoryResponse response = storyService.getAnalyzedStoryByJiraKey(jiraKey);
        return ResponseEntity.ok(ApiResponse.success(response, "Story fetched successfully"));
    }

    @DeleteMapping("/stories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAnalyzedStory(@PathVariable UUID id) {
        log.info("DELETE /api/v1/analysis/stories/{} - Deleting analyzed story", id);
        storyService.deleteAnalyzedStory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Story deleted successfully"));
    }
}
