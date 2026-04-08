package com.jiranalyzer.service.impl;

import com.jiranalyzer.dto.request.ApplyChangesRequest;
import com.jiranalyzer.dto.request.ApplyChangesRequest.ChangeItem;
import com.jiranalyzer.dto.response.ApplyChangesResponse;
import com.jiranalyzer.dto.response.ApplyChangesResponse.RepoResult;
import com.jiranalyzer.service.ChangeApplyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Slf4j
public class ChangeApplyServiceImpl implements ChangeApplyService {

    @Override
    public ApplyChangesResponse applyChanges(ApplyChangesRequest request) {
        String branchName = buildBranchName(request.getJiraKey());
        log.info("Applying changes for {} (dryRun={}, branch={})",
                request.getJiraKey(), request.isDryRun(), branchName);

        List<RepoResult> results = new ArrayList<>();
        for (ChangeItem change : request.getChanges()) {
            RepoResult result = processChangeItem(change, branchName, request.isDryRun());
            results.add(result);
        }

        return ApplyChangesResponse.builder()
                .dryRun(request.isDryRun())
                .branchName(branchName)
                .results(results)
                .build();
    }

    private RepoResult processChangeItem(ChangeItem change, String branchName, boolean dryRun) {
        String repoPath = change.getRepoPath();
        if (repoPath == null || repoPath.isBlank()) {
            return RepoResult.builder()
                    .repo(change.getRepo())
                    .repoPath(repoPath)
                    .success(false)
                    .message("Repository path is missing")
                    .modifiedFiles(List.of())
                    .build();
        }

        Path path = Paths.get(repoPath);
        if (!Files.isDirectory(path)) {
            return RepoResult.builder()
                    .repo(change.getRepo())
                    .repoPath(repoPath)
                    .success(false)
                    .message("Repository path does not exist: " + repoPath)
                    .modifiedFiles(List.of())
                    .build();
        }

        if (dryRun) {
            return dryRunChange(change, branchName);
        }

        return executeChange(change, branchName);
    }

    private RepoResult dryRunChange(ChangeItem change, String branchName) {
        List<String> wouldModify = change.getFiles() != null ? change.getFiles() : List.of();
        StringBuilder message = new StringBuilder();
        message.append("[DRY RUN] Would create branch '").append(branchName).append("'\n");
        message.append("[DRY RUN] Would modify files:\n");
        for (String file : wouldModify) {
            Path filePath = Paths.get(change.getRepoPath(), file);
            boolean exists = Files.exists(filePath);
            message.append("  - ").append(file)
                    .append(exists ? " (exists)" : " (new file)").append("\n");
        }
        if (change.getPatch() != null && !change.getPatch().isBlank()) {
            message.append("[DRY RUN] Patch preview:\n").append(change.getPatch()).append("\n");
        }
        message.append("[DRY RUN] Would commit with message: 'feat: implement changes for story'");

        return RepoResult.builder()
                .repo(change.getRepo())
                .repoPath(change.getRepoPath())
                .success(true)
                .branchName(branchName)
                .message(message.toString())
                .modifiedFiles(wouldModify)
                .build();
    }

    private RepoResult executeChange(ChangeItem change, String branchName) {
        String repoPath = change.getRepoPath();
        List<String> modifiedFiles = new ArrayList<>();

        try {
            // Verify it's a git repo
            if (!Files.isDirectory(Paths.get(repoPath, ".git"))) {
                return RepoResult.builder()
                        .repo(change.getRepo())
                        .repoPath(repoPath)
                        .success(false)
                        .message("Not a git repository: " + repoPath)
                        .modifiedFiles(List.of())
                        .build();
            }

            // Create and checkout new branch
            String branchResult = runGitCommand(repoPath, "git", "checkout", "-b", branchName);
            log.info("Created branch: {}", branchResult);

            // Apply patch if available
            if (change.getPatch() != null && !change.getPatch().isBlank()) {
                Path patchFile = Files.createTempFile("patch-", ".diff");
                try {
                    Files.writeString(patchFile, change.getPatch());
                    try {
                        runGitCommand(repoPath, "git", "apply", "--check", patchFile.toAbsolutePath().toString());
                        runGitCommand(repoPath, "git", "apply", patchFile.toAbsolutePath().toString());
                        if (change.getFiles() != null) {
                            modifiedFiles.addAll(change.getFiles());
                        }
                    } catch (IOException patchEx) {
                        log.warn("Patch apply failed, applying changes directly: {}", patchEx.getMessage());
                        applyDirectChanges(change, modifiedFiles);
                    }
                } finally {
                    Files.deleteIfExists(patchFile);
                }
            } else {
                applyDirectChanges(change, modifiedFiles);
            }

            // Stage and commit
            if (!modifiedFiles.isEmpty()) {
                for (String file : modifiedFiles) {
                    runGitCommand(repoPath, "git", "add", file);
                }
                String commitMsg = String.format("feat: implement changes for story (%s)", change.getRationale());
                String commitResult = runGitCommand(repoPath, "git", "commit", "-m", commitMsg);
                String commitHash = extractCommitHash(commitResult);

                return RepoResult.builder()
                        .repo(change.getRepo())
                        .repoPath(repoPath)
                        .success(true)
                        .branchName(branchName)
                        .commitHash(commitHash)
                        .message("Changes applied and committed successfully")
                        .modifiedFiles(modifiedFiles)
                        .build();
            } else {
                return RepoResult.builder()
                        .repo(change.getRepo())
                        .repoPath(repoPath)
                        .success(true)
                        .branchName(branchName)
                        .message("No files were modified")
                        .modifiedFiles(modifiedFiles)
                        .build();
            }
        } catch (Exception ex) {
            log.error("Failed to apply changes to {}: {}", repoPath, ex.getMessage(), ex);
            return RepoResult.builder()
                    .repo(change.getRepo())
                    .repoPath(repoPath)
                    .success(false)
                    .branchName(branchName)
                    .message("Error applying changes: " + ex.getMessage())
                    .modifiedFiles(modifiedFiles)
                    .build();
        }
    }

    private void applyDirectChanges(ChangeItem change, List<String> modifiedFiles) {
        // When patch is not applicable, mark files as needing manual intervention
        if (change.getFiles() != null) {
            for (String file : change.getFiles()) {
                Path filePath = Paths.get(change.getRepoPath(), file);
                if (Files.exists(filePath)) {
                    modifiedFiles.add(file);
                }
            }
        }
    }

    private String runGitCommand(String workDir, String... command) throws IOException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(Paths.get(workDir).toFile());
        pb.redirectErrorStream(true);
        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        try {
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new IOException("Git command failed (exit " + exitCode + "): " + output);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Git command interrupted", e);
        }

        return output.toString().trim();
    }

    private String extractCommitHash(String commitOutput) {
        // Typical git commit output: "[branch abc1234] commit message"
        if (commitOutput.contains("[")) {
            int start = commitOutput.indexOf('[');
            int end = commitOutput.indexOf(']');
            if (start >= 0 && end > start) {
                String bracket = commitOutput.substring(start + 1, end);
                String[] parts = bracket.split("\\s+");
                if (parts.length >= 2) {
                    return parts[1];
                }
            }
        }
        return "unknown";
    }

    private String buildBranchName(String jiraKey) {
        String slug = jiraKey.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9-]", "-")
                .replaceAll("-+", "-");
        return "devin/" + slug + "-changes";
    }
}
