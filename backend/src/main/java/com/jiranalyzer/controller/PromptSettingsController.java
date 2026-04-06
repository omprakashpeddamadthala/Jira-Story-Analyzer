package com.jiranalyzer.controller;

import com.jiranalyzer.dto.request.PromptConfigRequest;
import com.jiranalyzer.dto.response.ApiResponse;
import com.jiranalyzer.dto.response.PromptConfigResponse;
import com.jiranalyzer.service.PromptSettingsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
@Slf4j
public class PromptSettingsController {

    private final PromptSettingsService promptSettingsService;

    public PromptSettingsController(PromptSettingsService promptSettingsService) {
        this.promptSettingsService = promptSettingsService;
    }

    /**
     * GET /api/v1/settings/prompts
     * Returns the current AI Prompts configuration.
     */
    @GetMapping("/prompts")
    public ResponseEntity<ApiResponse<PromptConfigResponse>> getPromptConfig() {
        log.info("GET /api/v1/settings/prompts - fetching current AI Prompts");
        return ResponseEntity.ok(ApiResponse.success(promptSettingsService.getPromptConfig(), "AI Prompts retrieved successfully"));
    }

    /**
     * PUT /api/v1/settings/prompts
     * Updates the AI Prompts configuration in the DB.
     */
    @PutMapping("/prompts")
    public ResponseEntity<ApiResponse<PromptConfigResponse>> updatePromptConfig(@RequestBody PromptConfigRequest request) {
        log.info("PUT /api/v1/settings/prompts - updating AI Prompts");
        PromptConfigResponse updated = promptSettingsService.updatePromptConfig(request);
        return ResponseEntity.ok(ApiResponse.success(updated, "AI Prompts updated successfully"));
    }
}
