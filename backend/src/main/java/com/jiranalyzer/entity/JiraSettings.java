package com.jiranalyzer.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "jira_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JiraSettings {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "base_url")
    private String baseUrl;

    @Column(name = "email")
    private String email;

    @Column(name = "api_token")
    private String apiToken;

    @Column(name = "project_key")
    private String projectKey;

    @Column(name = "acceptance_criteria_field")
    private String acceptanceCriteriaField;
}
