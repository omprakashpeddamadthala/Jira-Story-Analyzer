package com.jiranalyzer.service;

import com.jiranalyzer.dto.response.JiraStoryResponse;

import java.util.List;

public interface JiraService {

    List<JiraStoryResponse> fetchAssignedStories();

    JiraStoryResponse fetchStoryByKey(String jiraKey);
}
