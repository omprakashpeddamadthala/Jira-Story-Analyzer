package com.jiranalyzer.service;

import com.jiranalyzer.dto.request.AnalyzeStoryRequest;
import com.jiranalyzer.dto.response.AnalyzedStoryResponse;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface AiAnalysisService {

    AnalyzedStoryResponse analyzeStory(AnalyzeStoryRequest request);

    void analyzeStoryStreaming(AnalyzeStoryRequest request, SseEmitter emitter);
}
