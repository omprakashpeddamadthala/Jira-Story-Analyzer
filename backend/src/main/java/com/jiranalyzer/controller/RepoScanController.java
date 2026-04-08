package com.jiranalyzer.controller;

import com.jiranalyzer.dto.request.RepoScanRequest;
import com.jiranalyzer.dto.response.ApiResponse;
import com.jiranalyzer.dto.response.RepoScanResponse;
import com.jiranalyzer.service.RepoScanService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/repos")
@Slf4j
public class RepoScanController {

    private final RepoScanService repoScanService;

    public RepoScanController(RepoScanService repoScanService) {
        this.repoScanService = repoScanService;
    }

    @PostMapping("/scan")
    public ResponseEntity<ApiResponse<RepoScanResponse>> scanFolder(
            @Valid @RequestBody RepoScanRequest request) {
        log.info("POST /api/v1/repos/scan - Scanning folder: {}", request.getFolderPath());
        RepoScanResponse response = repoScanService.scanFolder(request.getFolderPath());
        return ResponseEntity.ok(ApiResponse.success(response,
                "Scanned " + response.getTotalRepos() + " repositories"));
    }

    @GetMapping("/scan")
    public ResponseEntity<ApiResponse<RepoScanResponse>> getCachedScan(
            @RequestParam String folderPath) {
        log.info("GET /api/v1/repos/scan - Fetching cached scan for: {}", folderPath);
        if (!repoScanService.hasCachedScan(folderPath)) {
            return ResponseEntity.ok(ApiResponse.error("No cached scan found for: " + folderPath));
        }
        RepoScanResponse response = repoScanService.getCachedScan(folderPath);
        return ResponseEntity.ok(ApiResponse.success(response, "Cached scan retrieved"));
    }
}
