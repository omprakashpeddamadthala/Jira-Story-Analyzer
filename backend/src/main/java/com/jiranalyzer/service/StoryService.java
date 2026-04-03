package com.jiranalyzer.service;

import com.jiranalyzer.dto.response.AnalyzedStoryResponse;

import java.util.List;
import java.util.UUID;

public interface StoryService {

    List<AnalyzedStoryResponse> getAllAnalyzedStories();

    AnalyzedStoryResponse getAnalyzedStoryById(UUID id);

    AnalyzedStoryResponse getAnalyzedStoryByJiraKey(String jiraKey);

    void deleteAnalyzedStory(UUID id);
}
