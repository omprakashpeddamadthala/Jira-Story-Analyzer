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
public class RepoScanResponse {

    private String folderPath;
    private int totalRepos;
    private List<RepoInfo> repositories;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RepoInfo {
        private String name;
        private String path;
        private List<String> languages;
        private List<String> frameworks;
        private String packageManager;
        private List<String> entryPoints;
        private List<String> keyModules;
        private DirectoryStructure structure;
        private int totalFiles;
        private int totalDirectories;
        /** Relative paths of source files (capped for context size). */
        private List<String> sourceFiles;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DirectoryStructure {
        private String name;
        private List<String> topLevelDirs;
        private List<String> topLevelFiles;
    }
}
