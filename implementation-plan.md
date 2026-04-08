# Implementation Plan — Jira Story Analyzer Comprehensive Refactor

## Overview
Comprehensive refactoring of the Jira-Story-Analyzer application across 10 requirements to deliver production-quality, environment-driven, extensible code.

## Approach & Design Decisions

### 1. Application Configuration Refactor
- **Approach**: Remove all `${VAR:default}` patterns from `application.yml`; every sensitive or environment-specific value must come strictly from `.env`.
- **Design Decision**: Added `@PostConstruct validate()` in `AIProperties` for fail-fast behavior — the application will refuse to start if `AI_PROVIDER` is missing or unsupported.

### 2. Remove Jira Backend Configuration
- **Approach**: Remove `jira.base-url`, `jira.email`, `jira.api-token` from `application.yml`. Deprecate `JiraConfig` class.
- **Design Decision**: `JiraSettingsServiceImpl` now reads exclusively from the database (UI-configured values). No fallback to properties.

### 3. AI Provider Switching (Strategy/Factory Pattern)
- **Approach**: Single `@Bean` factory method in `AIProviderConfig` that resolves the active `AIService` implementation based on `ai.provider` and available API keys.
- **Design Decision**: Resolution priority — if both keys present, use `ai.provider`; if only one key present, use that provider regardless of config; if none, use configured provider (runtime calls will fail with clear error).

### 4. Definition of Done Optional
- **Approach**: Remove `@NotBlank` from `definitionOfDone` in `AnalyzeStoryRequest` DTO. Handle null gracefully in prompt generation.
- **Design Decision**: Frontend sends the field only when non-empty. Backend replaces null with empty string in template substitution.

### 5. AI Prompts Page Refactor
- **Approach**: Extract AI Prompts into a dedicated `/aiprompts` route with its own page component. Remove the tab from Settings.
- **Design Decision**: Settings page now focuses solely on Jira Connection. AI Prompts gets its own navigation entry.

### 6. UI Improvements (Loading Animations)
- **Approach**: Leverage existing streaming state to disable inputs during AI calls. Button text changed from "Analyze with OpenAI" to "Analyze with AI" (provider-agnostic).
- **Design Decision**: Existing CircularProgress and "Generating prompt with {provider}..." indicator already provides good UX. Made it provider-agnostic.

### 7. Code Quality & Best Practices
- **Approach**: Add logging at key decision points (AI provider resolution, Jira config updates). Improve error messages. Follow existing conventions.
- **Design Decision**: Minimal, focused changes — avoid large refactors. Each service clearly logs its lifecycle.

### 8. Testing
- **Approach**: Update all existing tests to match refactored APIs. Add new tests for validation, provider resolution fallback, and optional fields.
- **Coverage**: AIProperties validation (6 new tests), AIProviderConfig factory logic (8 tests), AiAnalysisServiceImpl null DoD handling.

### 9. Deliverables
- `implementation-plan.md` (this file)
- `implementation-done.md` (companion file)

### 10. Final Validation
- Backend compiles and all tests pass
- Frontend TypeScript checks pass and production build succeeds
- No hardcoded secrets
