package com.jiranalyzer.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JiraConfigResponse {

    private String baseUrl;
    private String email;

    /**
     * Masked token – only the last 6 characters are shown, rest replaced with *.
     */
    private String apiTokenMasked;

    /**
     * True if a non-empty token is currently configured.
     */
    private boolean tokenConfigured;
}
