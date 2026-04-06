package com.jiranalyzer.service.impl;

import com.jiranalyzer.config.JiraConfig;
import com.jiranalyzer.dto.request.JiraConfigRequest;
import com.jiranalyzer.dto.response.JiraConfigResponse;
import com.jiranalyzer.entity.JiraSettings;
import com.jiranalyzer.repository.JiraSettingsRepository;
import com.jiranalyzer.service.JiraSettingsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Slf4j
public class JiraSettingsServiceImpl implements JiraSettingsService {

    private final JiraSettingsRepository settingsRepository;
    private final JiraConfig jiraConfig;
    private static final Long SETTINGS_ID = 1L;

    public JiraSettingsServiceImpl(JiraSettingsRepository settingsRepository, JiraConfig jiraConfig) {
        this.settingsRepository = settingsRepository;
        this.jiraConfig = jiraConfig;
    }

    @Override
    @Transactional(readOnly = true)
    public JiraConfigResponse getJiraConfig() {
        JiraSettings settings = getOrCreateSettings();
        String token = getEffectiveApiToken(settings);
        boolean configured = StringUtils.hasText(token);
        String masked = configured ? maskToken(token) : "";
        
        return JiraConfigResponse.builder()
                .baseUrl(getEffectiveBaseUrl(settings))
                .email(getEffectiveEmail(settings))
                .apiTokenMasked(masked)
                .tokenConfigured(configured)
                .build();
    }

    @Override
    @Transactional
    public JiraConfigResponse updateJiraConfig(JiraConfigRequest request) {
        JiraSettings settings = getOrCreateSettings();
        
        if (StringUtils.hasText(request.getBaseUrl())) {
            settings.setBaseUrl(request.getBaseUrl().trim());
        }
        if (StringUtils.hasText(request.getEmail())) {
            settings.setEmail(request.getEmail().trim());
        }
        if (StringUtils.hasText(request.getApiToken())) {
            settings.setApiToken(request.getApiToken().trim());
        }
        
        settingsRepository.save(settings);
        return getJiraConfig();
    }

    @Override
    @Transactional(readOnly = true)
    public String getEffectiveBaseUrl() {
        return getEffectiveBaseUrl(getOrCreateSettings());
    }

    @Override
    @Transactional(readOnly = true)
    public String getEffectiveEmail() {
        return getEffectiveEmail(getOrCreateSettings());
    }

    @Override
    @Transactional(readOnly = true)
    public String getEffectiveApiToken() {
        return getEffectiveApiToken(getOrCreateSettings());
    }

    // --- Helpers ---

    private JiraSettings getOrCreateSettings() {
        return settingsRepository.findById(SETTINGS_ID).orElseGet(() -> {
            JiraSettings newSettings = new JiraSettings();
            newSettings.setId(SETTINGS_ID);
            return newSettings;
        });
    }

    private String getEffectiveBaseUrl(JiraSettings settings) {
        return StringUtils.hasText(settings.getBaseUrl()) ? settings.getBaseUrl() : jiraConfig.getBaseUrl();
    }

    private String getEffectiveEmail(JiraSettings settings) {
        return StringUtils.hasText(settings.getEmail()) ? settings.getEmail() : jiraConfig.getEmail();
    }

    private String getEffectiveApiToken(JiraSettings settings) {
        return StringUtils.hasText(settings.getApiToken()) ? settings.getApiToken() : jiraConfig.getApiToken();
    }

    private String maskToken(String token) {
        if (token == null || token.isEmpty()) return "";
        if (token.length() <= 6) {
            return "******";
        }
        String suffix = token.substring(token.length() - 6);
        return "*".repeat(Math.min(token.length() - 6, 12)) + suffix;
    }
}
