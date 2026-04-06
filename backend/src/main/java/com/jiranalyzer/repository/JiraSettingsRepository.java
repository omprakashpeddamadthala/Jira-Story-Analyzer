package com.jiranalyzer.repository;

import com.jiranalyzer.entity.JiraSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JiraSettingsRepository extends JpaRepository<JiraSettings, Long> {
}
