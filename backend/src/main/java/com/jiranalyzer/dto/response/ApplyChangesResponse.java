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
public class ApplyChangesResponse {

    private boolean dryRun;
    private String branchName;
    private List<RepoResult> results;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RepoResult {
        private String repo;
        private String repoPath;
        private boolean success;
        private String branchName;
        private String commitHash;
        private String message;
        private List<String> modifiedFiles;
    }
}
