package com.jiranalyzer.service;

import com.jiranalyzer.dto.request.AnalyzeStoryRequest;
import com.jiranalyzer.dto.response.AnalyzedStoryResponse;

public interface AiAnalysisService {

    AnalyzedStoryResponse analyzeStory(AnalyzeStoryRequest request);
}
