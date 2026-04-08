package com.jiranalyzer.controller;

import com.jiranalyzer.dto.request.GenerateRecommendationsRequest;
import com.jiranalyzer.dto.response.ApiResponse;
import com.jiranalyzer.dto.response.RecommendationResponse;
import com.jiranalyzer.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/recommendations")
@Slf4j
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<RecommendationResponse>> generateRecommendations(
            @Valid @RequestBody GenerateRecommendationsRequest request) {
        log.info("POST /api/v1/recommendations/generate - Generating for story: {}", request.getJiraKey());
        RecommendationResponse response = recommendationService.generateRecommendations(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Recommendations generated successfully"));
    }
}
