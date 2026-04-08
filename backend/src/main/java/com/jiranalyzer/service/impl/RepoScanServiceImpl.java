package com.jiranalyzer.service.impl;

import com.jiranalyzer.dto.response.RepoScanResponse;
import com.jiranalyzer.dto.response.RepoScanResponse.DirectoryStructure;
import com.jiranalyzer.dto.response.RepoScanResponse.RepoInfo;
import com.jiranalyzer.service.RepoScanService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

@Service
@Slf4j
public class RepoScanServiceImpl implements RepoScanService {

    private final ConcurrentHashMap<String, RepoScanResponse> cache = new ConcurrentHashMap<>();

    /** Directories to skip during scanning. */
    private static final Set<String> IGNORED_DIRS = Set.of(
            "node_modules", ".git", "target", "build", "dist", "out",
            ".idea", ".vscode", ".gradle", "__pycache__", ".cache",
            "vendor", "bin", ".next", ".nuxt", "coverage", ".mvn"
    );

    /** File extensions considered binary/large and skipped. */
    private static final Set<String> IGNORED_EXTENSIONS = Set.of(
            ".jar", ".war", ".class", ".exe", ".dll", ".so", ".dylib",
            ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".bmp",
            ".zip", ".tar", ".gz", ".rar", ".7z",
            ".pdf", ".doc", ".docx", ".xls", ".xlsx",
            ".mp3", ".mp4", ".avi", ".mov", ".woff", ".woff2", ".ttf", ".eot"
    );

    /** Max file size to consider (256 KB). */
    private static final long MAX_FILE_SIZE = 256 * 1024;

    @Override
    public RepoScanResponse scanFolder(String folderPath) {
        log.info("Scanning folder: {}", folderPath);
        Path root = Paths.get(folderPath);
        if (!Files.isDirectory(root)) {
            throw new IllegalArgumentException("Path is not a valid directory: " + folderPath);
        }

        List<RepoInfo> repos = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(root)) {
            for (Path child : stream) {
                if (Files.isDirectory(child)) {
                    // Check if it's a git repo or treat as a project directory
                    if (Files.isDirectory(child.resolve(".git")) || looksLikeProject(child)) {
                        try {
                            RepoInfo info = analyzeRepo(child);
                            repos.add(info);
                            log.info("Scanned repo: {} ({} files)", info.getName(), info.getTotalFiles());
                        } catch (Exception ex) {
                            log.warn("Failed to scan repo {}: {}", child.getFileName(), ex.getMessage());
                        }
                    }
                }
            }
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to read directory: " + folderPath, ex);
        }

        RepoScanResponse response = RepoScanResponse.builder()
                .folderPath(folderPath)
                .totalRepos(repos.size())
                .repositories(repos)
                .build();

        cache.put(folderPath, response);
        log.info("Scan complete: {} repositories found in {}", repos.size(), folderPath);
        return response;
    }

    @Override
    public RepoScanResponse getCachedScan(String folderPath) {
        return cache.get(folderPath);
    }

    @Override
    public boolean hasCachedScan(String folderPath) {
        return cache.containsKey(folderPath);
    }

    private boolean looksLikeProject(Path dir) {
        return Files.exists(dir.resolve("package.json"))
                || Files.exists(dir.resolve("pom.xml"))
                || Files.exists(dir.resolve("build.gradle"))
                || Files.exists(dir.resolve("Cargo.toml"))
                || Files.exists(dir.resolve("go.mod"))
                || Files.exists(dir.resolve("requirements.txt"))
                || Files.exists(dir.resolve("pyproject.toml"))
                || Files.exists(dir.resolve("Gemfile"))
                || Files.exists(dir.resolve("Makefile"));
    }

    private RepoInfo analyzeRepo(Path repoPath) throws IOException {
        String name = repoPath.getFileName().toString();
        Set<String> languages = new HashSet<>();
        Set<String> frameworks = new HashSet<>();
        List<String> entryPoints = new ArrayList<>();
        List<String> keyModules = new ArrayList<>();
        String packageManager = "unknown";
        int[] counts = {0, 0}; // [files, dirs]

        // Detect package manager and frameworks from config files
        if (Files.exists(repoPath.resolve("package.json"))) {
            packageManager = "npm";
            languages.add("JavaScript/TypeScript");
            detectNodeFrameworks(repoPath, frameworks);
        }
        if (Files.exists(repoPath.resolve("pom.xml"))) {
            packageManager = "maven";
            languages.add("Java");
            detectJavaFrameworks(repoPath, frameworks);
        }
        if (Files.exists(repoPath.resolve("build.gradle")) || Files.exists(repoPath.resolve("build.gradle.kts"))) {
            packageManager = "gradle";
            languages.add("Java/Kotlin");
        }
        if (Files.exists(repoPath.resolve("Cargo.toml"))) {
            packageManager = "cargo";
            languages.add("Rust");
        }
        if (Files.exists(repoPath.resolve("go.mod"))) {
            packageManager = "go modules";
            languages.add("Go");
        }
        if (Files.exists(repoPath.resolve("requirements.txt")) || Files.exists(repoPath.resolve("pyproject.toml"))) {
            packageManager = "pip/poetry";
            languages.add("Python");
            detectPythonFrameworks(repoPath, frameworks);
        }
        if (Files.exists(repoPath.resolve("Gemfile"))) {
            packageManager = "bundler";
            languages.add("Ruby");
        }

        // Scan directory structure (populate lists only; scanDeep handles counting)
        List<String> topLevelDirs = new ArrayList<>();
        List<String> topLevelFiles = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(repoPath)) {
            for (Path child : stream) {
                String childName = child.getFileName().toString();
                if (IGNORED_DIRS.contains(childName) || childName.startsWith(".")) continue;
                if (Files.isDirectory(child)) {
                    topLevelDirs.add(childName);
                } else {
                    topLevelFiles.add(childName);
                }
            }
        }

        // Deep scan for languages and counts
        scanDeep(repoPath, languages, entryPoints, keyModules, counts, 0);

        DirectoryStructure structure = DirectoryStructure.builder()
                .name(name)
                .topLevelDirs(topLevelDirs)
                .topLevelFiles(topLevelFiles)
                .build();

        return RepoInfo.builder()
                .name(name)
                .path(repoPath.toAbsolutePath().toString())
                .languages(new ArrayList<>(languages))
                .frameworks(new ArrayList<>(frameworks))
                .packageManager(packageManager)
                .entryPoints(entryPoints)
                .keyModules(keyModules)
                .structure(structure)
                .totalFiles(counts[0])
                .totalDirectories(counts[1])
                .build();
    }

    private void scanDeep(Path dir, Set<String> languages, List<String> entryPoints,
                          List<String> keyModules, int[] counts, int depth) throws IOException {
        if (depth > 6) return; // Limit recursion depth

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
            for (Path child : stream) {
                String childName = child.getFileName().toString();
                if (IGNORED_DIRS.contains(childName) || childName.startsWith(".")) continue;

                if (Files.isDirectory(child)) {
                    counts[1]++;
                    // Detect key modules from directory names
                    if (depth <= 2 && isKeyModule(childName)) {
                        keyModules.add(dir.relativize(child).toString());
                    }
                    scanDeep(child, languages, entryPoints, keyModules, counts, depth + 1);
                } else {
                    if (isIgnoredFile(childName)) continue;
                    try {
                        if (Files.size(child) > MAX_FILE_SIZE) continue;
                    } catch (IOException ignored) {
                        continue;
                    }
                    counts[0]++;
                    detectLanguage(childName, languages);
                    if (isEntryPoint(childName) && entryPoints.size() < 10) {
                        entryPoints.add(dir.relativize(child).toString());
                    }
                }
            }
        }
    }

    private boolean isKeyModule(String dirName) {
        return Set.of("src", "lib", "app", "api", "service", "services",
                "controller", "controllers", "model", "models", "config",
                "utils", "helpers", "middleware", "routes", "components",
                "pages", "views", "templates", "tests", "test", "spec").contains(dirName.toLowerCase());
    }

    private boolean isEntryPoint(String fileName) {
        return Set.of("main.java", "application.java", "app.java",
                "main.py", "app.py", "manage.py", "wsgi.py",
                "main.go", "main.rs", "main.ts", "main.tsx",
                "index.js", "index.ts", "index.tsx", "app.tsx", "app.ts",
                "server.js", "server.ts", "program.cs"
        ).contains(fileName.toLowerCase());
    }

    private void detectLanguage(String fileName, Set<String> languages) {
        if (fileName.endsWith(".java")) languages.add("Java");
        else if (fileName.endsWith(".ts") || fileName.endsWith(".tsx")) languages.add("TypeScript");
        else if (fileName.endsWith(".js") || fileName.endsWith(".jsx")) languages.add("JavaScript");
        else if (fileName.endsWith(".py")) languages.add("Python");
        else if (fileName.endsWith(".go")) languages.add("Go");
        else if (fileName.endsWith(".rs")) languages.add("Rust");
        else if (fileName.endsWith(".rb")) languages.add("Ruby");
        else if (fileName.endsWith(".cs")) languages.add("C#");
        else if (fileName.endsWith(".kt") || fileName.endsWith(".kts")) languages.add("Kotlin");
        else if (fileName.endsWith(".scala")) languages.add("Scala");
        else if (fileName.endsWith(".cpp") || fileName.endsWith(".cc") || fileName.endsWith(".h")) languages.add("C/C++");
    }

    private boolean isIgnoredFile(String fileName) {
        String lower = fileName.toLowerCase();
        return IGNORED_EXTENSIONS.stream().anyMatch(lower::endsWith)
                || lower.equals("package-lock.json")
                || lower.equals("yarn.lock")
                || lower.equals("pnpm-lock.yaml");
    }

    private void detectNodeFrameworks(Path repoPath, Set<String> frameworks) {
        try {
            String content = Files.readString(repoPath.resolve("package.json"));
            if (content.contains("\"react\"")) frameworks.add("React");
            if (content.contains("\"next\"")) frameworks.add("Next.js");
            if (content.contains("\"vue\"")) frameworks.add("Vue");
            if (content.contains("\"angular\"") || content.contains("@angular/core")) frameworks.add("Angular");
            if (content.contains("\"express\"")) frameworks.add("Express");
            if (content.contains("\"nestjs\"") || content.contains("@nestjs/")) frameworks.add("NestJS");
            if (content.contains("\"vite\"")) frameworks.add("Vite");
            if (content.contains("\"@mui/material\"")) frameworks.add("Material UI");
        } catch (IOException ignored) {
            // best-effort
        }
    }

    private void detectJavaFrameworks(Path repoPath, Set<String> frameworks) {
        try {
            String content = Files.readString(repoPath.resolve("pom.xml"));
            if (content.contains("spring-boot")) frameworks.add("Spring Boot");
            if (content.contains("spring-ai")) frameworks.add("Spring AI");
            if (content.contains("spring-data-jpa")) frameworks.add("Spring Data JPA");
            if (content.contains("spring-security")) frameworks.add("Spring Security");
        } catch (IOException ignored) {
            // best-effort
        }
    }

    private void detectPythonFrameworks(Path repoPath, Set<String> frameworks) {
        try {
            Path reqFile = repoPath.resolve("requirements.txt");
            if (Files.exists(reqFile)) {
                String content = Files.readString(reqFile);
                if (content.contains("django")) frameworks.add("Django");
                if (content.contains("flask")) frameworks.add("Flask");
                if (content.contains("fastapi")) frameworks.add("FastAPI");
            }
            Path pyprojectFile = repoPath.resolve("pyproject.toml");
            if (Files.exists(pyprojectFile)) {
                String content = Files.readString(pyprojectFile);
                if (content.contains("django")) frameworks.add("Django");
                if (content.contains("flask")) frameworks.add("Flask");
                if (content.contains("fastapi")) frameworks.add("FastAPI");
            }
        } catch (IOException ignored) {
            // best-effort
        }
    }
}
