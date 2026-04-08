package com.jiranalyzer.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JiraConfigRequest {

    private String baseUrl;
    private String email;

    /**
     * Plain-text API token. If blank/null, the existing token is kept.
     */
    private String apiToken;

    /**
     * Jira project key (e.g. "SCRUM", "PROJ"). If blank, all assigned stories are fetched.
     */
    private String projectKey;

    /**
     * Custom field ID for acceptance criteria (e.g. "customfield_10028").
     * If blank, acceptance criteria is parsed from the description.
     */
    private String acceptanceCriteriaField;
}
