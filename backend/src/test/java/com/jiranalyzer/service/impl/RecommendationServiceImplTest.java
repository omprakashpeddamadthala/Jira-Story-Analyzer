package com.jiranalyzer.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiranalyzer.dto.request.GenerateRecommendationsRequest;
import com.jiranalyzer.dto.response.RecommendationResponse;
import com.jiranalyzer.dto.response.RepoScanResponse;
import com.jiranalyzer.exception.AiAnalysisException;
import com.jiranalyzer.service.AIService;
import com.jiranalyzer.service.RepoScanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceImplTest {

    @Mock
    private AIService aiService;

    @Mock
    private RepoScanService repoScanService;

    private RecommendationServiceImpl recommendationService;

    @BeforeEach
    void setUp() {
        recommendationService = new RecommendationServiceImpl(aiService, repoScanService, new ObjectMapper());
    }

    @Test
    void shouldGenerateRecommendationsSuccessfully() {
        GenerateRecommendationsRequest request = GenerateRecommendationsRequest.builder()
                .title("Add user authentication")
                .description("Implement login/logout")
                .acceptanceCriteria("User can log in with email/password")
                .folderPath("/repos")
                .jiraKey("PROJ-123")
                .build();

        RepoScanResponse scanResponse = RepoScanResponse.builder()
                .folderPath("/repos")
                .totalRepos(1)
                .repositories(List.of(
                        RepoScanResponse.RepoInfo.builder()
                                .name("backend")
                                .path("/repos/backend")
                                .languages(List.of("Java"))
                                .frameworks(List.of("Spring Boot"))
                                .packageManager("maven")
                                .entryPoints(List.of())
                                .keyModules(List.of("src"))
                                .structure(RepoScanResponse.DirectoryStructure.builder()
                                        .name("backend")
                                        .topLevelDirs(List.of("src"))
                                        .topLevelFiles(List.of("pom.xml"))
                                        .build())
                                .totalFiles(50)
                                .totalDirectories(10)
                                .build()
                ))
                .build();

        when(repoScanService.hasCachedScan("/repos")).thenReturn(true);
        when(repoScanService.getCachedScan("/repos")).thenReturn(scanResponse);

        String aiResponse = """
                {
                  "summary": "Add authentication endpoints and security config",
                  "impactedRepos": ["backend"],
                  "changes": [
                    {
                      "repo": "backend",
                      "files": ["src/main/java/config/SecurityConfig.java", "src/main/java/controller/AuthController.java"],
                      "rationale": "Need security configuration and auth endpoints",
                      "risk": "medium",
                      "patch": "// Add Spring Security config"
                    }
                  ]
                }
                """;

        when(aiService.generateResponse(anyString())).thenReturn(aiResponse);

        RecommendationResponse response = recommendationService.generateRecommendations(request);

        assertNotNull(response);
        assertEquals("Add authentication endpoints and security config", response.getSummary());
        assertEquals("PROJ-123", response.getJiraKey());
        assertEquals(1, response.getImpactedRepos().size());
        assertEquals("backend", response.getImpactedRepos().get(0));
        assertEquals(1, response.getChanges().size());
        assertEquals("medium", response.getChanges().get(0).getRisk());
        assertEquals(2, response.getChanges().get(0).getFiles().size());
    }

    @Test
    void shouldThrowWhenFolderNotScanned() {
        GenerateRecommendationsRequest request = GenerateRecommendationsRequest.builder()
                .title("Title")
                .description("Desc")
                .acceptanceCriteria("AC")
                .folderPath("/not-scanned")
                .build();

        when(repoScanService.hasCachedScan("/not-scanned")).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> recommendationService.generateRecommendations(request));
    }

    @Test
    void shouldThrowWhenAiFails() {
        GenerateRecommendationsRequest request = GenerateRecommendationsRequest.builder()
                .title("Title")
                .description("Desc")
                .acceptanceCriteria("AC")
                .folderPath("/repos")
                .build();

        RepoScanResponse scanResponse = RepoScanResponse.builder()
                .folderPath("/repos")
                .totalRepos(0)
                .repositories(List.of())
                .build();

        when(repoScanService.hasCachedScan("/repos")).thenReturn(true);
        when(repoScanService.getCachedScan("/repos")).thenReturn(scanResponse);
        when(aiService.generateResponse(anyString()))
                .thenThrow(new AiAnalysisException("AI unavailable"));

        assertThrows(AiAnalysisException.class,
                () -> recommendationService.generateRecommendations(request));
    }

    @Test
    void shouldValidateRecommendationJsonSchema() {
        GenerateRecommendationsRequest request = GenerateRecommendationsRequest.builder()
                .title("Title")
                .description("Desc")
                .acceptanceCriteria("AC")
                .folderPath("/repos")
                .jiraKey("TEST-1")
                .build();

        RepoScanResponse scanResponse = RepoScanResponse.builder()
                .folderPath("/repos")
                .totalRepos(1)
                .repositories(List.of(
                        RepoScanResponse.RepoInfo.builder()
                                .name("app")
                                .path("/repos/app")
                                .languages(List.of("TypeScript"))
                                .frameworks(List.of("React"))
                                .packageManager("npm")
                                .entryPoints(List.of())
                                .keyModules(List.of())
                                .structure(RepoScanResponse.DirectoryStructure.builder()
                                        .name("app")
                                        .topLevelDirs(List.of("src"))
                                        .topLevelFiles(List.of("package.json"))
                                        .build())
                                .totalFiles(20)
                                .totalDirectories(5)
                                .build()
                ))
                .build();

        when(repoScanService.hasCachedScan("/repos")).thenReturn(true);
        when(repoScanService.getCachedScan("/repos")).thenReturn(scanResponse);

        String aiResponse = """
                {
                  "summary": "Update React components",
                  "impactedRepos": ["app"],
                  "changes": [
                    {
                      "repo": "app",
                      "files": ["src/App.tsx"],
                      "rationale": "Main app component needs routing update",
                      "risk": "low",
                      "patch": "// Add new route"
                    },
                    {
                      "repo": "app",
                      "files": ["src/components/NewFeature.tsx"],
                      "rationale": "New component for feature",
                      "risk": "low"
                    }
                  ]
                }
                """;

        when(aiService.generateResponse(anyString())).thenReturn(aiResponse);

        RecommendationResponse response = recommendationService.generateRecommendations(request);

        // Validate schema compliance
        assertNotNull(response.getSummary());
        assertNotNull(response.getImpactedRepos());
        assertNotNull(response.getChanges());
        assertEquals(2, response.getChanges().size());

        // Each change should have required fields
        response.getChanges().forEach(change -> {
            assertNotNull(change.getRepo());
            assertNotNull(change.getFiles());
            assertNotNull(change.getRationale());
            assertNotNull(change.getRisk());
        });
    }
}
