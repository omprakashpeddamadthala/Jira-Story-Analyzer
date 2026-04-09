package com.jiranalyzer.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateRecommendationsRequest {

    private String title;

    private String description;

    private String acceptanceCriteria;

    @NotBlank(message = "Folder path is required (must be previously scanned)")
    private String folderPath;

    private String jiraKey;

    /**
     * The full rephrased/refined story text (markdown).
     * When provided, the recommendation prompt uses this instead of
     * the raw title / description / acceptanceCriteria fields.
     */
    private String rephrasedStory;
}
