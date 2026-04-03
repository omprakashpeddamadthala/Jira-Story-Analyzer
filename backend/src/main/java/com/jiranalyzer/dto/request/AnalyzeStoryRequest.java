package com.jiranalyzer.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class AnalyzeStoryRequest {

    @NotBlank(message = "Jira key is required")
    private String jiraKey;

    @NotBlank(message = "Title is required")
    @Size(max = 500, message = "Title must not exceed 500 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 10000, message = "Description must not exceed 10000 characters")
    private String description;

    @NotBlank(message = "Acceptance criteria is required")
    @Size(max = 10000, message = "Acceptance criteria must not exceed 10000 characters")
    private String acceptanceCriteria;

    @NotBlank(message = "Definition of done is required")
    @Size(max = 5000, message = "Definition of done must not exceed 5000 characters")
    private String definitionOfDone;
}
