package com.jiranalyzer.repository;

import com.jiranalyzer.entity.AnalyzedStory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnalyzedStoryRepository extends JpaRepository<AnalyzedStory, UUID> {

    Optional<AnalyzedStory> findByJiraKey(String jiraKey);

    List<AnalyzedStory> findAllByOrderByCreatedAtDesc();

    boolean existsByJiraKey(String jiraKey);
}
