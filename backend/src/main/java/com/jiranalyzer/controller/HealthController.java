package com.jiranalyzer.controller;

import com.jiranalyzer.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, String>>> healthCheck() {
        Map<String, String> health = Map.of(
                "status", "UP",
                "application", "Jira Story Analyzer",
                "version", "1.0.0"
        );
        return ResponseEntity.ok(ApiResponse.success(health, "Application is healthy"));
    }
}
