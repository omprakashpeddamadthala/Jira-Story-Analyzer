package com.jiranalyzer.service.impl;

import com.jiranalyzer.dto.response.AnalyzedStoryResponse;
import com.jiranalyzer.entity.AnalyzedStory;
import com.jiranalyzer.exception.ResourceNotFoundException;
import com.jiranalyzer.repository.AnalyzedStoryRepository;
import com.jiranalyzer.service.StoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional(readOnly = true)
public class StoryServiceImpl implements StoryService {

    private final AnalyzedStoryRepository analyzedStoryRepository;

    public StoryServiceImpl(AnalyzedStoryRepository analyzedStoryRepository) {
        this.analyzedStoryRepository = analyzedStoryRepository;
    }

    @Override
    public List<AnalyzedStoryResponse> getAllAnalyzedStories() {
        log.info("Fetching all analyzed stories");
        return analyzedStoryRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AnalyzedStoryResponse getAnalyzedStoryById(UUID id) {
        log.info("Fetching analyzed story by ID: {}", id);
        AnalyzedStory story = analyzedStoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Analyzed story", "id", id));
        return mapToResponse(story);
    }

    @Override
    public AnalyzedStoryResponse getAnalyzedStoryByJiraKey(String jiraKey) {
        log.info("Fetching analyzed story by Jira key: {}", jiraKey);
        AnalyzedStory story = analyzedStoryRepository.findByJiraKey(jiraKey)
                .orElseThrow(() -> new ResourceNotFoundException("Analyzed story", "jiraKey", jiraKey));
        return mapToResponse(story);
    }

    @Override
    @Transactional
    public void deleteAnalyzedStory(UUID id) {
        log.info("Deleting analyzed story with ID: {}", id);
        if (!analyzedStoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Analyzed story", "id", id);
        }
        analyzedStoryRepository.deleteById(id);
    }

    private AnalyzedStoryResponse mapToResponse(AnalyzedStory story) {
        return AnalyzedStoryResponse.builder()
                .id(story.getId())
                .jiraKey(story.getJiraKey())
                .title(story.getTitle())
                .description(story.getDescription())
                .acceptanceCriteria(story.getAcceptanceCriteria())
                .definitionOfDone(story.getDefinitionOfDone())
                .simplifiedSummary(story.getSimplifiedSummary())
                .implementationPlan(story.getImplementationPlan())
                .apiContracts(story.getApiContracts())
                .testSuggestions(story.getTestSuggestions())
                .createdAt(story.getCreatedAt())
                .updatedAt(story.getUpdatedAt())
                .build();
    }
}
