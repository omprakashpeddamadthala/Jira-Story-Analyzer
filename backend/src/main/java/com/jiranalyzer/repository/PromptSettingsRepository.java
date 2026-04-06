package com.jiranalyzer.repository;

import com.jiranalyzer.entity.PromptSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PromptSettingsRepository extends JpaRepository<PromptSettings, Long> {
}
