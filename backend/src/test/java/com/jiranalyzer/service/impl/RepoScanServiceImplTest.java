package com.jiranalyzer.service.impl;

import com.jiranalyzer.dto.response.RepoScanResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class RepoScanServiceImplTest {

    private RepoScanServiceImpl repoScanService;

    @BeforeEach
    void setUp() {
        repoScanService = new RepoScanServiceImpl();
    }

    @Test
    void shouldScanFolderWithGitRepo(@TempDir Path tempDir) throws IOException {
        // Create a mock git repo
        Path repo1 = tempDir.resolve("my-project");
        Files.createDirectories(repo1.resolve(".git"));
        Files.createDirectories(repo1.resolve("src"));
        Files.writeString(repo1.resolve("package.json"), "{\"name\": \"test\", \"dependencies\": {\"react\": \"^18\"}}");
        Files.writeString(repo1.resolve("src/index.ts"), "console.log('hello');");

        RepoScanResponse result = repoScanService.scanFolder(tempDir.toString());

        assertNotNull(result);
        assertEquals(tempDir.toString(), result.getFolderPath());
        assertEquals(1, result.getTotalRepos());
        assertEquals("my-project", result.getRepositories().get(0).getName());
        assertTrue(result.getRepositories().get(0).getLanguages().contains("JavaScript/TypeScript"));
        assertEquals("npm", result.getRepositories().get(0).getPackageManager());
    }

    @Test
    void shouldDetectMultipleRepos(@TempDir Path tempDir) throws IOException {
        // Create two repos
        Path repo1 = tempDir.resolve("frontend");
        Files.createDirectories(repo1.resolve(".git"));
        Files.writeString(repo1.resolve("package.json"), "{\"name\": \"frontend\"}");

        Path repo2 = tempDir.resolve("backend");
        Files.createDirectories(repo2.resolve(".git"));
        Files.writeString(repo2.resolve("pom.xml"), "<project><spring-boot>true</spring-boot></project>");

        RepoScanResponse result = repoScanService.scanFolder(tempDir.toString());

        assertNotNull(result);
        assertEquals(2, result.getTotalRepos());
    }

    @Test
    void shouldCacheScanResults(@TempDir Path tempDir) throws IOException {
        Path repo = tempDir.resolve("cached-repo");
        Files.createDirectories(repo.resolve(".git"));

        assertFalse(repoScanService.hasCachedScan(tempDir.toString()));

        repoScanService.scanFolder(tempDir.toString());

        assertTrue(repoScanService.hasCachedScan(tempDir.toString()));
        assertNotNull(repoScanService.getCachedScan(tempDir.toString()));
    }

    @Test
    void shouldThrowForInvalidPath() {
        assertThrows(IllegalArgumentException.class,
                () -> repoScanService.scanFolder("/nonexistent/path/12345"));
    }

    @Test
    void shouldIgnoreNodeModules(@TempDir Path tempDir) throws IOException {
        Path repo = tempDir.resolve("test-repo");
        Files.createDirectories(repo.resolve(".git"));
        Files.createDirectories(repo.resolve("node_modules/some-package"));
        Files.writeString(repo.resolve("package.json"), "{}");
        Files.writeString(repo.resolve("node_modules/some-package/index.js"), "module.exports = {}");

        RepoScanResponse result = repoScanService.scanFolder(tempDir.toString());

        assertNotNull(result);
        // node_modules dir should not be in top-level dirs
        RepoScanResponse.RepoInfo repoInfo = result.getRepositories().get(0);
        assertFalse(repoInfo.getStructure().getTopLevelDirs().contains("node_modules"));
    }

    @Test
    void shouldDetectJavaSpringBootProject(@TempDir Path tempDir) throws IOException {
        Path repo = tempDir.resolve("spring-app");
        Files.createDirectories(repo.resolve(".git"));
        Files.createDirectories(repo.resolve("src/main/java"));
        Files.writeString(repo.resolve("pom.xml"),
                "<project><dependencies><dependency>spring-boot</dependency><dependency>spring-data-jpa</dependency></dependencies></project>");
        Files.writeString(repo.resolve("src/main/java/App.java"), "public class App {}");

        RepoScanResponse result = repoScanService.scanFolder(tempDir.toString());

        RepoScanResponse.RepoInfo repoInfo = result.getRepositories().get(0);
        assertEquals("maven", repoInfo.getPackageManager());
        assertTrue(repoInfo.getLanguages().contains("Java"));
        assertTrue(repoInfo.getFrameworks().contains("Spring Boot"));
        assertTrue(repoInfo.getFrameworks().contains("Spring Data JPA"));
    }

    @Test
    void shouldReturnEmptyForFolderWithNoRepos(@TempDir Path tempDir) throws IOException {
        // Create regular files/dirs that are not repos
        Files.writeString(tempDir.resolve("readme.txt"), "hello");

        RepoScanResponse result = repoScanService.scanFolder(tempDir.toString());

        assertNotNull(result);
        assertEquals(0, result.getTotalRepos());
        assertTrue(result.getRepositories().isEmpty());
    }
}
