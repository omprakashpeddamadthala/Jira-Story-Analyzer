package com.jiranalyzer.controller;

import com.jiranalyzer.dto.request.ApplyChangesRequest;
import com.jiranalyzer.dto.response.ApiResponse;
import com.jiranalyzer.dto.response.ApplyChangesResponse;
import com.jiranalyzer.service.ChangeApplyService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/changes")
@Slf4j
public class ChangeApplyController {

    private final ChangeApplyService changeApplyService;

    public ChangeApplyController(ChangeApplyService changeApplyService) {
        this.changeApplyService = changeApplyService;
    }

    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<ApplyChangesResponse>> applyChanges(
            @Valid @RequestBody ApplyChangesRequest request) {
        log.info("POST /api/v1/changes/apply - Applying changes for: {} (dryRun={})",
                request.getJiraKey(), request.isDryRun());
        ApplyChangesResponse response = changeApplyService.applyChanges(request);
        return ResponseEntity.ok(ApiResponse.success(response,
                request.isDryRun() ? "Dry run completed" : "Changes applied successfully"));
    }
}
