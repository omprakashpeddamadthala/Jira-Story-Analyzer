package com.jiranalyzer.service;

import com.jiranalyzer.dto.request.PromptConfigRequest;
import com.jiranalyzer.dto.response.PromptConfigResponse;

public interface PromptSettingsService {
    
    PromptConfigResponse getPromptConfig();
    
    PromptConfigResponse updatePromptConfig(PromptConfigRequest request);

    String getCopilotTemplate();
}
