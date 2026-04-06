package com.jiranalyzer.controller;

import com.jiranalyzer.dto.request.JiraConfigRequest;
import com.jiranalyzer.dto.response.ApiResponse;
import com.jiranalyzer.dto.response.JiraConfigResponse;
import com.jiranalyzer.service.JiraSettingsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
@Slf4j
public class JiraConfigController {

    private final JiraSettingsService settingsService;

    public JiraConfigController(JiraSettingsService settingsService) {
        this.settingsService = settingsService;
    }

    /**
     * GET /api/v1/settings/jira
     * Returns current Jira configuration with the API token masked.
     */
    @GetMapping("/jira")
    public ResponseEntity<ApiResponse<JiraConfigResponse>> getJiraConfig() {
        log.info("GET /api/v1/settings/jira – fetching current Jira config");
        return ResponseEntity.ok(ApiResponse.success(settingsService.getJiraConfig(), "Jira configuration retrieved"));
    }

    /**
     * PUT /api/v1/settings/jira
     * Updates Jira configuration in DB and uses it as priority over application.yml.
     */
    @PutMapping("/jira")
    public ResponseEntity<ApiResponse<JiraConfigResponse>> updateJiraConfig(@RequestBody JiraConfigRequest request) {
        log.info("PUT /api/v1/settings/jira – updating Jira config, baseUrl={}", request.getBaseUrl());
        JiraConfigResponse updated = settingsService.updateJiraConfig(request);
        log.info("Jira config updated");
        return ResponseEntity.ok(ApiResponse.success(updated, "Jira configuration updated successfully"));
    }
}
