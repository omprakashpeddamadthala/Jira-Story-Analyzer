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

    /** Story title used to build the feature branch name. */
    private String storyTitle;

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
        /** Structured per-file modifications for direct apply when git-apply fails. */
        private List<FileModification> fileModifications;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FileModification {
        private String filePath;
        /** "modify", "create", or "delete" */
        private String action;
        /** Content to find in the file (for modify action). */
        private String searchContent;
        /** Content to replace with (for modify/create actions). */
        private String replaceContent;
    }
}
