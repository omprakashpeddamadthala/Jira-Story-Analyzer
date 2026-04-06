package com.jiranalyzer.service;

import com.jiranalyzer.dto.request.JiraConfigRequest;
import com.jiranalyzer.dto.response.JiraConfigResponse;

public interface JiraSettingsService {
    
    JiraConfigResponse getJiraConfig();
    
    JiraConfigResponse updateJiraConfig(JiraConfigRequest request);

    String getEffectiveBaseUrl();

    String getEffectiveEmail();

    String getEffectiveApiToken();
}
