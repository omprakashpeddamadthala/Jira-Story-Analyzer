package com.jiranalyzer.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

@Configuration
@ConfigurationProperties(prefix = "jira")
@Validated
@Getter
@Setter
public class JiraConfig {

    @NotBlank(message = "Jira base URL is required")
    private String baseUrl;

    @NotBlank(message = "Jira email is required")
    private String email;

    @NotBlank(message = "Jira API token is required")
    private String apiToken;
}
