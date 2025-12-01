---
id: 001-rag-chatbot-integration-tasks-007
title: Local-Only Testing Tasks
stage: tasks
date: 2025-12-01T22:30:00Z
surface: claude-code
model: claude-sonnet-4-5
feature: 001-rag-chatbot-integration
branch: 001-rag-chatbot-integration
user: user
command: /sp.tasks
labels: [local-testing, no-deployment, task-generation]
links:
  spec: specs/001-rag-chatbot-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - path: specs/001-rag-chatbot-integration/tasks-local-only.md
    status: created
    role: Local-only testing tasks without cloud deployment
tests: []
---

## Prompt

User input: "rightnow dont use railway"

**Context**:
- User previously requested deployment tasks for GitHub Pages
- I generated Railway deployment tasks (48 tasks in tasks-railway-deployment.md)
- User explicitly rejected Railway deployment: "rightnow dont use railway"
- User's chatbot on GitHub Pages shows "y not work proper" - still getting connection errors
- Root cause remains: GitHub Pages (remote) cannot reach localhost:8000 (local backend)

**User's Intent**:
User wants to test chatbot WITHOUT cloud deployment. They want the simplest local-only solution.

**Task Request**: Generate tasks for local testing only, no Railway, no cloud deployment.

## Response snapshot

Generated simplified task list in `tasks-local-only.md` with 6 phases (36 tasks total):

### Phase 1: Prepare Content (2 tasks)
- T001: Ingest intro.mdx into Qdrant vector database
- T002: Verify vectors uploaded successfully

### Phase 2: Start Local Frontend (4 tasks)
- T003-T006: Navigate to frontend/, npm install, npm start, wait for localhost:3000

### Phase 3: Test Chatbot Locally (17 tasks)
**Basic Functionality** (7 tests):
- T007-T013: Floating button, panel open, first query, streaming, sources, second query, no-match query

**UI Interaction** (4 tests):
- T014-T017: Minimize, reopen, full-page mode, mobile view

**Text Selection** (3 tests):
- T018-T020: Select text, selection context, clear selection

**Error Handling** (3 tests):
- T021-T023: Empty message, long query, backend offline error

### Phase 4: Performance Testing (4 tasks)
- T024-T027: Measure query latency, full response time, concurrent queries, check logs

### Phase 5: Content Testing (4 tasks)
- T028-T031: Specific recall, multi-concept, edge case, follow-up questions

### Phase 6: Documentation (5 tasks)
- T032-T036: Create test results file, document passing/failing tests, metrics, limitations

**Total**: 36 tasks, ~60 minutes estimated time

**Key Differences from Railway Tasks**:
- Railway tasks: 48 tasks focused on cloud deployment
- Local-only tasks: 36 tasks focused on testing
- No deployment steps - everything runs on localhost
- Frontend at localhost:3000 can reach backend at localhost:8000
- Simpler, faster, no cost, no accounts needed

**Success Criteria**:
- Frontend running at localhost:3000
- Backend connected at localhost:8000
- RAG queries working with source citations
- Streaming functional
- Performance <2.5s response time

**Common Issues Documented**:
- npm start fails → solution: reinstall dependencies
- Backend connection refused → check CORS includes localhost:3000
- No vectors → re-run ingestion script
- "Not covered" responses → verify content ingested
- Slow responses → check OpenAI API connectivity

## Outcome

- ✅ **Impact**: Created focused 36-task local testing plan avoiding cloud deployment complexity
- 🧪 **Tests**: Test execution tasks themselves (T007-T031 are test procedures)
- 📁 **Files**: 1 file created (tasks-local-only.md)
- 🔁 **Next prompts**: Execute Phase 1 (ingest content), Phase 2 (start frontend), Phase 3 (run tests)
- 🧠 **Reflection**: User wisely chose local testing first. This avoids Railway costs, signup friction, and deployment complexity while still validating the chatbot works. The chatbot on GitHub Pages will continue to fail (architecture limitation: remote→local impossible), but user can develop and test locally. When ready for production, they can revisit Railway deployment. Local testing is the RIGHT first step - validate code works before deploying anywhere.

## Evaluation notes (flywheel)

- **Failure modes observed**: None. Task generation successful.
- **Graders run and results (PASS/FAIL)**:
  - Format validation: PASS (all 36 tasks use checkbox + ID + description format)
  - Completeness: PASS (covers content prep, frontend start, functional tests, performance, documentation)
  - Clarity: PASS (each task has specific command or action)
  - Scope: PASS (local-only, no cloud services)
- **Prompt variant**: User explicitly rejected Railway ("rightnow dont use railway") after seeing deployment tasks
- **Next experiment**: Consider creating bash/powershell script to automate T001-T006 (one-command setup)

---

**Local Testing Tasks Generated**: 36 tasks across 6 phases. User can now test chatbot entirely on local machine without any cloud deployment. Start with T001 (ingest content) to populate vector database.
