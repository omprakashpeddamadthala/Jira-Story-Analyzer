# Jira Story Analyzer

AI-powered Jira Story Analyzer that helps developers understand, improve, and implement Jira stories efficiently. It uses Spring AI (OpenAI/Gemini) to generate developer-friendly output including simplified summaries, implementation plans, API contracts, test suggestions, and **automated change recommendations with code application**.

## Features

- **Jira Story Fetch & Display** — Connect to Jira Cloud, fetch assigned stories, auto-populate Title/Description/Acceptance Criteria
- **AI Rephrasing** — Rephrase and improve story content with OpenAI/Gemini, side-by-side original vs rephrased comparison
- **Repository Scanning** — Point at a folder of repositories; the system detects languages, frameworks, structure, and builds context
- **Change Recommendations** — Given a story + repo context, generates structured JSON recommendations with impacted files, rationale, risk, and patches
- **Apply Changes** — On approval, applies changes to the target codebase with git branch creation, commits, and dry-run support
- **Streaming Analysis** — Server-Sent Events (SSE) for real-time AI analysis progress

## Tech Stack

### Backend
- **Java 17** with **Spring Boot 3.2**
- **Spring AI** (OpenAI GPT-4o / Gemini 2.0 Flash)
- **Spring Data JPA** with **PostgreSQL**
- **Lombok** for boilerplate reduction
- **UUIDs** for entity identifiers
- **Bean Validation** for request validation

### Frontend
- **React 18** with **TypeScript**
- **Material UI (MUI)** for UI components
- **Vite** for build tooling
- **Axios** for HTTP client
- **React Router** for navigation

## Prerequisites

- Java 17+
- Maven 3.6+
- Node.js 18+
- PostgreSQL 14+ (or Docker)
- OpenAI API key (or Gemini API key)
- Jira Cloud API token (configured via UI)

## Quick Start

### 1. Start PostgreSQL

Using Docker Compose:

```bash
docker-compose up -d
```

Or use an existing PostgreSQL instance.

### 2. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/jira_analyzer` |
| `DATABASE_USERNAME` | Database username | `postgres` |
| `DATABASE_PASSWORD` | Database password | `postgres` |
| `AI_PROVIDER` | AI provider to use | `openai` or `gemini` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `GEMINI_API_KEY` | Gemini API key (if using Gemini) | `AI...` |
| `VITE_API_BASE_URL` | Backend URL for frontend | `http://localhost:8080` |

**Jira credentials** (email, API token, base URL) are configured through the **Settings** page in the UI and stored in the database.

### 3. Start the Backend

```bash
cd backend
export DATABASE_URL=jdbc:postgresql://localhost:5432/jira_analyzer
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=postgres
export AI_PROVIDER=openai
export OPENAI_API_KEY=your-key
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`.

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`.

## Workflow

### 1. Configure Jira (Settings Page)
Navigate to **Settings** and enter your Jira Cloud base URL, email, and API token. Test the connection to verify.

### 2. Analyze a Story (Analyze Page)
- Select a Jira story from the list
- Fields auto-populate: Title, Description, Acceptance Criteria
- Click **"Rephrase with AI"** to get improved versions (side-by-side comparison)
- Click **"Use Rephrased"** to adopt the AI-improved content
- Click **"Analyze with AI"** to generate a Copilot implementation prompt

### 3. Generate Recommendations (Recommendations Page)
- Select a story and optionally rephrase it
- Enter a **folder path** containing your repositories and click **Scan**
- The system analyzes each repo's languages, frameworks, structure, and key modules
- Click **"Generate Recommendations"** to get AI-powered change recommendations
- Review each recommendation: see impacted files, rationale, risk level, and suggested patches
- **Approve or reject** individual changes

### 4. Apply Changes
- After approving changes, click **"Apply Changes"**
- Toggle **Dry Run** mode to preview what would change without modifying files
- When applied for real, the system:
  - Creates a new git branch (`devin/<story-key>-changes`)
  - Applies patches or marks files for modification
  - Commits with a meaningful message
  - Reports results per repository

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/jira/stories` | Fetch all assigned Jira stories |
| GET | `/api/v1/jira/stories/{key}` | Fetch a specific Jira story |
| POST | `/api/v1/analysis/analyze` | Analyze a Jira story with AI |
| POST | `/api/v1/analysis/analyze/stream` | Streaming analysis (SSE) |
| POST | `/api/v1/analysis/rephrase` | Rephrase Title/Description/AC with AI |
| GET | `/api/v1/analysis/stories` | Get all analyzed stories |
| GET | `/api/v1/analysis/stories/{id}` | Get analyzed story by ID |
| DELETE | `/api/v1/analysis/stories/{id}` | Delete an analyzed story |
| POST | `/api/v1/repos/scan` | Scan folder for repositories |
| GET | `/api/v1/repos/scan?folderPath=...` | Get cached scan results |
| POST | `/api/v1/recommendations/generate` | Generate change recommendations |
| POST | `/api/v1/changes/apply` | Apply approved changes (supports dry-run) |

### Recommendation JSON Schema

```json
{
  "summary": "High-level summary of recommended changes",
  "jiraKey": "PROJ-123",
  "impactedRepos": ["repo-name-1", "repo-name-2"],
  "changes": [
    {
      "repo": "repo-name",
      "files": ["path/to/file1.java", "path/to/file2.ts"],
      "rationale": "Why this change is needed",
      "risk": "low|medium|high",
      "patch": "Suggested code changes or unified diff"
    }
  ]
}
```

## Architecture

```
backend/
├── src/main/java/com/jiranalyzer/
│   ├── config/          # AI provider config, CORS, RestTemplate
│   ├── controller/      # REST controllers (Analysis, Rephrase, RepoScan, Recommendation, ChangeApply)
│   ├── dto/             # Data Transfer Objects
│   │   ├── request/     # Request DTOs
│   │   └── response/    # Response DTOs
│   ├── entity/          # JPA entities
│   ├── exception/       # Custom exceptions & global handler
│   ├── repository/      # Spring Data repositories
│   ├── service/         # Service interfaces
│   │   └── impl/        # Service implementations
│   └── JiraStoryAnalyzerApplication.java
└── src/main/resources/
    └── application.yml

frontend/
├── src/
│   ├── components/      # React components (StoryForm, RephrasePanel, RepoScanner, RecommendationPanel, ApplyChangesPanel)
│   ├── pages/           # Page components (Dashboard, Analyze, Recommendations, History, Settings, AI Prompts)
│   ├── services/        # API client services
│   ├── theme/           # MUI theme configuration
│   ├── types/           # TypeScript interfaces
│   ├── App.tsx          # Main application with routing
│   └── main.tsx         # Entry point
└── .env                 # Environment variables
```

## Design Patterns

- **Repository Pattern** — Data access abstraction
- **Service Layer Pattern** — Business logic separation
- **DTO Pattern** — Data transfer between layers
- **Builder Pattern** — Object construction (Lombok @Builder)
- **Strategy Pattern** — AI provider resolution (OpenAI vs Gemini)
- **Template Method** — Common AI call pattern with varying prompts

## License

See [LICENSE](LICENSE) file.
