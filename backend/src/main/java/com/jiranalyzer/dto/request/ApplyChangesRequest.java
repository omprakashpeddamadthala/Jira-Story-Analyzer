package com.jiranalyzer.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class ApplyChangesRequest {

    @NotBlank(message = "Jira key is required")
    private String jiraKey;

    @NotNull(message = "Changes list is required")
    private List<ChangeItem> changes;

    private boolean dryRun;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChangeItem {
        private String repo;
        private String repoPath;
        private List<String> files;
        private String patch;
        private String rationale;
    }
}
