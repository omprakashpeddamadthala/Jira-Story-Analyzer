package com.jiranalyzer.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationResponse {

    private String summary;
    private String jiraKey;
    private List<String> impactedRepos;
    private List<ChangeRecommendation> changes;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChangeRecommendation {
        private String repo;
        private List<String> files;
        private String rationale;
        private String risk;
        private String patch;
    }
}
