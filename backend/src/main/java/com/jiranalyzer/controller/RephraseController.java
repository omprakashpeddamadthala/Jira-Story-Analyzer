package com.jiranalyzer.controller;

import com.jiranalyzer.dto.request.RephraseRequest;
import com.jiranalyzer.dto.response.ApiResponse;
import com.jiranalyzer.dto.response.RephraseResponse;
import com.jiranalyzer.service.RephraseService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analysis")
@Slf4j
public class RephraseController {

    private final RephraseService rephraseService;

    public RephraseController(RephraseService rephraseService) {
        this.rephraseService = rephraseService;
    }

    @PostMapping("/rephrase")
    public ResponseEntity<ApiResponse<RephraseResponse>> rephrase(
            @Valid @RequestBody RephraseRequest request) {
        log.info("POST /api/v1/analysis/rephrase - Rephrasing story: '{}'",
                request.getTitle().length() > 50
                        ? request.getTitle().substring(0, 50) + "..."
                        : request.getTitle());
        RephraseResponse response = rephraseService.rephrase(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Story rephrased successfully"));
    }
}
