# Tasks: RAG Chatbot Integration for Physical AI & Humanoid Robotics

**Input**: Design documents from `specs/001-rag-chatbot-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, contracts/frontend-api.ts, quickstart.md

**Tests**: Tests are OPTIONAL for this feature. Test tasks are NOT included since specification does not explicitly request TDD approach. Testing will be performed via manual validation against acceptance scenarios.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Constitution Compliance Checklist *(mandatory)*

*GATE: All tasks MUST ensure compliance with the following constitutional principles:*

- ✅ **Core Principles**: Tasks reflect RAG Chatbot Constraints (book-only content, selection-based context), Incremental Validation (each story independently testable), Spec-Driven Workflow Rules (PHR creation, constitution compliance)
- ✅ **Project Sections**: Tasks contribute to RAG Chatbot Development section (FastAPI, OpenAI, Neon Postgres, Qdrant Cloud)
- ✅ **Execution Guidelines**: Tasks follow spec → plan → tasks → implementation workflow, ADRs to be created for architectural decisions identified in research.md
- ✅ **Architect Guidelines**: Tasks respect interfaces & APIs (OpenAPI contracts), NFRs (latency <2.5s, accuracy ≥85%), data management (30-day retention), operational readiness (health checks, logs)
- ✅ **Project Structure**: Tasks follow backend/ and frontend/ structure per plan.md
- ✅ **Versioning and Governance**: All code committed with PHR creation at feature completion

---

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3...)
- Include exact file paths in descriptions

---

## Path Conventions

Per plan.md, this is a **web application** with:
- **Backend**: `backend/src/`, `backend/tests/`, `backend/scripts/`
- **Frontend**: `frontend/src/`, `frontend/plugins/`, `frontend/static/`
- **Deployment**: `.github/workflows/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, backend/frontend structure, environment configuration

### Backend Setup

- [x] T001 Create backend directory structure: `backend/src/{models,services,api/{routes,middleware,schemas},utils}`, `backend/tests/{unit,integration,e2e}`, `backend/scripts/`
- [x] T002 Create backend/requirements.txt with dependencies: fastapi==0.109.0, uvicorn[standard]==0.27.0, openai==1.10.0, qdrant-client==1.7.3, psycopg[binary]==3.1.17, pydantic==2.5.3, python-dotenv==1.0.0, slowapi==0.1.9, python-frontmatter==1.1.0, langchain==0.1.4
- [x] T003 Create backend/requirements-dev.txt with dev dependencies: pytest==8.0.0, pytest-asyncio==0.23.3, httpx==0.26.0
- [x] T004 Create backend/.env.example with template environment variables (OPENAI_API_KEY, QDRANT_URL, QDRANT_API_KEY, DATABASE_URL, API_KEY, CORS_ORIGINS, EMBEDDING_MODEL, LLM_MODEL, CHUNK_SIZE, CHUNK_OVERLAP, TOP_K, SIMILARITY_THRESHOLD, RATE_LIMIT_PER_MINUTE, RATE_LIMIT_PER_HOUR)
- [x] T004a Create backend/.env with actual environment configuration (copy from .env.example and configure with real credentials)
- [x] T005 Create backend/README.md with setup instructions referencing quickstart.md

### Frontend Setup

- [x] T006 Create frontend directory structure (if not exists): `frontend/src/{components/RagChatWidget,components/TextSelectionMenu,pages/chat,utils,hooks}`, `frontend/plugins/rag-chatbot-plugin`, `frontend/static/css`
- [x] T007 Create frontend/src/utils/constants.js with API_BASE_URL and API_KEY configuration (environment-dependent)
- [x] T008 Create frontend/README.md with setup instructions referencing quickstart.md

### Deployment Configuration

- [x] T009 [P] Create backend/railway.toml for Railway deployment with build and deploy commands
- [x] T010 [P] Create .github/workflows/backend-deploy.yml for Railway CI/CD (optional, for later automation)
- [x] T011 [P] Create .github/workflows/frontend-deploy.yml for GitHub Pages deployment (optional, for later automation)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

#### Configuration and Core Services

- [x] T012 [P] Implement backend/src/config.py: Load environment variables, validate required config, export settings object (OPENAI_API_KEY, QDRANT_URL, DATABASE_URL, etc.)
- [x] T013 [P] Implement backend/src/utils/logger.py: Configure structured logging (JSON format, log levels, PII filtering)
- [x] T014 [P] Implement backend/src/utils/chunking.py: Text chunking utilities using RecursiveCharacterTextSplitter (chunk_size=1200, overlap=200)

#### API Infrastructure

- [x] T015 Implement backend/src/api/middleware/cors.py: CORS middleware with explicit allow_origins from config (localhost:3000 + GitHub Pages URL)
- [x] T016 Implement backend/src/api/middleware/auth.py: API key authentication middleware (validate X-API-Key header against config.API_KEY)
- [x] T017 Implement backend/src/api/middleware/rate_limit.py: Rate limiting middleware using slowapi (10/min, 100/hour per user_id)
- [x] T018 Implement backend/src/api/schemas/request.py: Pydantic request schemas (RagQueryRequest, SelectionQueryRequest, IngestRequest)
- [x] T019 Implement backend/src/api/schemas/response.py: Pydantic response schemas (ChatResponse, ChatSource, IngestResponse, HealthResponse, ErrorResponse)

#### Database Initialization

- [x] T020 Implement backend/src/utils/init_db.py: Create Postgres tables (chats, messages, usage_logs) with indexes and constraints per data-model.md
- [x] T021 Implement backend/src/utils/init_qdrant.py: Create Qdrant collection "ai_book" with 1536-dim vectors, payload schema, indexes per data-model.md

#### Data Models

- [x] T022 [P] Implement backend/src/models/chat.py: Chat message Pydantic model (id, user_id, question, answer, query_type, selected_text, created_at)
- [x] T023 [P] Implement backend/src/models/document.py: Document chunk Pydantic model (text, chapter, section, file_path, chunk_index, total_chunks, content_hash)
- [x] T024 [P] Implement backend/src/models/usage.py: Usage log Pydantic model (id, chat_id, model, tokens_used, latency_ms, vector_search_ms, embedding_ms)

#### Core Services

- [x] T025 Implement backend/src/services/database.py: Neon Postgres connection service (async connection pool, execute_query(), insert_chat(), insert_usage_log(), get_user_history())
- [x] T026 Implement backend/src/services/embedding.py: OpenAI embedding service (generate_embedding() using text-embedding-3-small, batch_embeddings())
- [x] T027 Implement backend/src/services/vectorstore.py: Qdrant vector store service (search(), upsert_chunks(), get_collection_info())
- [x] T028 Implement backend/src/services/llm.py: OpenAI ChatCompletion service (generate_response() using gpt-4-turbo-preview, stream_response() for SSE)

#### FastAPI Application Bootstrap

- [x] T029 Implement backend/src/main.py: FastAPI app initialization (register middleware: CORS, auth, rate_limit; register routers; startup/shutdown events for DB connections; exception handlers)

**Checkpoint**: Foundation ready - User story implementation can now begin in parallel. All services, middleware, and data models are operational.

---

## Phase 3: User Story 1 - General Book Query with RAG (Priority: P1) 🎯 MVP CORE

**Goal**: Enable students to ask questions about textbook content and receive accurate answers with source citations using full-book RAG (vector search + LLM generation).

**Independent Test**: Ask "Explain inverse kinematics" → chatbot retrieves Chapter 5 content, generates answer with source citations. Verify: (1) Answer includes relevant content, (2) Sources list chapter/section, (3) Latency <2.5s, (4) Response accuracy aligns with textbook.

**Why MVP**: This is the core value proposition. Without this, there is no functional chatbot. Delivers immediate value and validates end-to-end RAG pipeline.

### Backend Implementation for US1

#### Ingestion Pipeline (Data Preparation)

- [x] T030 [P] [US1] Implement backend/src/services/ingestion.py: MDX parsing (parse_mdx_file() using python-frontmatter, extract metadata, strip JSX tags)
- [x] T031 [US1] Implement backend/scripts/ingest_docs.py: Standalone ingestion script (scan MDX files, chunk content, generate embeddings, upsert to Qdrant with progress bar, skip unchanged files via content_hash)

#### RAG Query Endpoint

- [x] T032 [US1] Implement backend/src/api/routes/rag.py: POST /rag/query endpoint (1. Validate request, 2. Generate query embedding, 3. Search Qdrant top_k=5 threshold=0.70, 4. Construct prompt with retrieved chunks, 5. Generate response via LLM, 6. Save to Postgres chats+usage_logs, 7. Return ChatResponse with sources)
- [x] T033 [US1] Add SSE streaming support to /rag/query endpoint in backend/src/api/routes/rag.py (stream tokens via Server-Sent Events, send final event with sources)

#### Health Check Endpoint

- [x] T034 [P] [US1] Implement backend/src/api/routes/health.py: GET /health endpoint (check Postgres connection, Qdrant connection, OpenAI API connectivity, return HealthResponse with status per service)

**Backend Checkpoint US1**: Backend can ingest textbook content, answer RAG queries, return source citations, stream responses via SSE.

### Frontend Implementation for US1

#### API Client

- [x] T035 [P] [US1] Implement frontend/src/utils/api.js: RagChatbotAPI class based on frontend-api.ts (query(), streamQuery(), health()), error handling (RagChatbotAPIError with retry logic)
- [x] T036 [P] [US1] Implement frontend/src/utils/storage.js: LocalStorage utilities (getUserId(), saveToLocalStorage(), loadFromLocalStorage() for chat history)

#### React Hooks

- [x] T037 [P] [US1] Implement frontend/src/hooks/useChatHistory.js: Chat history management hook (state for messages[], addMessage(), clearHistory(), loadHistory())

#### Chat Widget Components

- [x] T038 [P] [US1] Implement frontend/src/components/RagChatWidget/ChatMessage.jsx: Single message display component (user/assistant differentiation, markdown rendering, source citations with click-to-navigate)
- [x] T039 [P] [US1] Implement frontend/src/components/RagChatWidget/ChatInput.jsx: Message input component (textarea, send button, validation, keyboard shortcuts: Enter to send, Shift+Enter for newline)
- [x] T040 [US1] Implement frontend/src/components/RagChatWidget/ChatPanel.jsx: Collapsible chat panel component (message list using ChatMessage, ChatInput, loading indicator, error display, streaming token display)
- [x] T041 [US1] Implement frontend/src/components/RagChatWidget/FloatingButton.jsx: Floating chat button component (bottom-right position, toggle panel visibility, unread indicator)
- [x] T042 [US1] Implement frontend/src/components/RagChatWidget/index.jsx: Main chat widget component orchestration (integrate FloatingButton + ChatPanel, state management, API calls via RagChatbotAPI, SSE streaming handling, LocalStorage integration via useChatHistory)

#### Docusaurus Plugin Integration

- [x] T043 [US1] Implement frontend/plugins/rag-chatbot-plugin/index.js: Docusaurus plugin (inject RagChatWidget into all pages via clientModules or injectHtmlTags, pass config from docusaurus.config.js)
- [x] T044 [US1] Update frontend/docusaurus.config.js: Register rag-chatbot-plugin in plugins array

#### Styling

- [x] T045 [P] [US1] Create frontend/static/css/chatbot.css: Chatbot styles (floating button, panel layout, message styling, mobile responsive, loading animations, dark mode support if applicable)

**Frontend Checkpoint US1**: Floating chat button appears on all pages, clicking opens panel, typing question sends request to backend, response streams in real-time, sources displayed with citations.

**Full US1 Checkpoint**: End-to-end RAG query flow works. Student can ask question, receive answer with sources, navigate to cited sections. Verify latency <2.5s and accuracy ≥85% on sample queries.

---

## Phase 4: User Story 3 - Chatbot UI Integration (Priority: P1) 🎯 MVP UI ENHANCEMENTS

**Goal**: Ensure chatbot UI is seamless, always-accessible, and feels like a natural part of the Docusaurus website with full-page mode and mobile support.

**Independent Test**: (1) Load any textbook page → floating button visible in bottom-right, (2) Click button → panel opens without covering content, (3) Click expand → full-page mode at /chat route, (4) Test on mobile → interface adapts to mobile dimensions.

**Why P1**: UI is critical for user access. Without proper integration, users cannot effectively use the chatbot. This complements US1 (functionality) with polished interface.

**Note**: Most UI foundation already completed in US1. This phase adds full-page mode, mobile optimization, and polish.

### Full-Page Chat Mode

- [ ] T046 [P] [US3] Implement frontend/src/pages/chat/index.jsx: Full-page chat component (full-screen layout, no floating button, direct integration of ChatPanel, URL route /chat)
- [ ] T047 [US3] Add expand button to ChatPanel in frontend/src/components/RagChatWidget/ChatPanel.jsx (navigate to /chat route when clicked)
- [ ] T048 [US3] Add minimize/collapse functionality to ChatPanel in frontend/src/components/RagChatWidget/ChatPanel.jsx (close panel, show floating button again)

### Mobile Optimization

- [ ] T049 [US3] Update frontend/static/css/chatbot.css: Mobile responsive styles (panel takes full width on mobile, floating button positioning, touch-friendly button sizes, handle virtual keyboard)

### UI Polish

- [ ] T050 [P] [US3] Add loading state animations to ChatPanel in frontend/src/components/RagChatWidget/ChatPanel.jsx (skeleton loader, typing indicator, spinner for initial load)
- [ ] T051 [P] [US3] Implement error messages for edge cases in ChatPanel (empty message validation: "Please enter a question", rate limit error: "Too many requests, try again in X seconds", service unavailable: "Chatbot temporarily unavailable")

**US3 Checkpoint**: Full-page chat mode works at /chat route, mobile users can use chatbot seamlessly, loading states and error messages are clear and helpful.

---

## Phase 5: User Story 2 - Context-Specific Query from Selected Text (Priority: P2)

**Goal**: Enable students to select text on the page and ask questions about only that selected content (no vector search, direct context mode).

**Independent Test**: (1) Select paragraph about "sensor fusion", (2) Right-click or see "Ask from Selection" button, (3) Click and type "What sensors are mentioned?", (4) Verify answer only references selected text (no sources from vector search).

**Why P2**: Adds significant value for focused learning but not blocking MVP. Independent of full-book RAG (US1).

### Backend Implementation for US2

- [ ] T052 [US2] Implement POST /rag/from-selection endpoint in backend/src/api/routes/rag.py (1. Validate request (selected_text length 50-8000 chars), 2. Construct prompt with selected_text as context (no vector search), 3. Generate response via LLM, 4. Save to Postgres with query_type='selection', 5. Return ChatResponse with empty sources array)

**Backend Checkpoint US2**: Backend can answer questions using only selected text, no vector search performed, proper validation of text length.

### Frontend Implementation for US2

#### Text Selection Detection

- [ ] T053 [P] [US2] Implement frontend/src/hooks/useTextSelection.js: Text selection detection hook (detect window.getSelection(), return selected text and position)

#### Context Menu Component

- [ ] T054 [US2] Implement frontend/src/components/TextSelectionMenu/index.jsx: Context menu component for selected text (show "Ask from Selection" button on text selection, position near selection, pass selected text to chat widget)

#### Chat Widget Integration

- [ ] T055 [US2] Update frontend/src/components/RagChatWidget/index.jsx: Add selection mode support (accept selected_text prop, call queryFromSelection() instead of query(), indicate "Context: Selected Text" in UI, show validation message if text too short <50 chars)
- [ ] T056 [US2] Integrate TextSelectionMenu with RagChatWidget in frontend/plugins/rag-chatbot-plugin/index.js (listen for text selection events, show context menu, wire to chat widget)

#### API Client Update

- [ ] T057 [US2] Add queryFromSelection() and streamFromSelection() methods to frontend/src/utils/api.js: RagChatbotAPI class (implement per frontend-api.ts spec, handle SelectionQueryRequest validation)

**US2 Checkpoint**: Students can select text, see "Ask from Selection" option, ask questions, receive answers based only on selected text (no external sources).

---

## Phase 6: User Story 5 - Performance and Responsiveness (Priority: P2)

**Goal**: Ensure chatbot responds quickly (<2.5s for 95% of queries, <1s for first token) and displays loading indicators during processing.

**Independent Test**: (1) Send 10 different queries, (2) Measure latency (log timestamps), (3) Verify 95% complete within 2.5s, (4) Verify first token appears within 1s, (5) Verify loading indicators display correctly.

**Why P2**: Performance directly impacts user satisfaction. Must be addressed before full deployment but not blocking MVP launch.

### Backend Performance

- [ ] T058 [US5] Add performance monitoring to backend/src/api/routes/rag.py: Log latency breakdown (embedding_ms, vector_search_ms, llm_generation_ms, total_latency_ms), store in usage_logs table
- [ ] T059 [P] [US5] Optimize embedding generation in backend/src/services/embedding.py: Implement batch embedding for multiple chunks (up to 2048 per API call)
- [ ] T060 [P] [US5] Optimize Qdrant search in backend/src/services/vectorstore.py: Use score_threshold in search query, configure HNSW ef parameter for search speed vs accuracy tradeoff

### Frontend Performance

- [ ] T061 [US5] Add loading indicators to ChatPanel in frontend/src/components/RagChatWidget/ChatPanel.jsx: (1) Show spinner when sending query, (2) Show "typing..." indicator during SSE streaming, (3) Display "Searching..." → "Generating..." states, (4) Show estimated time if >2s
- [ ] T062 [P] [US5] Implement debouncing for rapid queries in ChatInput in frontend/src/components/RagChatWidget/ChatInput.jsx (prevent spamming send button, disable during processing)

### Performance Validation

- [ ] T063 [US5] Create backend/scripts/benchmark_performance.py: Performance testing script (send 100 sample queries, measure latency, report p50/p95/p99, identify slow queries)
- [ ] T064 [US5] Run performance validation per quickstart.md: Execute benchmark script, verify 95% queries <2.5s, identify and optimize bottlenecks if needed

**US5 Checkpoint**: Chatbot responds within latency requirements, loading states are clear, performance metrics are tracked in database for monitoring.

---

## Phase 7: User Story 4 - Chat History and Context Persistence (Priority: P3)

**Goal**: Enable returning students to see previous conversations and continue discussions where they left off (30-day retention).

**Independent Test**: (1) Ask question, (2) Close browser, (3) Reopen textbook, (4) Verify previous conversation visible in chat history, (5) Click "New Conversation" → verify new thread starts.

**Why P3**: Enhances learning experience but not critical for initial functionality. Users can benefit from chatbot without history.

### Backend Implementation for US4

- [ ] T065 [US4] Add GET /history endpoint to backend/src/api/routes/rag.py: Retrieve user's chat history (query chats table by user_id, order by created_at DESC, limit 50, return list of ChatResponse objects)
- [ ] T066 [P] [US4] Implement data retention cleanup in backend/scripts/cleanup_old_chats.py: Delete chats older than 30 days (run via cron or scheduled task)

### Frontend Implementation for US4

- [ ] T067 [US4] Update frontend/src/hooks/useChatHistory.js: Add loadHistoryFromServer() function (call GET /history endpoint, merge with LocalStorage, handle conflicts)
- [ ] T068 [US4] Add chat history panel to ChatPanel in frontend/src/components/RagChatWidget/ChatPanel.jsx (show list of previous conversations, click to load thread, "New Conversation" button, timestamp display)
- [ ] T069 [US4] Implement conversation thread switching in frontend/src/components/RagChatWidget/index.jsx (load selected thread, display messages, allow switching between threads)

### Hybrid Storage Implementation

- [ ] T070 [US4] Update frontend/src/utils/storage.js: Implement hybrid LocalStorage + Postgres sync (save to LocalStorage immediately, async save to server, merge on load, handle offline mode)

**US4 Checkpoint**: Chat history persists across sessions (30-day retention), users can view previous conversations, "New Conversation" creates new thread, hybrid LocalStorage + Postgres works correctly.

---

## Phase 8: Ingestion and Content Management (Supporting Infrastructure)

**Purpose**: Admin tools for ingesting textbook content and managing vector database

**Note**: This supports US1 (RAG queries) but is separated as admin-focused functionality.

### Ingestion Endpoint

- [ ] T071 [P] Implement POST /embed-book endpoint in backend/src/api/routes/ingest.py (1. Validate content_dir path, 2. Call ingestion service, 3. Return IngestResponse with stats: chunks_created, files_processed, files_skipped, errors)

### Ingestion Service Enhancement

- [ ] T072 Add progress tracking to backend/src/services/ingestion.py: Implement progress callback (report files processed, chunks created, ETA)
- [ ] T073 [P] Add content hash checking to backend/src/services/ingestion.py: Skip files with unchanged content_hash (MD5), only re-ingest modified files
- [ ] T074 [P] Add error handling to backend/src/services/ingestion.py: Catch and log errors per file (invalid frontmatter, parsing errors), continue with remaining files, return partial success with errors list

### Content Management

- [ ] T075 [P] Create backend/scripts/clear_collection.py: Utility script to clear Qdrant collection (delete all chunks, useful for re-ingestion)
- [ ] T076 [P] Update backend/README.md: Document ingestion process (when to run, how to run, expected output, troubleshooting)

**Checkpoint**: Admin can ingest textbook content via script or endpoint, monitor progress, handle errors gracefully, re-ingest only changed files.

---

## Phase 9: Deployment and DevOps

**Purpose**: Deploy backend to Railway, frontend to GitHub Pages, configure CI/CD

### Railway Backend Deployment

- [ ] T077 Create Railway account and project per quickstart.md: Link GitHub repository, select backend directory
- [ ] T078 Configure Railway environment variables: Set all required env vars from .env.example in Railway dashboard (OPENAI_API_KEY, QDRANT_URL, DATABASE_URL, etc.)
- [ ] T079 Deploy backend to Railway: Verify deployment succeeds, test /health endpoint returns 200 OK, copy Railway URL
- [ ] T080 Run database initialization on Railway: Execute init_db.py and init_qdrant.py scripts in Railway environment (via Railway CLI or temporary command)
- [ ] T081 Run initial content ingestion on Railway: Execute ingest_docs.py script with textbook content (verify chunks uploaded to Qdrant)

### GitHub Pages Frontend Deployment

- [ ] T082 Update frontend/docusaurus.config.js for production: Set url, baseUrl, organizationName, projectName for GitHub Pages
- [ ] T083 Update frontend/src/utils/constants.js for production: Set API_BASE_URL to Railway backend URL, configure API_KEY
- [ ] T084 Build frontend: Run `npm run build` to generate production build in build/ directory
- [ ] T085 Deploy frontend to GitHub Pages: Run `npm run deploy` or manual push to gh-pages branch
- [ ] T086 Enable GitHub Pages in repository settings: Configure source as gh-pages branch, verify site live at yourusername.github.io/ai-book/

### Cross-Origin Configuration

- [ ] T087 Update backend CORS configuration: Add GitHub Pages URL to CORS_ORIGINS in Railway environment variables, redeploy backend
- [ ] T088 Test cross-origin requests: Open GitHub Pages site, send test query, verify no CORS errors in browser console

### Deployment Validation

- [ ] T089 Execute end-to-end deployment test per quickstart.md Acceptance Tests: (AT-001) Ask "Explain inverse kinematics" → verify correct citation, (AT-002) Select text → "Ask Chatbot" → verify selection-only answer, (AT-003) Verify response <3s, (AT-004) Test on both local and GitHub Pages

**Checkpoint**: Backend live on Railway, frontend live on GitHub Pages, chatbot fully functional in production, no CORS errors, all acceptance tests pass.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, ADRs, code cleanup, final validation

### Architectural Decision Records (ADRs)

- [ ] T090 [P] Create ADR-001 in history/adrs/001-chunking-strategy.md: Document chunking parameters decision (1200/200) with rationale from research.md
- [ ] T091 [P] Create ADR-002 in history/adrs/002-embedding-model.md: Document text-embedding-3-small selection with cost/performance tradeoff from research.md
- [ ] T092 [P] Create ADR-003 in history/adrs/003-llm-model.md: Document GPT-4.1-mini selection with latency requirements from research.md
- [ ] T093 [P] Create ADR-004 in history/adrs/004-rate-limiting.md: Document rate limiting thresholds (10/min, 100/hr) with rationale from research.md
- [ ] T094 [P] Create ADR-005 in history/adrs/005-authentication.md: Document header-based API key auth mechanism from research.md
- [ ] T095 [P] Create ADR-006 in history/adrs/006-chat-history-storage.md: Document hybrid LocalStorage + Postgres approach from research.md
- [ ] T096 [P] Create ADR-007 in history/adrs/007-streaming.md: Document SSE (Server-Sent Events) choice over WebSocket from research.md
- [ ] T097 [P] Create ADR-008 in history/adrs/008-deployment.md: Document Railway platform selection from research.md

### Documentation Updates

- [ ] T098 [P] Update backend/README.md: Add production deployment notes, troubleshooting section, link to quickstart.md
- [ ] T099 [P] Update frontend/README.md: Add production deployment notes, plugin configuration docs, link to quickstart.md
- [ ] T100 [P] Create DEPLOYMENT.md in repository root: Consolidate deployment instructions (Railway + GitHub Pages), environment variables, troubleshooting

### Code Quality

- [ ] T101 [P] Add type hints to all backend Python functions: Ensure all functions have proper type annotations (mypy validation)
- [ ] T102 [P] Add docstrings to all backend modules: Document purpose, parameters, return values, examples
- [ ] T103 [P] Add JSDoc comments to frontend React components: Document props, usage, examples
- [ ] T104 [P] Run linting and formatting on backend: black, flake8, isort (fix all issues)
- [ ] T105 [P] Run linting and formatting on frontend: ESLint, Prettier (fix all issues)

### Security Hardening

- [ ] T106 [P] Add input validation to all backend endpoints: Sanitize user inputs, validate lengths, escape special characters
- [ ] T107 [P] Add rate limiting logs and alerts: Log rate limit violations, consider Sentry or CloudWatch integration for monitoring
- [ ] T108 [P] Review API key handling: Ensure API keys not logged, not exposed in errors, stored securely

### Final Validation

- [ ] T109 Run full quickstart.md validation: Execute all setup steps from scratch in clean environment, verify no errors
- [ ] T110 Validate all Success Criteria from spec.md: (SC-001) RAG accuracy ≥85% on 50 test queries, (SC-002) Selection-only accuracy on 20 test cases, (SC-003) Widget on 10 random pages, (SC-004) Railway deployment health check 200 OK, (SC-005) No CORS errors on GitHub Pages (5 test queries), (SC-006) 95% queries <2.5s (100 test queries), (SC-007) All MDX files ingested (verify Qdrant collection count), (SC-008) Mobile functionality on 3 screen sizes
- [ ] T111 Create feature completion PHR in history/prompts/001-rag-chatbot-integration/: Document implementation summary, challenges, lessons learned, metrics (LOC, files created, dependencies added)

**Final Checkpoint**: All ADRs created, documentation complete, code clean and secure, all success criteria validated, feature ready for production use.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - **BLOCKS all user stories**
- **User Stories (Phase 3-7)**: All depend on Foundational (Phase 2) completion
  - **US1 (Phase 3)**: Can start after Foundational - **MVP core, highest priority**
  - **US3 (Phase 4)**: Can start after US1 (extends UI) - **MVP UI enhancements**
  - **US2 (Phase 5)**: Can start after Foundational (independent of US1/US3) - **Can be implemented in parallel with US5**
  - **US5 (Phase 6)**: Can start after US1 (optimizes US1 performance) - **Can be implemented in parallel with US2**
  - **US4 (Phase 7)**: Can start after US1 (extends US1 with history) - **Lowest priority**
- **Ingestion (Phase 8)**: Can start in parallel with US2-US5 (supports US1 but independent implementation)
- **Deployment (Phase 9)**: Depends on US1+US3 complete (MVP), can proceed without US2/US4/US5 for early deployment
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Foundational (Phase 2) ──┬──> US1 (Phase 3) ──┬──> US3 (Phase 4)
                         │                    │
                         │                    └──> US5 (Phase 6)
                         │                    │
                         │                    └──> US4 (Phase 7)
                         │
                         └──> US2 (Phase 5) [independent]
                         │
                         └──> Ingestion (Phase 8) [supports US1]
```

**Critical Path**: Setup → Foundational → US1 → US3 → Deployment (MVP)

**Parallel Opportunities**:
- US2 + US5 can be implemented in parallel after US1 complete
- Ingestion (Phase 8) can be implemented in parallel with US2-US5
- All ADRs (T090-T097) can be written in parallel
- All documentation updates (T098-T100) can be done in parallel
- All code quality tasks (T101-T105) can be done in parallel

### Within Each User Story

**US1 (General Book Query with RAG)**:
1. Ingestion pipeline (T030-T031) → RAG endpoint (T032-T033) → Health check (T034)
2. API client (T035-T036) + Hooks (T037) can be done in parallel
3. Chat components (T038-T039) in parallel → Chat panel (T040) → Widget integration (T042)
4. Plugin (T043-T044) + Styling (T045) in parallel

**US2 (Context-Specific Query)**:
1. Backend endpoint (T052)
2. Frontend: Text selection hook (T053) + Context menu (T054) in parallel → Widget integration (T055-T056) → API client update (T057)

**US3 (UI Integration)**:
1. Full-page mode (T046) + Expand button (T047) + Minimize (T048) in parallel
2. Mobile optimization (T049) + Loading states (T050) + Error messages (T051) in parallel

**US4 (Chat History)**:
1. Backend history endpoint (T065) + Cleanup script (T066) in parallel
2. Frontend hook update (T067) → History panel (T068) → Thread switching (T069) → Hybrid storage (T070)

**US5 (Performance)**:
1. Backend monitoring (T058) + Optimization (T059-T060) in parallel
2. Frontend loading indicators (T061) + Debouncing (T062) in parallel
3. Validation (T063-T064)

---

## Parallel Example: Foundational Phase (Phase 2)

```bash
# Launch all [P] marked tasks in Foundational phase together:
- T012: Config (backend/src/config.py)
- T013: Logger (backend/src/utils/logger.py)
- T014: Chunking utils (backend/src/utils/chunking.py)
- T022: Chat model (backend/src/models/chat.py)
- T023: Document model (backend/src/models/document.py)
- T024: Usage model (backend/src/models/usage.py)

# All above can be implemented in parallel (different files, no dependencies)

# Then sequentially:
- T015-T019: Middleware and schemas (dependencies on config)
- T020-T021: Database initialization (dependencies on models)
- T025-T028: Services (dependencies on models, config)
- T029: FastAPI bootstrap (dependencies on all middleware, routers, services)
```

---

## Parallel Example: User Story 1 (Phase 3)

```bash
# Backend: Ingestion pipeline
- T030: Ingestion service (backend/src/services/ingestion.py)
- T031: Ingestion script (backend/scripts/ingest_docs.py)

# These can run in parallel with frontend UI:

# Frontend: API and utilities
- T035: API client (frontend/src/utils/api.js)
- T036: Storage utils (frontend/src/utils/storage.js)
- T037: Chat history hook (frontend/src/hooks/useChatHistory.js)

# Frontend: React components (some parallel)
- T038: ChatMessage component (frontend/src/components/RagChatWidget/ChatMessage.jsx)
- T039: ChatInput component (frontend/src/components/RagChatWidget/ChatInput.jsx)
- T045: Chatbot CSS (frontend/static/css/chatbot.css)

# All above (T038, T039, T045) can be done in parallel
```

---

## Implementation Strategy

### MVP First (US1 + US3 Only)

**Goal**: Deploy working chatbot with full-book RAG as quickly as possible

1. **Phase 1**: Setup (T001-T011) - 1-2 hours
2. **Phase 2**: Foundational (T012-T029) - 4-8 hours ⚠️ CRITICAL PATH
3. **Phase 3**: User Story 1 (T030-T045) - 8-12 hours 🎯 MVP CORE
4. **Phase 4**: User Story 3 (T046-T051) - 2-4 hours 🎯 MVP UI
5. **Phase 9** (partial): Deployment (T077-T089) - 2-4 hours
6. **STOP and VALIDATE**: Test MVP independently, verify all acceptance scenarios for US1 and US3
7. **Deploy/Demo**: Push to production, gather feedback

**Total MVP Time Estimate**: 17-31 hours (2-4 days for single developer)

### Incremental Delivery

After MVP deployed, add features incrementally:

1. **MVP deployed** (US1 + US3) → Students can use full-book RAG chatbot
2. **Add US2** (Phase 5: T052-T057) → Students can query selected text → Deploy
3. **Add US5** (Phase 6: T058-T064) → Performance optimization → Deploy
4. **Add US4** (Phase 7: T065-T070) → Chat history persistence → Deploy
5. **Add Ingestion tools** (Phase 8: T071-T076) → Admin can manage content → Deploy
6. **Polish** (Phase 10: T090-T111) → Documentation, ADRs, validation → Final release

Each increment adds value without breaking previous features. Deploy after each user story completion.

### Parallel Team Strategy

With 2-3 developers, maximize parallelism:

**Week 1: Foundation**
- Everyone: Complete Setup (Phase 1) + Foundational (Phase 2) together (~1-2 days)

**Week 1-2: MVP User Stories (Parallel)**
- Developer A: User Story 1 backend (T030-T034)
- Developer B: User Story 1 frontend (T035-T045)
- Developer C: User Story 3 (T046-T051) + Deployment setup (T077-T086)

**Week 2: Integration and Deployment**
- Everyone: Integration testing, bug fixes, MVP deployment

**Week 3+: Additional Features (Parallel)**
- Developer A: User Story 2 (T052-T057)
- Developer B: User Story 5 (T058-T064)
- Developer C: User Story 4 (T065-T070) + Ingestion (T071-T076)

**Week 4: Polish**
- Everyone: ADRs (T090-T097 in parallel), Documentation (T098-T100 in parallel), Validation (T109-T111)

**Total Team Time Estimate**: 3-4 weeks for complete feature with 2-3 developers

---

## Task Summary

**Total Tasks**: 111 tasks

### By Phase:
- **Phase 1 (Setup)**: 11 tasks
- **Phase 2 (Foundational)**: 18 tasks ⚠️ CRITICAL - blocks all user stories
- **Phase 3 (US1 - RAG Query)**: 16 tasks 🎯 MVP CORE
- **Phase 4 (US3 - UI Integration)**: 6 tasks 🎯 MVP UI
- **Phase 5 (US2 - Selected Text)**: 6 tasks
- **Phase 6 (US5 - Performance)**: 7 tasks
- **Phase 7 (US4 - Chat History)**: 6 tasks
- **Phase 8 (Ingestion)**: 6 tasks
- **Phase 9 (Deployment)**: 13 tasks
- **Phase 10 (Polish)**: 22 tasks

### By User Story:
- **US1 (General Book Query)**: 16 tasks (MVP core)
- **US2 (Selected Text Query)**: 6 tasks
- **US3 (UI Integration)**: 6 tasks (MVP UI)
- **US4 (Chat History)**: 6 tasks
- **US5 (Performance)**: 7 tasks
- **Infrastructure (Setup + Foundational + Ingestion + Deployment + Polish)**: 70 tasks

### Parallelizable Tasks: 47 tasks marked [P]

### Suggested MVP Scope (US1 + US3):
- **MVP Tasks**: Phase 1 (11) + Phase 2 (18) + Phase 3 (16) + Phase 4 (6) + Phase 9 partial (13) = **64 tasks**
- **Remaining for Post-MVP**: 47 tasks (US2, US4, US5, Ingestion enhancements, Polish)

---

## Notes

- **[P] tasks**: Different files, no dependencies on incomplete tasks, can run in parallel
- **[Story] label**: Maps task to specific user story (US1, US2, US3, US4, US5) for traceability
- **Each user story**: Independently completable and testable (validates spec.md independent test criteria)
- **Commit strategy**: Commit after each task or logical group (e.g., complete a component)
- **Stop at checkpoints**: Validate story independently before proceeding to next
- **Tests not included**: Specification does not explicitly request TDD, so test tasks omitted. Testing via manual validation against acceptance scenarios.
- **ADRs required**: 8 ADRs identified in research.md must be created (Phase 10, T090-T097)
- **Constitution compliance**: All tasks align with project constitution v2.0.0 requirements

---

**Tasks file complete. Ready for implementation following MVP-first strategy: Setup → Foundational → US1 → US3 → Deploy MVP.**
