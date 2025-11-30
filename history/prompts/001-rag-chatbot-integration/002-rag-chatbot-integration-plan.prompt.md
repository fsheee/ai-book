---
id: 001-rag-chatbot-integration-plan-002
title: RAG Chatbot Integration Implementation Plan
stage: plan
date: 2025-11-30T17:00:00Z
surface: claude-code
model: claude-sonnet-4-5
feature: 001-rag-chatbot-integration
branch: 001-rag-chatbot-integration
user: user
command: /sp.plan
labels: [planning, rag-chatbot, design, architecture, contracts]
links:
  spec: specs/001-rag-chatbot-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - path: specs/001-rag-chatbot-integration/plan.md
    status: created
    role: Implementation plan with technical context, project structure, Phase 0/1 outlines
  - path: specs/001-rag-chatbot-integration/research.md
    status: created
    role: Technical research decisions (12 decisions covering chunking, models, deployment, etc.)
  - path: specs/001-rag-chatbot-integration/data-model.md
    status: created
    role: Complete data model (Postgres schema, Qdrant collection, entity relationships, query patterns)
  - path: specs/001-rag-chatbot-integration/contracts/openapi.yaml
    status: created
    role: OpenAPI 3.0 specification for FastAPI backend (4 endpoints, full schemas, examples)
  - path: specs/001-rag-chatbot-integration/contracts/frontend-api.ts
    status: created
    role: TypeScript API client with types, validation, SSE streaming support
  - path: specs/001-rag-chatbot-integration/quickstart.md
    status: created
    role: Comprehensive setup and deployment guide (backend, frontend, testing, troubleshooting)
tests: []
---

## Prompt

User invoked `/sp.plan` command to generate implementation plan for the RAG chatbot integration feature (001-rag-chatbot-integration).

**Context**: Feature specification already completed in previous session (spec.md validated with all quality checks passed). Plan command executed on branch `001-rag-chatbot-integration` with all prerequisites met.

**Expected Workflow**:
1. Load feature spec and constitution
2. Fill Technical Context section (languages, dependencies, performance goals, constraints)
3. Complete Constitution Check (validate against all principles)
4. Phase 0: Generate research.md (resolve technical unknowns)
5. Phase 1: Generate design artifacts (data-model.md, API contracts, quickstart.md)
6. Update agent context
7. Re-check constitution post-design
8. Create PHR

## Response snapshot

Generated complete implementation plan with all Phase 0 (research) and Phase 1 (design) artifacts:

### 1. Implementation Plan (plan.md)

**Technical Context**:
- **Backend**: Python 3.11+, FastAPI, OpenAI Python SDK, Qdrant Client, Psycopg3, Pydantic
- **Frontend**: JavaScript/React (Docusaurus 3.x), Fetch API, SSE (Server-Sent Events)
- **Storage**: Qdrant Cloud Free Tier (vectors), Neon Serverless Postgres (relational)
- **Testing**: pytest, Jest, Playwright
- **Deployment**: Railway (backend), GitHub Pages (frontend)
- **Performance Goals**: <1s first token, <2.5s full response, 50 concurrent users
- **Constraints**: OpenAI rate limits, Qdrant 1GB limit, Neon 0.5GB/100hrs, CORS for GitHub Pages

**Project Structure**: Web application (backend + frontend separation)
- Backend: `backend/src/{models,services,api,utils}`, `backend/tests/{unit,integration,e2e}`
- Frontend: Docusaurus `src/components/`, `src/utils/`, `plugins/`, `static/css/`
- CI/CD: `.github/workflows/` for automated deployment

**Constitution Check**: ✅ PASS (all requirements met, no violations)

### 2. Technical Research (research.md)

Completed 12 research tasks with informed decisions:

1. **Chunking Strategy**: 1200 characters, 200 overlap (balances context completeness and retrieval precision)
2. **Embedding Model**: text-embedding-3-small (6.5x cheaper than large, 90-95% of performance)
3. **LLM Model**: GPT-4.1-mini (400-800ms latency vs 1200-2000ms for full, 16x cheaper)
4. **Vector Search**: top_k=5, similarity_threshold=0.70 (optimal precision/recall balance)
5. **Rate Limiting**: 10/min, 100/hour per user, 1000/hour global
6. **Authentication**: Header-based API key (X-API-Key)
7. **CORS**: Explicit whitelist (localhost:3000 + GitHub Pages URL)
8. **Chat History**: Hybrid LocalStorage + Postgres (balances privacy and persistence)
9. **Streaming**: Server-Sent Events (SSE) over WebSocket (simpler, serverless-compatible)
10. **MDX Parsing**: gray-matter / python-frontmatter (extract frontmatter, strip JSX)
11. **Error Handling**: Circuit breaker pattern with tiered fallback (Qdrant → OpenAI → Postgres degradation)
12. **Deployment**: Railway (backend) - <500ms cold start, native Neon integration

**ADRs Identified**: 8 architectural decisions require documentation before implementation.

### 3. Data Model (data-model.md)

**Postgres Schema (Neon)**:
- **chats** table: id, user_id, question, answer, query_type, selected_text, created_at
  - Indexes: user_created, created, query_type
  - Constraints: CHECK query_type IN ('full-rag', 'selection'), selected_text validation
- **usage_logs** table: id, chat_id (FK), model, tokens_used, latency_ms, vector_search_ms, embedding_ms, created_at
  - Indexes: created, model, latency, chat_id
  - Foreign key: CASCADE DELETE on chats.id

**Qdrant Collection Schema (ai_book)**:
- Vectors: 1536-dim (text-embedding-3-small), Cosine distance
- Payload: text (indexed), chapter, section, file_path, chunk_index, total_chunks, created_at, content_hash
- Indexes: Full-text on text, keywords on chapter/section/file_path

**Entity Relationships**: User Session → Chat Message → Usage Log + Vector Search (Qdrant)

**Query Patterns**: User history (last 50), usage stats (24h), model performance (7d), slow query detection (p99)

**Data Retention**: 30-day chat history (automated cleanup), vector embeddings persistent

### 4. API Contracts

**OpenAPI 3.0 Specification (openapi.yaml)**:
- **POST /rag/query**: Full-book RAG query (semantic search + LLM generation)
- **POST /rag/from-selection**: Selection-based query (no vector search)
- **POST /embed-book**: Ingest and embed textbook content (admin endpoint)
- **GET /health**: Service health check (Postgres, Qdrant, OpenAI connectivity)

**Schemas**: RagQueryRequest, SelectionQueryRequest, ChatResponse (with sources), IngestRequest/Response, HealthResponse, ErrorResponse

**Security**: API key authentication (X-API-Key header), rate limiting (10/min, 100/hour)

**TypeScript Frontend API (frontend-api.ts)**:
- `RagChatbotAPI` class with methods: `query()`, `queryFromSelection()`, `embedBook()`, `health()`
- SSE streaming methods: `streamQuery()`, `streamFromSelection()`
- Utility functions: `getUserId()`, `validateQuestion()`, `validateSelectedText()`, `formatLatency()`, `formatRelevance()`
- Custom error class: `RagChatbotAPIError` with `isRateLimitError`, `isAuthError`, `retryAfter` properties

### 5. Quickstart Guide (quickstart.md)

**Prerequisites**: Python 3.11+, Node.js 18+, OpenAI API key, Qdrant Cloud account, Neon Postgres account, Railway account

**Backend Setup**:
1. Clone repo, create virtual environment
2. Install dependencies (`requirements.txt` with 12 packages)
3. Configure environment variables (`.env` file with 15+ config options)
4. Initialize databases (`scripts/init_db.py`, `scripts/init_qdrant.py`)
5. Ingest textbook content (`scripts/ingest_docs.py --content-dir ../docs`)
6. Run development server (`uvicorn src.main:app --reload`)

**Frontend Setup**:
1. Install dependencies (`npm install`)
2. Configure API endpoint (`src/utils/constants.js`)
3. Add chatbot plugin to Docusaurus config
4. Run development server (`npm start`)

**Local Development**: Instructions for running both servers simultaneously (tmux, Windows Terminal profiles)

**Deployment**:
- **Backend (Railway)**: Configure environment variables, create `railway.toml`, deploy from GitHub
- **Frontend (GitHub Pages)**: Update `docusaurus.config.js`, build and deploy (`npm run deploy`)

**Testing**: Backend unit/integration/e2e tests (`pytest`), frontend tests (`npm test`), Playwright E2E (`npx playwright test`)

**Troubleshooting**: 12 common issues with symptoms and solutions (CORS errors, database connection, rate limits, etc.)

### 6. Agent Context Update

Successfully updated CLAUDE.md with:
- Project type: Web application (backend + frontend)
- New technologies (if not already documented)
- References to planning artifacts (plan.md, research.md, data-model.md, contracts/)

### 7. Constitution Re-Check (Post-Phase 1)

**Status**: ✅ COMPLETE - All validation checks passed

- **Core Principles**: ✅ All 5 principles validated (AI Agent Responsibilities, SDD Workflow, RAG Constraints, Incremental Validation, Operational Standards)
- **Project Sections**: ✅ AI-Generated Book and RAG Chatbot Development sections fully addressed
- **Execution Guidelines**: ✅ PHR creation, ADR policies, acceptance criteria all met
- **Architect Guidelines**: ✅ All 6 guidelines validated (scope, interfaces, NFRs, data mgmt, ops readiness, risk analysis)
- **Project Structure**: ✅ File layout and template usage correct
- **Versioning and Governance**: ✅ All artifacts properly versioned and dated

**Gate Result**: ✅ PASS - Design validated, ready for /sp.tasks

## Outcome

- ✅ Impact: Complete implementation plan with research, design, and contracts ready for task generation
- 🧪 Tests: No automated tests created (planning phase), but quickstart includes testing instructions
- 📁 Files: 6 new files created (plan.md, research.md, data-model.md, openapi.yaml, frontend-api.ts, quickstart.md)
- 🔁 Next prompts: `/sp.tasks` to generate detailed task breakdown for implementation
- 🧠 Reflection: Successfully balanced technical detail with clarity. Research decisions are informed by best practices and constraints (free tier limits, latency requirements). All "NEEDS CLARIFICATION" items from plan template resolved through research. Design artifacts are comprehensive enough for direct implementation without requiring additional planning sessions.

## Evaluation notes (flywheel)

- Failure modes observed: None - all phases completed successfully
- Graders run and results (PASS/FAIL): Constitution Check (initial): PASS, Constitution Re-Check (post-Phase 1): PASS
- Prompt variant (if applicable): Standard /sp.plan workflow with full Phase 0 and Phase 1 completion
- Next experiment (smallest change to try): Consider creating a "design review checklist" similar to requirements.md for plan quality validation (optional for future features)

---

**Planning Complete**: All Phase 0 (research) and Phase 1 (design) artifacts generated. Feature 001-rag-chatbot-integration ready for `/sp.tasks` command to generate implementation task breakdown.

**Key Deliverables**:
- Technical decisions documented with rationale (research.md)
- Complete data model with schemas and query patterns (data-model.md)
- Full API specification with OpenAPI + TypeScript types (contracts/)
- Production-ready quickstart guide (quickstart.md)
- 8 ADRs identified for creation before implementation
- 0 unresolved "NEEDS CLARIFICATION" items (all resolved through research)

**Metrics**:
- Phase 0 Research: 12 technical decisions made
- Phase 1 Design: 4 artifacts created (data-model, 2 contracts, quickstart)
- Constitution Compliance: 100% (all checks passed)
- API Endpoints: 4 endpoints specified (query, from-selection, embed-book, health)
- Database Tables: 2 tables (chats, usage_logs)
- Vector Collection: 1 collection (ai_book with 8 payload fields)
- Dependencies: 12 backend (Python), 5 frontend (Node.js)
