package com.jiranalyzer.dto.response;

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
public class JiraStoryResponse {

    private String key;
    private String summary;
    private String description;
    private String status;
    private String priority;
    private String assignee;
    private String storyType;
    private String acceptanceCriteria;
}
