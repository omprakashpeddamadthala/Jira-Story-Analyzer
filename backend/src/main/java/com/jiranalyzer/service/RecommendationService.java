package com.jiranalyzer.service;

import com.jiranalyzer.dto.request.GenerateRecommendationsRequest;
import com.jiranalyzer.dto.response.RecommendationResponse;

public interface RecommendationService {

    RecommendationResponse generateRecommendations(GenerateRecommendationsRequest request);
}
