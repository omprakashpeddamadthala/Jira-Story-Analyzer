package com.jiranalyzer.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyzedStoryResponse {

    private UUID id;
    private String jiraKey;
    private String title;
    private String description;
    private String acceptanceCriteria;
    private String definitionOfDone;
    private String simplifiedSummary;
    private String implementationPlan;
    private String apiContracts;
    private String testSuggestions;
    private String copilotPrompt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
