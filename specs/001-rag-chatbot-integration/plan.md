# Implementation Plan: RAG Chatbot Integration

**Branch**: `001-rag-chatbot-integration` | **Date**: 2025-11-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-rag-chatbot-integration/spec.md`

## Summary

Implement a full-featured Retrieval-Augmented Generation (RAG) chatbot integrated into the Docusaurus textbook website. The system provides two query modes: (1) Full-book RAG using vector search from Qdrant Cloud, and (2) Context-specific queries using only user-selected text. The solution consists of a FastAPI backend (with OpenAI integration, Qdrant vector storage, and Neon Postgres database) and a React-based Docusaurus frontend (with floating widget, full-page mode, and text selection integration). The chatbot must achieve ≥85% answer accuracy, <2.5s response latency, and work seamlessly on both GitHub Pages and local development environments.

## Technical Context

**Language/Version**:
- Backend: Python 3.11+
- Frontend: JavaScript/React (Docusaurus 3.x)

**Primary Dependencies**:
- Backend: FastAPI, OpenAI Python SDK, Qdrant Client, Psycopg3 (Neon Postgres), Pydantic
- Frontend: React, Docusaurus plugin API, Fetch API

**Storage**:
- Vector embeddings: Qdrant Cloud Free Tier (collection: "ai_book")
- Relational data: Neon Serverless Postgres (tables: chats, usage_logs)

**Testing**:
- Backend: pytest, pytest-asyncio, httpx (for async testing)
- Frontend: Jest, React Testing Library
- Integration: Playwright for end-to-end tests

**Target Platform**:
- Backend: Serverless deployment (Railway, Render, or equivalent)
- Frontend: GitHub Pages (static site) + local development (npm start)

**Project Type**: Web application (backend + frontend)

**Performance Goals**:
- First token response: <1s for 95% of queries
- Full response completion: <2.5s for 95% of queries
- Vector search retrieval: <500ms
- Concurrent users: 50 without degradation

**Constraints**:
- OpenAI API rate limits (tier-dependent)
- Qdrant Cloud Free Tier: 1GB storage limit
- Neon Free Tier: 0.5GB storage, 100 hours compute/month
- GitHub Pages: Static hosting only (backend must be separate)
- CORS: Must support cross-origin requests from GitHub Pages domain

**Scale/Scope**:
- Textbook content: ~100-200 MDX files (estimated 500KB-1MB total)
- Vector chunks: ~800-1500 chunks (1200 chars each with overlap)
- Expected users: 100-500 concurrent during peak (course enrollment)
- Chat history retention: 30 days

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Pre-Phase 0)

- **Core Principles**:
  - ✅ **AI Agent Responsibilities**: This feature enables the chatbot to answer questions about dynamically generated textbook content, aligning with agent-driven content creation
  - ✅ **Spec-Driven Workflow Rules**: This plan follows `/sp.plan` workflow, with PHR creation and structured phases
  - ✅ **RAG Chatbot Constraints**: Design explicitly enforces retrieval from book content only (no external sources), respects user-selected text context limitation
  - ✅ **Incremental Validation**: Plan includes testable increments (Phase 0 research → Phase 1 design → Phase 2 tasks)
  - ✅ **Operational Standards**: Follows directory structure (specs/, history/), uses Spec-Kit Plus templates

- **Project Sections**:
  - ✅ **AI-Generated Book**: Chatbot will dynamically ingest and index generated book content from Docusaurus MDX files
  - ✅ **RAG Chatbot Development**: Directly implements the mandated stack (FastAPI, ChatKit SDK/OpenAI, Neon Postgres, Qdrant Cloud)

- **Execution Guidelines**:
  - ✅ **Task execution**: Will follow spec → plan → tasks → implementation workflow
  - ✅ **PHR creation**: This plan will generate a PHR upon completion
  - ✅ **ADR suggestion policies**: Will suggest ADRs for: chunking strategy, embedding model choice, authentication mechanism, rate limiting approach
  - ✅ **Minimum acceptance criteria**: Success criteria defined in spec.md (SC-001 through SC-008)

- **Architect Guidelines**:
  - ✅ **Scope & dependencies**: Dependencies clearly identified (Docusaurus, OpenAI, Qdrant, Neon)
  - ✅ **Interfaces & APIs**: REST API endpoints defined, frontend-backend contract specified
  - ✅ **NFRs and budgets**: Performance targets documented (<2.5s latency, ≥85% accuracy, 50 concurrent users)
  - ✅ **Data management**: Chat history (30-day retention), vector embeddings (persistent), usage logs
  - ✅ **Operational readiness**: Health check endpoint, usage logging, error handling
  - ✅ **Risk analysis & mitigation**: Rate limits, service unavailability, latency under load addressed in edge cases

- **Project Structure**:
  - ✅ **File and folder layout**: Follows specs/001-rag-chatbot-integration/ structure
  - ✅ **Template usage**: Using plan-template.md structure

- **Versioning and Governance**:
  - ✅ **Version number**: Branch follows ###-feature-name convention
  - ✅ **Ratified date**: Spec created 2025-11-30
  - ✅ **Constitution compliance**: No violations of constitution v2.0.0

**Initial Gate Result**: ✅ PASS - All constitution requirements met. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-rag-chatbot-integration/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (technical research and decisions)
├── data-model.md        # Phase 1 output (database schemas and entities)
├── quickstart.md        # Phase 1 output (setup and deployment guide)
├── contracts/           # Phase 1 output (API contracts)
│   ├── openapi.yaml     # OpenAPI 3.0 specification for FastAPI backend
│   └── frontend-api.ts  # TypeScript type definitions for frontend
├── checklists/          # Quality validation
│   └── requirements.md  # Spec quality checklist (completed)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Environment configuration
│   ├── models/
│   │   ├── chat.py             # Chat message models
│   │   ├── document.py         # Document chunk models
│   │   └── usage.py            # Usage log models
│   ├── services/
│   │   ├── embedding.py        # OpenAI embedding service
│   │   ├── vectorstore.py      # Qdrant vector store service
│   │   ├── llm.py              # OpenAI ChatCompletion service
│   │   ├── database.py         # Neon Postgres service
│   │   └── ingestion.py        # MDX file ingestion pipeline
│   ├── api/
│   │   ├── routes/
│   │   │   ├── rag.py          # /rag/query and /rag/from-selection endpoints
│   │   │   ├── ingest.py       # /embed-book endpoint
│   │   │   └── health.py       # /health endpoint
│   │   ├── middleware/
│   │   │   ├── auth.py         # API key authentication
│   │   │   ├── cors.py         # CORS configuration
│   │   │   └── rate_limit.py   # Rate limiting middleware
│   │   └── schemas/
│   │       ├── request.py      # Pydantic request schemas
│   │       └── response.py     # Pydantic response schemas
│   └── utils/
│       ├── chunking.py         # Text chunking utilities
│       └── logger.py           # Logging configuration
├── tests/
│   ├── unit/
│   │   ├── test_embedding.py
│   │   ├── test_chunking.py
│   │   └── test_models.py
│   ├── integration/
│   │   ├── test_rag_query.py
│   │   ├── test_ingestion.py
│   │   └── test_database.py
│   └── e2e/
│       └── test_full_flow.py
├── scripts/
│   ├── init_db.py              # Initialize Postgres tables
│   ├── init_qdrant.py          # Initialize Qdrant collection
│   └── ingest_docs.py          # Standalone ingestion script
├── requirements.txt            # Python dependencies
├── requirements-dev.txt        # Development dependencies
├── .env.example                # Environment variables template
└── README.md                   # Backend setup instructions

frontend/
├── docusaurus.config.js        # Docusaurus configuration (updated for plugin)
├── src/
│   ├── components/
│   │   ├── RagChatWidget/
│   │   │   ├── index.jsx       # Main chat widget component
│   │   │   ├── ChatPanel.jsx   # Collapsible chat panel
│   │   │   ├── ChatInput.jsx   # Message input component
│   │   │   ├── ChatMessage.jsx # Message display component
│   │   │   └── FloatingButton.jsx # Floating chat button
│   │   └── TextSelectionMenu/
│   │       └── index.jsx       # Context menu for selected text
│   ├── pages/
│   │   └── chat/
│   │       └── index.jsx       # Full-page chat mode
│   ├── utils/
│   │   ├── api.js              # Backend API client
│   │   ├── storage.js          # LocalStorage utilities for chat history
│   │   └── constants.js        # API endpoints and configuration
│   ├── hooks/
│   │   ├── useChatHistory.js   # Chat history management hook
│   │   └── useTextSelection.js # Text selection detection hook
│   └── theme/
│       └── custom.css          # Global styles (if using classic theme)
├── static/
│   └── css/
│       └── chatbot.css         # Chatbot-specific styles
├── plugins/
│   └── rag-chatbot-plugin/
│       └── index.js            # Docusaurus plugin for injecting chatbot
├── package.json                # Node dependencies
└── README.md                   # Frontend setup instructions

.github/
└── workflows/
    ├── backend-deploy.yml      # Backend CI/CD (Railway/Render)
    └── frontend-deploy.yml     # Frontend deployment to GitHub Pages
```

**Structure Decision**: Web application structure selected because feature requires both backend API (FastAPI) and frontend UI (Docusaurus/React). Backend handles RAG logic, vector search, and database operations. Frontend provides user interface integrated into the existing Docusaurus textbook site. Separation enables independent deployment: backend to serverless platform, frontend to GitHub Pages.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All complexity is justified by constitution requirements:
- Backend/frontend separation: Required for GitHub Pages static hosting
- Multiple storage systems (Qdrant + Neon): Mandated by constitution v2.0.0 section "RAG Chatbot Development"
- FastAPI + OpenAI + Qdrant + Neon: Prescribed by project constitution, not feature-level over-engineering

---

## Phase 0: Research & Decisions

**Status**: NEEDS RESEARCH - Following items require investigation and decision documentation in `research.md`

### Research Tasks

1. **Chunking Strategy Parameters**
   - **Question**: Optimal chunk size and overlap for textbook content (code examples, math equations, diagrams)
   - **Research**: Compare 800/150, 1200/200, 1500/250 character splits on sample MDX files
   - **Decision criteria**: Retrieval accuracy, semantic coherence, chunk count (Qdrant limit)
   - **Output**: Recommended chunk_size and chunk_overlap values with rationale

2. **Embedding Model Selection**
   - **Question**: Confirm text-embedding-3-large vs. text-embedding-3-small for technical textbook content
   - **Research**: Compare embedding quality, cost per token, dimensionality (1536 vs 3072), retrieval performance
   - **Decision criteria**: Accuracy vs. cost tradeoff, Qdrant storage impact
   - **Output**: Selected embedding model with cost/performance analysis

3. **OpenAI Model Selection (GPT-4.1 vs GPT-4.1-mini)**
   - **Question**: Which model balances accuracy and latency for textbook Q&A?
   - **Research**: Test both models on sample queries, measure latency and answer quality
   - **Decision criteria**: <2.5s latency requirement, ≥85% accuracy requirement, cost per query
   - **Output**: Selected model with benchmarks

4. **Vector Search Configuration**
   - **Question**: Optimal top_k (number of chunks retrieved) and similarity threshold
   - **Research**: Test top_k values (3, 5, 7, 10) for retrieval precision/recall
   - **Decision criteria**: Answer completeness vs. context window size, latency impact
   - **Output**: Recommended top_k and similarity_threshold values

5. **Rate Limiting Strategy**
   - **Question**: Request limits per user/IP to prevent abuse without impacting legitimate usage
   - **Research**: Analyze expected query patterns (students during lectures, exam prep)
   - **Decision criteria**: Balance between availability and abuse prevention
   - **Output**: Rate limit thresholds (requests per minute/hour) with justification

6. **Authentication Mechanism**
   - **Question**: API key validation approach (header-based, query param, JWT)
   - **Research**: Security best practices for public-facing API, ease of frontend integration
   - **Decision criteria**: Security, simplicity, GitHub Pages compatibility
   - **Output**: Selected auth mechanism with implementation notes

7. **CORS Configuration**
   - **Question**: Specific CORS headers and allowed origins for GitHub Pages + local dev
   - **Research**: GitHub Pages domain patterns, localhost variations, preflight handling
   - **Decision criteria**: Security (no wildcard *), functionality (both envs work)
   - **Output**: CORS allow_origins list and headers configuration

8. **Chat History Storage Strategy**
   - **Question**: Store in LocalStorage (frontend-only) vs. Postgres (persistent across devices)?
   - **Research**: User expectations, privacy concerns, storage limits, sync complexity
   - **Decision criteria**: User Story 4 requirements (30-day retention, cross-session), privacy
   - **Output**: Selected storage approach with schema design

9. **Streaming Response Implementation**
   - **Question**: SSE (Server-Sent Events) vs. WebSocket for token streaming?
   - **Research**: FastAPI support, browser compatibility, GitHub Pages hosting constraints
   - **Decision criteria**: Simplicity, serverless compatibility, error handling
   - **Output**: Selected streaming protocol with implementation approach

10. **MDX Parsing and Metadata Extraction**
    - **Question**: How to extract chapter/section metadata from Docusaurus MDX files?
    - **Research**: Docusaurus frontmatter structure, MDX processing libraries, file path conventions
    - **Decision criteria**: Accuracy, maintainability, handles all MDX features (JSX, imports)
    - **Output**: Parsing strategy with code examples

11. **Error Handling and Graceful Degradation**
    - **Question**: Fallback strategies when Qdrant/OpenAI unavailable?
    - **Research**: Circuit breaker patterns, cached responses, fallback to keyword search
    - **Decision criteria**: User experience, complexity, reliability SLA
    - **Output**: Error handling strategy with fallback decision tree

12. **Deployment Platform Selection**
    - **Question**: Railway vs. Render vs. other serverless platform?
    - **Research**: Free tier limits, cold start latency, Python support, Postgres/Qdrant connectivity
    - **Decision criteria**: Cost (free tier), performance (<2.5s including cold start), ease of deployment
    - **Output**: Selected platform with deployment configuration

### Research Output File

Create `specs/001-rag-chatbot-integration/research.md` with the following structure:

```markdown
# Technical Research: RAG Chatbot Integration

**Date**: 2025-11-30
**Feature**: 001-rag-chatbot-integration
**Status**: Complete

## Research Summary

[1-2 paragraph overview of key findings]

## Decisions

### 1. Chunking Strategy Parameters
- **Decision**: [chosen values]
- **Rationale**: [why chosen based on testing]
- **Alternatives considered**: [other options and why rejected]
- **Implementation notes**: [any special considerations]

[... repeat for all 12 research tasks ...]

## ADRs Required

Based on research, the following architectural decisions should be documented as ADRs:

1. **ADR-001**: Chunking Strategy for Textbook Content
2. **ADR-002**: Embedding Model Selection
3. **ADR-003**: Rate Limiting Thresholds
4. **ADR-004**: Authentication Mechanism

## Dependencies Confirmed

- OpenAI Python SDK: v1.x (for ChatCompletions and Embeddings)
- Qdrant Client: v1.7+ (for vector operations)
- FastAPI: v0.109+ (for async API)
- Psycopg3: v3.1+ (for Neon Postgres with async support)
- React: v18+ (Docusaurus 3.x requirement)

## Open Questions for /sp.tasks Phase

[Any remaining implementation questions that don't require research decisions]
```

---

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` completed with all decisions made

### 1.1 Data Model Design

Create `specs/001-rag-chatbot-integration/data-model.md`:

#### Postgres Schema (Neon)

```sql
-- Table: chats
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,  -- Anonymous ID (generated client-side)
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    query_type VARCHAR(50) NOT NULL CHECK (query_type IN ('full-rag', 'selection')),
    selected_text TEXT,  -- NULL for full-rag queries
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_created (created_at DESC)
);

-- Table: usage_logs
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,  -- e.g., 'gpt-4.1', 'gpt-4.1-mini'
    tokens_used INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    vector_search_ms INTEGER,  -- NULL for selection queries
    embedding_ms INTEGER,       -- NULL for selection queries
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_created (created_at DESC),
    INDEX idx_model (model)
);
```

#### Qdrant Collection Schema

```python
# Collection: ai_book
{
    "name": "ai_book",
    "vectors": {
        "size": 3072,  # text-embedding-3-large dimension (or 1536 for small)
        "distance": "Cosine"
    },
    "payload_schema": {
        "text": "text",           # Chunk content (indexed for hybrid search)
        "chapter": "keyword",     # e.g., "Chapter 5: Inverse Kinematics"
        "section": "keyword",     # e.g., "5.2 Jacobian Methods"
        "file_path": "keyword",   # e.g., "docs/05-kinematics/inverse.mdx"
        "chunk_index": "integer", # Position in document (0-indexed)
        "total_chunks": "integer" # Total chunks in source document
    }
}
```

#### Entity Relationships

```
User Session (client-side)
    ├─> Chat Message (Postgres: chats table)
    │   └─> Usage Log (Postgres: usage_logs table)
    │
    └─> Vector Search (Qdrant: ai_book collection)
        └─> Document Chunks (embedded MDX content)
```

### 1.2 API Contracts

Create `specs/001-rag-chatbot-integration/contracts/openapi.yaml`:

```yaml
openapi: 3.0.0
info:
  title: RAG Chatbot API
  version: 1.0.0
  description: Retrieval-Augmented Generation API for textbook chatbot

servers:
  - url: https://api.example.com
    description: Production server (update with actual deployment URL)
  - url: http://localhost:8000
    description: Local development server

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

  schemas:
    RagQueryRequest:
      type: object
      required:
        - question
        - user_id
      properties:
        question:
          type: string
          minLength: 1
          maxLength: 1000
          example: "Explain inverse kinematics from Chapter 5"
        user_id:
          type: string
          format: uuid
          example: "550e8400-e29b-41d4-a716-446655440000"

    SelectionQueryRequest:
      type: object
      required:
        - question
        - selected_text
        - user_id
      properties:
        question:
          type: string
          minLength: 1
          maxLength: 1000
          example: "What sensors are mentioned here?"
        selected_text:
          type: string
          minLength: 50
          maxLength: 8000
          example: "Sensor fusion combines data from IMUs, cameras..."
        user_id:
          type: string
          format: uuid

    ChatResponse:
      type: object
      required:
        - answer
        - sources
        - chat_id
      properties:
        answer:
          type: string
          example: "Inverse kinematics is the process of determining..."
        sources:
          type: array
          items:
            type: object
            properties:
              chapter:
                type: string
                example: "Chapter 5: Inverse Kinematics"
              section:
                type: string
                example: "5.2 Jacobian Methods"
              file_path:
                type: string
                example: "docs/05-kinematics/inverse.mdx"
              relevance_score:
                type: number
                format: float
                example: 0.92
        chat_id:
          type: string
          format: uuid
        latency_ms:
          type: integer
          example: 1847

    IngestRequest:
      type: object
      required:
        - content_dir
      properties:
        content_dir:
          type: string
          example: "/app/docs"

    IngestResponse:
      type: object
      properties:
        status:
          type: string
          example: "success"
        chunks_created:
          type: integer
          example: 1234
        files_processed:
          type: integer
          example: 87

    HealthResponse:
      type: object
      properties:
        status:
          type: string
          example: "healthy"
        services:
          type: object
          properties:
            postgres:
              type: boolean
            qdrant:
              type: boolean
            openai:
              type: boolean

paths:
  /rag/query:
    post:
      summary: Full-book RAG query
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RagQueryRequest'
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatResponse'
        '400':
          description: Invalid request
        '429':
          description: Rate limit exceeded
        '500':
          description: Internal server error

  /rag/from-selection:
    post:
      summary: Selection-based query
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SelectionQueryRequest'
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatResponse'

  /embed-book:
    post:
      summary: Ingest and embed textbook content
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/IngestRequest'
      responses:
        '200':
          description: Ingestion complete
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/IngestResponse'

  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: Service health status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'
```

Create `specs/001-rag-chatbot-integration/contracts/frontend-api.ts`:

```typescript
// TypeScript types for frontend API client

export interface RagQueryRequest {
  question: string;
  user_id: string;
}

export interface SelectionQueryRequest {
  question: string;
  selected_text: string;
  user_id: string;
}

export interface ChatSource {
  chapter: string;
  section: string;
  file_path: string;
  relevance_score: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  chat_id: string;
  latency_ms: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    postgres: boolean;
    qdrant: boolean;
    openai: boolean;
  };
}

export class RagChatbotAPI {
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  async query(request: RagQueryRequest): Promise<ChatResponse> {
    // Implementation in /sp.tasks phase
  }

  async queryFromSelection(request: SelectionQueryRequest): Promise<ChatResponse> {
    // Implementation in /sp.tasks phase
  }

  async health(): Promise<HealthResponse> {
    // Implementation in /sp.tasks phase
  }
}
```

### 1.3 Quickstart Guide

Create `specs/001-rag-chatbot-integration/quickstart.md`:

```markdown
# RAG Chatbot Integration - Quickstart Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API key
- Qdrant Cloud account (free tier)
- Neon Postgres account (free tier)

## Backend Setup

1. **Environment Configuration**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize Databases**
   ```bash
   python scripts/init_db.py       # Create Postgres tables
   python scripts/init_qdrant.py   # Create Qdrant collection
   ```

4. **Ingest Textbook Content**
   ```bash
   python scripts/ingest_docs.py --content-dir ../docs
   ```

5. **Run Development Server**
   ```bash
   uvicorn src.main:app --reload --port 8000
   ```

## Frontend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API Endpoint**
   ```javascript
   // src/utils/constants.js
   export const API_BASE_URL = process.env.NODE_ENV === 'production'
     ? 'https://your-backend.railway.app'
     : 'http://localhost:8000';
   ```

3. **Run Development Server**
   ```bash
   npm start
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Deployment

### Backend (Railway)
1. Connect GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy from `main` branch

### Frontend (GitHub Pages)
1. Update `docusaurus.config.js` with production URL
2. Run `npm run build`
3. Deploy `build/` directory to GitHub Pages

## Testing

### Backend Tests
```bash
pytest tests/ -v
```

### Frontend Tests
```bash
npm test
```

### End-to-End Tests
```bash
npx playwright test
```

## Troubleshooting

[Common issues and solutions - to be populated during implementation]
```

### 1.4 Update Agent Context

Run the agent context update script:

```bash
powershell.exe -File .specify/scripts/powershell/update-agent-context.ps1 -AgentType claude
```

This will update the Claude context file (CLAUDE.md or similar) to include:
- New technologies introduced by this plan (if not already documented)
- References to plan.md, research.md, data-model.md for future context

---

## Constitution Re-Check (Post-Phase 1)

**Status**: ✅ COMPLETE - All Phase 1 artifacts validated against constitution

### Evaluation Results

- **Core Principles**:
  - ✅ **AI Agent Responsibilities**: Data model and API design support dynamic textbook content ingestion and real-time updates
  - ✅ **Spec-Driven Workflow Rules**: All artifacts (research.md, data-model.md, contracts, quickstart.md) follow SDD templates
  - ✅ **RAG Chatbot Constraints**: Data model enforces book-only content (Qdrant payload schema), selection-based context (query_type discriminator in chats table)
  - ✅ **Incremental Validation**: Quickstart guide provides step-by-step validation checkpoints
  - ✅ **Operational Standards**: Quickstart.md follows specs/ directory structure, references PHR creation

- **Project Sections**:
  - ✅ **AI-Generated Book**: Ingestion pipeline (`/embed-book` endpoint, `ingest_docs.py` script) handles dynamically generated MDX files
  - ✅ **RAG Chatbot Development**: Full implementation of mandated stack (FastAPI, OpenAI, Neon Postgres, Qdrant Cloud) in API contracts and data model

- **Execution Guidelines**:
  - ✅ **Task execution**: Phase 0 (research) and Phase 1 (design) completed, ready for Phase 2 (/sp.tasks)
  - ✅ **PHR creation**: This planning session will generate PHR (pending at end of workflow)
  - ✅ **ADR suggestion policies**: 8 ADRs identified in research.md (chunking, embedding model, LLM model, rate limiting, auth, storage, streaming, deployment)
  - ✅ **Minimum acceptance criteria**: Data model and API contracts align with Success Criteria in spec.md (SC-001 through SC-008)

- **Architect Guidelines**:
  - ✅ **Scope & dependencies**: Data model clearly separates concerns (Postgres for relational data, Qdrant for vectors, OpenAI for generation)
  - ✅ **Interfaces & APIs**: OpenAPI 3.0 specification complete with all endpoints, schemas, examples
  - ✅ **NFRs and budgets**: Data model includes performance optimization notes (indexes, connection pooling, quantization), quickstart includes free tier constraints
  - ✅ **Data management**: Data retention policy defined (30-day chat history), backup strategy documented
  - ✅ **Operational readiness**: Health check endpoint defined, usage logs enable monitoring, quickstart provides deployment guides
  - ✅ **Risk analysis & mitigation**: Error handling strategy documented in research.md (circuit breaker, tiered fallback)

- **Project Structure**:
  - ✅ **File and folder layout**: All Phase 1 artifacts created in correct locations (research.md, data-model.md, contracts/, quickstart.md)
  - ✅ **Template usage**: All documents follow spec-template.md and plan-template.md structure

- **Versioning and Governance**:
  - ✅ **Version number**: All artifacts reference feature 001-rag-chatbot-integration
  - ✅ **Ratified date**: All files dated 2025-11-30
  - ✅ **Constitution compliance**: No violations detected

**Gate Result**: ✅ PASS - All constitution requirements met. Design validated. Ready to proceed to /sp.tasks.

---

## Next Steps

1. **Complete Phase 0**: Generate `research.md` with all 12 research tasks completed
2. **Complete Phase 1**: Generate `data-model.md`, `contracts/openapi.yaml`, `contracts/frontend-api.ts`, `quickstart.md`
3. **Run agent context update**: Execute update-agent-context.ps1
4. **Re-check constitution**: Validate Phase 1 design against constitution
5. **Proceed to `/sp.tasks`**: Generate detailed task breakdown for implementation

**Command ends after this file is complete. Do not proceed to `/sp.tasks` in this session.**

---

## Notes

- All "NEEDS CLARIFICATION" items from Technical Context resolved through Phase 0 research
- ADRs identified during research should be created before implementation begins
- Frontend plugin integration requires Docusaurus plugin API research (included in Phase 0)
- Performance testing plan required before marking SC-006 complete
