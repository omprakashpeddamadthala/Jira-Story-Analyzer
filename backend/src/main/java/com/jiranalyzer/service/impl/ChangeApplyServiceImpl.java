package com.jiranalyzer.service.impl;

import com.jiranalyzer.dto.request.ApplyChangesRequest;
import com.jiranalyzer.dto.request.ApplyChangesRequest.ChangeItem;
import com.jiranalyzer.dto.request.ApplyChangesRequest.FileModification;
import com.jiranalyzer.dto.response.ApplyChangesResponse;
import com.jiranalyzer.dto.response.ApplyChangesResponse.FileChange;
import com.jiranalyzer.dto.response.ApplyChangesResponse.RepoResult;
import com.jiranalyzer.service.ChangeApplyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Slf4j
public class ChangeApplyServiceImpl implements ChangeApplyService {

    private static final boolean IS_WINDOWS = System.getProperty("os.name", "")
            .toLowerCase(Locale.ROOT).contains("win");

    /** Resolve the git executable path, preferring git.exe on Windows. */
    private static final String GIT_EXECUTABLE = resolveGitExecutable();

    private static String resolveGitExecutable() {
        if (!IS_WINDOWS) {
            return "git";
        }
        // On Windows, ProcessBuilder cannot always find "git" without the
        // shell's PATH resolution.  Try common install locations first,
        // then fall back to "git.exe" (which works when git is on PATH).
        String[] candidates = {
                System.getenv("ProgramFiles") + "\\Git\\cmd\\git.exe",
                System.getenv("ProgramFiles(x86)") + "\\Git\\cmd\\git.exe",
                System.getenv("LOCALAPPDATA") + "\\Programs\\Git\\cmd\\git.exe"
        };
        for (String candidate : candidates) {
            if (candidate != null && Files.exists(Paths.get(candidate))) {
                return candidate;
            }
        }
        return "git.exe";
    }

    @Override
    public ApplyChangesResponse applyChanges(ApplyChangesRequest request) {
        String branchName = buildBranchName(request.getJiraKey(), request.getStoryTitle());
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
        List<FileChange> fileChanges = new ArrayList<>();
        String originalBranch = null;

        try {
            // Verify it's a git repo
            if (!Files.isDirectory(Paths.get(repoPath, ".git"))) {
                return RepoResult.builder()
                        .repo(change.getRepo())
                        .repoPath(repoPath)
                        .success(false)
                        .message("Not a git repository: " + repoPath)
                        .modifiedFiles(List.of())
                        .fileChanges(List.of())
                        .build();
            }

            // Record current branch for rollback
            originalBranch = runGitCommand(repoPath, "git", "rev-parse", "--abbrev-ref", "HEAD");

            // Create and checkout new branch
            String branchResult = runGitCommand(repoPath, "git", "checkout", "-b", branchName);
            log.info("Created branch: {}", branchResult);

            boolean changesApplied = false;

            // Strategy 1: Try git apply with patch content (for proper unified diffs)
            if (change.getPatch() != null && !change.getPatch().isBlank()) {
                changesApplied = tryGitApply(repoPath, change.getPatch(), modifiedFiles);
            }

            // Strategy 2: Apply structured fileModifications (search-and-replace)
            if (!changesApplied && change.getFileModifications() != null
                    && !change.getFileModifications().isEmpty()) {
                changesApplied = applyFileModifications(
                        repoPath, change.getFileModifications(), modifiedFiles, fileChanges);
            }

            if (!changesApplied) {
                // Neither strategy worked — rollback branch and report
                rollbackBranch(repoPath, originalBranch, branchName);
                return RepoResult.builder()
                        .repo(change.getRepo())
                        .repoPath(repoPath)
                        .success(false)
                        .message("No applicable changes could be applied. "
                                + "The AI-generated suggestions may need manual implementation.")
                        .modifiedFiles(List.of())
                        .fileChanges(List.of())
                        .build();
            }

            // If git apply succeeded but we have no fileChanges yet, capture diffs
            if (fileChanges.isEmpty() && !modifiedFiles.isEmpty()) {
                captureGitDiffs(repoPath, modifiedFiles, fileChanges);
            }

            // Stage and commit
            if (!modifiedFiles.isEmpty()) {
                for (String file : modifiedFiles) {
                    runGitCommand(repoPath, "git", "add", file);
                }
            } else {
                runGitCommand(repoPath, "git", "add", "-A");
                List<String> stagedFiles = detectModifiedFiles(repoPath);
                modifiedFiles.addAll(stagedFiles);
            }

            if (!modifiedFiles.isEmpty()) {
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
                        .fileChanges(fileChanges)
                        .build();
            } else {
                rollbackBranch(repoPath, originalBranch, branchName);
                return RepoResult.builder()
                        .repo(change.getRepo())
                        .repoPath(repoPath)
                        .success(true)
                        .message("Changes applied but no files were modified")
                        .modifiedFiles(List.of())
                        .fileChanges(List.of())
                        .build();
            }
        } catch (Exception ex) {
            log.error("Failed to apply changes to {}: {}", repoPath, ex.getMessage(), ex);
            if (originalBranch != null) {
                rollbackBranch(repoPath, originalBranch, branchName);
            }
            return RepoResult.builder()
                    .repo(change.getRepo())
                    .repoPath(repoPath)
                    .success(false)
                    .branchName(branchName)
                    .message("Error applying changes: " + ex.getMessage())
                    .modifiedFiles(modifiedFiles)
                    .fileChanges(fileChanges)
                    .build();
        }
    }

    /**
     * Try to apply patch content using git apply.
     * Returns true if the patch was applied successfully.
     */
    private boolean tryGitApply(String repoPath, String patchContent,
                                List<String> modifiedFiles) {
        Path patchFile = null;
        try {
            patchFile = Files.createTempFile("patch-", ".diff");
            Files.writeString(patchFile, patchContent);
            runGitCommand(repoPath, "git", "apply", "--check", patchFile.toAbsolutePath().toString());
            runGitCommand(repoPath, "git", "apply", patchFile.toAbsolutePath().toString());
            List<String> detectedFiles = detectModifiedFiles(repoPath);
            if (!detectedFiles.isEmpty()) {
                modifiedFiles.addAll(detectedFiles);
            }
            return true;
        } catch (IOException ex) {
            log.warn("git apply failed, will try fileModifications fallback: {}", ex.getMessage());
            return false;
        } finally {
            if (patchFile != null) {
                try { Files.deleteIfExists(patchFile); } catch (IOException ignored) { }
            }
        }
    }

    /**
     * Apply structured file modifications (search-and-replace, create, delete).
     * Captures before/after content for the UI diff view.
     */
    private boolean applyFileModifications(String repoPath,
                                           List<FileModification> modifications,
                                           List<String> modifiedFiles,
                                           List<FileChange> fileChanges) {
        boolean anyApplied = false;
        Path repoRoot = Paths.get(repoPath).toAbsolutePath().normalize();

        // Group by file path to apply all modifications per file in one pass
        Map<String, List<FileModification>> byFile = new LinkedHashMap<>();
        for (FileModification mod : modifications) {
            if (mod.getFilePath() == null || mod.getFilePath().isBlank()) continue;
            byFile.computeIfAbsent(mod.getFilePath(), k -> new ArrayList<>()).add(mod);
        }

        for (Map.Entry<String, List<FileModification>> entry : byFile.entrySet()) {
            String relPath = entry.getKey();
            Path filePath = repoRoot.resolve(relPath).normalize();

            // Guard against path traversal
            if (!filePath.startsWith(repoRoot)) {
                log.warn("Path traversal attempt blocked: {}", relPath);
                continue;
            }

            try {
                // Capture original content once before any modifications
                String originalContent = Files.exists(filePath)
                        ? Files.readString(filePath, StandardCharsets.UTF_8) : "";
                boolean fileModified = false;

                for (FileModification mod : entry.getValue()) {
                    String action = mod.getAction() != null ? mod.getAction().toLowerCase(Locale.ROOT) : "modify";
                    switch (action) {
                        case "create" -> {
                            if (!Files.exists(filePath)) {
                                Files.createDirectories(filePath.getParent());
                            }
                            String newContent = mod.getReplaceContent() != null ? mod.getReplaceContent() : "";
                            Files.writeString(filePath, newContent, StandardCharsets.UTF_8);
                            fileModified = true;
                        }
                        case "delete" -> {
                            if (Files.exists(filePath)) {
                                Files.delete(filePath);
                                fileModified = true;
                            }
                        }
                        default -> { // "modify"
                            if (!Files.exists(filePath)) {
                                log.warn("File not found for modify: {}", filePath);
                                continue;
                            }
                            String currentContent = Files.readString(filePath, StandardCharsets.UTF_8);
                            String search = mod.getSearchContent();
                            String replace = mod.getReplaceContent();
                            if (search != null && !search.isEmpty() && currentContent.contains(search)) {
                                String newContent = currentContent.replace(search, replace != null ? replace : "");
                                Files.writeString(filePath, newContent, StandardCharsets.UTF_8);
                                fileModified = true;
                            } else {
                                log.warn("Search content not found in {}: {}",
                                        relPath, search != null ? search.substring(0, Math.min(80, search.length())) : "null");
                            }
                        }
                    }
                }

                // Record a single FileChange entry per file (original -> final)
                if (fileModified) {
                    String finalContent = Files.exists(filePath)
                            ? Files.readString(filePath, StandardCharsets.UTF_8) : "";
                    fileChanges.add(FileChange.builder()
                            .filePath(relPath)
                            .originalContent(originalContent)
                            .modifiedContent(finalContent)
                            .build());
                    modifiedFiles.add(relPath);
                    anyApplied = true;
                }
            } catch (IOException ex) {
                log.warn("Failed to apply modification to {}: {}", relPath, ex.getMessage());
            }
        }
        return anyApplied;
    }

    /**
     * Capture git diff (HEAD vs working tree) for each modified file so the UI
     * can show the before/after content.
     */
    private void captureGitDiffs(String repoPath, List<String> modifiedFiles,
                                 List<FileChange> fileChanges) {
        Path repoRoot = Paths.get(repoPath).toAbsolutePath().normalize();
        for (String relPath : modifiedFiles) {
            Path filePath = repoRoot.resolve(relPath).normalize();
            // Guard against path traversal
            if (!filePath.startsWith(repoRoot)) {
                log.warn("Path traversal attempt blocked in captureGitDiffs: {}", relPath);
                continue;
            }
            try {
                // Get the original content from HEAD
                String original;
                try {
                    original = runGitCommand(repoPath, "git", "show", "HEAD:" + relPath);
                } catch (IOException ex) {
                    original = ""; // new file
                }
                // Get the current (modified) content from disk
                String modified = Files.exists(filePath)
                        ? Files.readString(filePath, StandardCharsets.UTF_8) : "";
                fileChanges.add(FileChange.builder()
                        .filePath(relPath)
                        .originalContent(original)
                        .modifiedContent(modified)
                        .build());
            } catch (IOException ex) {
                log.warn("Failed to capture diff for {}: {}", relPath, ex.getMessage());
            }
        }
    }

    private List<String> detectModifiedFiles(String repoPath) {
        try {
            // Use git status --porcelain to detect both tracked changes and new untracked files
            String output = runGitCommand(repoPath, "git", "status", "--porcelain");
            if (output.isBlank()) {
                return List.of();
            }
            return Arrays.stream(output.split("\n"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(s -> s.length() > 3 ? s.substring(3) : s)
                    .toList();
        } catch (IOException ex) {
            log.warn("Failed to detect modified files: {}", ex.getMessage());
            return List.of();
        }
    }

    private void rollbackBranch(String repoPath, String originalBranch, String branchName) {
        try {
            runGitCommand(repoPath, "git", "reset", "--hard");
            runGitCommand(repoPath, "git", "checkout", originalBranch);
            runGitCommand(repoPath, "git", "branch", "-D", branchName);
            log.info("Rolled back to branch '{}' and deleted '{}'", originalBranch, branchName);
        } catch (IOException rollbackEx) {
            log.warn("Rollback failed: {}", rollbackEx.getMessage());
        }
    }

    private String runGitCommand(String workDir, String... command) throws IOException {
        // Replace bare "git" with the resolved executable so it works on Windows
        String[] resolvedCommand = Arrays.copyOf(command, command.length);
        if (resolvedCommand.length > 0 && "git".equals(resolvedCommand[0])) {
            resolvedCommand[0] = GIT_EXECUTABLE;
        }
        ProcessBuilder pb = new ProcessBuilder(resolvedCommand);
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

    /**
     * Build a branch name like feature/{jiraKey}-{story-name-slug}.
     * e.g. feature/SCRUM-26-add-login-page
     */
    private String buildBranchName(String jiraKey, String storyTitle) {
        String keyPart = (jiraKey != null ? jiraKey.trim() : "unknown").toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9-]+", "-").replaceAll("^-|-$", "");
        String titleSlug = "";
        if (storyTitle != null && !storyTitle.isBlank()) {
            titleSlug = storyTitle.toLowerCase(Locale.ROOT)
                    .replaceAll("[^a-z0-9]+", "-")
                    .replaceAll("^-|-$", "");
            // Limit slug length to keep branch name reasonable
            if (titleSlug.length() > 50) {
                titleSlug = titleSlug.substring(0, 50).replaceAll("-$", "");
            }
        }
        if (titleSlug.isEmpty()) {
            return "feature/" + keyPart + "-changes";
        }
        return "feature/" + keyPart + "-" + titleSlug;
    }
}
