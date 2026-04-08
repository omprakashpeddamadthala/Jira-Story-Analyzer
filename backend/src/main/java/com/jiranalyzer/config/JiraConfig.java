package com.jiranalyzer.config;

/**
 * JiraConfig is no longer used for backend configuration.
 * Jira credentials are now provided exclusively via the UI and stored in the database.
 *
 * @deprecated Jira configuration is now UI-driven only. See JiraSettingsServiceImpl.
 */
@Deprecated(since = "2.0", forRemoval = true)
public class JiraConfig {
}
