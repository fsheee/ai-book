---
id: 001-rag-chatbot-integration-tasks-006
title: Local Testing Task Generation
stage: tasks
date: 2025-12-01T22:15:00Z
surface: claude-code
model: claude-sonnet-4-5
feature: 001-rag-chatbot-integration
branch: 001-rag-chatbot-integration
user: user
command: /sp.tasks
labels: [local-testing, validation, task-generation]
links:
  spec: specs/001-rag-chatbot-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - path: specs/001-rag-chatbot-integration/tasks-local-testing.md
    status: created
    role: Local testing task breakdown for MVP validation
  - path: docs/intro.mdx
    status: created
    role: Sample textbook content for testing RAG functionality
  - path: backend/scripts/init_db.py
    status: created
    role: Postgres database initialization script
  - path: backend/scripts/init_qdrant.py
    status: created
    role: Qdrant vector database initialization script
tests: []
---

## Prompt

User selected "option A" from previous recommendations:

**Option A**: Test locally by running `npm start` in frontend directory

**Context**:
- User previously deployed frontend to GitHub Pages (https://fsheee.github.io/ai-book/)
- User tested chatbot from GitHub Pages and got "Streaming connection failed" error
- Root cause: GitHub Pages frontend trying to reach localhost:8000 backend (impossible)
- I fixed the streaming error by:
  1. Creating database initialization scripts (init_db.py, init_qdrant.py)
  2. Initializing Postgres (3 tables: chats, messages, usage_logs)
  3. Initializing Qdrant (collection "ai_book" with 1536-dim vectors)
  4. Restarting backend - now running successfully with all services connected
- User now wants to test locally instead of deploying to Railway

**User's Choice**: "option A" - test locally

**Task Request**: Generate tasks for local testing and validation workflow

## Response snapshot

Generated focused task list for local testing in `tasks-local-testing.md` with 4 phases:

### Phase 1: Content Ingestion (2 tasks)
- T001: Ingest sample content (intro.mdx) into Qdrant vector database
- T002: Verify ingestion successful (check vector count)

### Phase 2: Local Frontend Setup (3 tasks)
- T003: Install frontend dependencies (`npm install`)
- T004: Start local dev server (`npm start` → http://localhost:3000)
- T005: Verify frontend loads successfully

### Phase 3: End-to-End Testing (15 tasks)
Organized by user story:

**User Story 1 (RAG Queries)** - 5 tasks:
- T006-T010: Test floating button, panel open/close, basic query, source citations, no-match response

**User Story 2 (Selection Queries)** - 3 tasks:
- T011-T013: Test text selection highlighting, selection menu, selection-based query

**User Story 3 (UI Features)** - 3 tasks:
- T014-T016: Test full-page mode, mobile responsive, new conversation

**User Story 5 (Performance)** - 2 tasks:
- T017-T018: Test response latency (<2.5s), streaming functionality

**Error Handling** - 2 tasks:
- T019-T020: Test empty message validation, backend offline error

### Phase 4: Validation Summary (4 tasks)
- T021-T024: Document test results, identify bugs, verify MVP criteria, note limitations

**Total**: 24 tasks for comprehensive local testing

**Key Features**:
- Organized by phase (ingestion → setup → testing → validation)
- Clear success criteria at end
- Testing covers all MVP user stories (US1, US2, US3, US5)
- Includes error handling validation
- Documents next steps based on test outcomes

**Prerequisites Met**:
- ✅ Backend running at localhost:8000
- ✅ Postgres initialized (3 tables, 0 rows)
- ✅ Qdrant initialized ("ai_book" collection, 0 vectors)
- ✅ Sample content created (docs/intro.mdx with Physical AI intro)

**What's Different from Main tasks.md**:
- Main tasks.md: Implementation tasks (111 tasks, 87 complete)
- tasks-local-testing.md: **Validation tasks** for local testing only (24 tasks)
- Focus: Testing existing code, not building new features
- Scope: Local environment only, not deployment

## Outcome

- ✅ **Impact**: Created focused 24-task validation plan for local testing workflow
- 🧪 **Tests**: Test tasks themselves are the deliverable (T006-T020 are end-to-end test cases)
- 📁 **Files**: 1 file created (tasks-local-testing.md), 3 supporting files created earlier (init scripts + sample content)
- 🔁 **Next prompts**: Execute Phase 1 (content ingestion), then Phase 2 (start frontend locally), then Phase 3 (run all tests)
- 🧠 **Reflection**: User selected local testing (option A) wisely - this allows validating the full stack before committing to Railway deployment costs. The streaming error from GitHub Pages was a network architecture issue (remote→local impossible), not a code bug. Local testing will confirm all features work correctly. The task list is deliberately small and focused - just enough to validate MVP functionality without overwhelming the user. If tests pass, user can proceed to deployment; if tests fail, bugs can be fixed locally without cloud complexity.

## Evaluation notes (flywheel)

- **Failure modes observed**: None. Task generation completed successfully.
- **Graders run and results (PASS/FAIL)**:
  - Format validation: PASS (all 24 tasks follow checkbox + ID + description format)
  - Completeness: PASS (covers all MVP user stories: US1, US2, US3, US5)
  - Clarity: PASS (each task has specific action and success criteria)
  - Scope: PASS (focuses on validation, not implementation)
- **Prompt variant**: User selected "option A" from multiple-choice recommendation (test locally vs deploy to Railway)
- **Next experiment**: Consider creating automated test script (playwright/cypress) to execute T006-T020 programmatically instead of manual testing

---

**Local Testing Tasks Generated**: 24 tasks across 4 phases (ingestion, setup, testing, validation). User can now proceed with T001 (ingest content) to begin local testing workflow. All prerequisites met (databases initialized, backend running, sample content available).
