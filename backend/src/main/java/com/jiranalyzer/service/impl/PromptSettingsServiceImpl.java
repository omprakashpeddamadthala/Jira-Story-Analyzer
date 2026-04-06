package com.jiranalyzer.service.impl;

import com.jiranalyzer.dto.request.PromptConfigRequest;
import com.jiranalyzer.dto.response.PromptConfigResponse;
import com.jiranalyzer.entity.PromptSettings;
import com.jiranalyzer.repository.PromptSettingsRepository;
import com.jiranalyzer.service.PromptSettingsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Slf4j
public class PromptSettingsServiceImpl implements PromptSettingsService {

    private final PromptSettingsRepository settingsRepository;
    private static final Long SETTINGS_ID = 1L;

    // This is the default prompt currently being used in AiAnalysisServiceImpl.
    private static final String DEFAULT_COPILOT_PROMPT = """
            You are an expert AI software engineer.

            Your task is to analyze the complete codebase and generate an implementation prompt \
            that can be directly used with GitHub Copilot.

            Follow the steps below carefully:

            --------------------------------------
            STEP 1: INPUT FROM JIRA
            --------------------------------------
            You will receive:
            - Title: {title}
            - Description: {description}
            - Acceptance Criteria: {acceptanceCriteria}
            - Definition of Done: {definitionOfDone}

            --------------------------------------
            STEP 2: CODEBASE ANALYSIS
            --------------------------------------
            - Analyze entire codebase
            - Identify modules, services, controllers, APIs, DB
            - Detect reusable components
            - Identify change points

            --------------------------------------
            STEP 3: PROMPT GENERATION
            --------------------------------------
            Generate a detailed Copilot prompt:
            - Context-aware
            - File-level guidance
            - Methods/classes to modify
            - Validations, edge cases
            - Follow coding standards

            --------------------------------------
            STEP 4: OUTPUT FORMAT
            --------------------------------------
            Return ONLY ONE markdown response following the STRICT template below.
            Do NOT include any extra text outside the markdown block.

            --------------------------------------
            OUTPUT TEMPLATE (STRICT)
            --------------------------------------

            # GitHub Copilot Implementation Prompt

            ## Feature Title
            <Insert Title>

            ## Description
            <Insert Description>

            ## Acceptance Criteria
            - <criteria>

            ## Definition of Done
            - <DoD>

            ## Codebase Context
            - Relevant Modules:
            - Services:
            - Controllers:
            - Database Tables:
            - APIs:

            ## Implementation Plan
            1. <Step>

            ## Detailed Instructions for Copilot
            - Modify/Create:
            - Add validations:
            - Handle edge cases:
            - Follow patterns:

            ## Expected Outcome
            <Final result>
            """;

    public PromptSettingsServiceImpl(PromptSettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PromptConfigResponse getPromptConfig() {
        return PromptConfigResponse.builder()
                .copilotTemplate(getCopilotTemplate())
                .build();
    }

    @Override
    @Transactional
    public PromptConfigResponse updatePromptConfig(PromptConfigRequest request) {
        PromptSettings settings = getOrCreateSettings();
        
        if (StringUtils.hasText(request.getCopilotTemplate())) {
            settings.setCopilotTemplate(request.getCopilotTemplate().trim());
        }
        
        settingsRepository.save(settings);
        return getPromptConfig();
    }

    @Override
    @Transactional(readOnly = true)
    public String getCopilotTemplate() {
        PromptSettings settings = getOrCreateSettings();
        if (StringUtils.hasText(settings.getCopilotTemplate())) {
            return settings.getCopilotTemplate();
        }
        return DEFAULT_COPILOT_PROMPT;
    }

    private PromptSettings getOrCreateSettings() {
        return settingsRepository.findById(SETTINGS_ID).orElseGet(() -> {
            PromptSettings newSettings = new PromptSettings();
            newSettings.setId(SETTINGS_ID);
            newSettings.setCopilotTemplate(DEFAULT_COPILOT_PROMPT);
            return newSettings;
        });
    }
}
