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
}
