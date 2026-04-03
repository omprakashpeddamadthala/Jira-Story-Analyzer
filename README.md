# Jira Story Analyzer

AI-powered Jira Story Analyzer that helps developers understand and implement Jira stories efficiently. It uses Spring AI (OpenAI) to generate developer-friendly output including simplified summaries, step-by-step implementation plans, API contract suggestions, and test case suggestions.

## Tech Stack

### Backend
- **Java 17** with **Spring Boot 3.2**
- **Spring AI** (OpenAI GPT-4o integration)
- **Spring Data JPA** with **PostgreSQL**
- **Lombok** for boilerplate reduction
- **UUIDs** for entity identifiers
- **Bean Validation** for request validation

### Frontend
- **React 18** with **TypeScript**
- **Material UI (MUI)** for UI components
- **Vite** for build tooling
- **Axios** for HTTP client

## Prerequisites

- Java 17+
- Maven 3.6+
- Node.js 18+
- PostgreSQL 14+ (or Docker)
- OpenAI API key
- Jira Cloud API token

## Quick Start

### 1. Start PostgreSQL

Using Docker Compose:

```bash
docker-compose up -d
```

Or use an existing PostgreSQL instance and update `backend/src/main/resources/application.yml`.

### 2. Configure Environment Variables

Set the following environment variables:

```bash
export OPENAI_API_KEY=your-openai-api-key
export JIRA_BASE_URL=https://your-domain.atlassian.net
export JIRA_EMAIL=your-email@example.com
export JIRA_API_TOKEN=your-jira-api-token
```

### 3. Start the Backend

```bash
cd backend
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

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/jira/stories` | Fetch all assigned Jira stories |
| GET | `/api/v1/jira/stories/{key}` | Fetch a specific Jira story |
| POST | `/api/v1/analysis/analyze` | Analyze a Jira story with AI |
| GET | `/api/v1/analysis/stories` | Get all analyzed stories |
| GET | `/api/v1/analysis/stories/{id}` | Get analyzed story by ID |
| GET | `/api/v1/analysis/stories/jira/{key}` | Get analyzed story by Jira key |
| DELETE | `/api/v1/analysis/stories/{id}` | Delete an analyzed story |

## Analysis Output

When you analyze a Jira story, the AI generates:

1. **Simplified Story Summary** - Clear, concise developer-friendly summary
2. **Step-by-Step Implementation Plan** - Small, focused tasks for Copilot-friendly development
3. **API Contract Suggestions** - REST API endpoint specifications
4. **Test Case Suggestions** - Unit, integration, edge case, and acceptance tests

## Architecture

```
backend/
├── src/main/java/com/jiranalyzer/
│   ├── config/          # Configuration classes
│   ├── controller/      # REST controllers
│   ├── dto/             # Data Transfer Objects
│   │   ├── request/     # Request DTOs
│   │   └── response/    # Response DTOs
│   ├── entity/          # JPA entities
│   ├── exception/       # Custom exceptions & handler
│   ├── repository/      # Spring Data repositories
│   ├── service/         # Service interfaces
│   │   └── impl/        # Service implementations
│   └── JiraStoryAnalyzerApplication.java
└── src/main/resources/
    └── application.yml

frontend/
├── src/
│   ├── components/      # React components
│   ├── services/        # API client services
│   ├── theme/           # MUI theme configuration
│   ├── types/           # TypeScript interfaces
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Entry point
└── .env                 # Environment variables
```

## Design Patterns Used

- **Repository Pattern** - Data access abstraction
- **Service Layer Pattern** - Business logic separation
- **DTO Pattern** - Data transfer between layers
- **Builder Pattern** - Object construction (Lombok @Builder)
- **Strategy Pattern** - AI prompt generation for different analysis types
- **Template Method** - Common AI call pattern with varying prompts

## License

See [LICENSE](LICENSE) file.
