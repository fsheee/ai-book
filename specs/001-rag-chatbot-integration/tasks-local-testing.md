# Tasks: Local Testing Setup for RAG Chatbot

**Context**: Backend is deployed and running at `http://localhost:8000`. Databases (Postgres + Qdrant) are initialized. Need to test chatbot locally instead of from GitHub Pages.

**Goal**: Run frontend locally to test chatbot functionality with local backend.

**Prerequisites**:
- Backend running at http://localhost:8000 ✅
- Postgres database initialized ✅
- Qdrant collection "ai_book" created ✅
- Sample content in docs/intro.mdx ✅

---

## Phase 1: Content Ingestion

**Purpose**: Populate vector database with textbook content for RAG queries

- [ ] T001 Ingest sample textbook content: Run `python backend/scripts/ingest_docs.py --docs-dir docs/` from project root to embed and upload docs/intro.mdx to Qdrant
- [ ] T002 Verify ingestion: Check Qdrant collection has >0 vectors via backend logs or Qdrant dashboard

---

## Phase 2: Local Frontend Setup

**Purpose**: Run frontend locally to connect to local backend

- [ ] T003 Install frontend dependencies: Run `npm install` in frontend/ directory (if not already done)
- [ ] T004 Start local development server: Run `npm start` in frontend/ directory to launch Docusaurus at http://localhost:3000
- [ ] T005 Verify frontend loads: Open http://localhost:3000 in browser and confirm textbook site loads successfully

---

## Phase 3: End-to-End Testing

**Purpose**: Validate full RAG chatbot functionality

### Basic RAG Query (User Story 1)

- [ ] T006 Test floating chat button: Verify chat button appears in bottom-right corner on any page
- [ ] T007 Test chat panel open/close: Click floating button → panel opens, click close → panel minimizes
- [ ] T008 Test basic RAG query: Type "What is Physical AI?" → verify response streams in real-time
- [ ] T009 Test source citations: Verify response includes source citations with clickable links to textbook sections
- [ ] T010 Test query with no matching content: Ask "What is quantum computing?" → verify polite "not covered in textbook" response

### Context-Specific Query (User Story 2)

- [ ] T011 Test text selection: Select paragraph on page → verify text highlighting shows blue color
- [ ] T012 Test selection menu: After selecting text → verify "Ask from Selection" option appears (if implemented)
- [ ] T013 Test selection query: With text selected, open chatbot and ask question → verify response uses only selected text context

### UI Features (User Story 3)

- [ ] T014 Test full-page mode: Click expand button → verify navigation to /chat route with full-screen interface
- [ ] T015 Test mobile responsive: Resize browser to mobile width (375px) → verify UI adapts properly
- [ ] T016 Test new conversation: Click "New Conversation" button → verify chat history clears

### Performance (User Story 5)

- [ ] T017 Test response latency: Send 5 different queries → measure time to first token (<1s) and full response (<2.5s)
- [ ] T018 Test streaming: Verify tokens appear progressively during response generation, not all at once

### Error Handling

- [ ] T019 Test empty message: Try sending blank message → verify validation error "Please enter a question"
- [ ] T020 Test backend offline: Stop backend → send query → verify error message "Chatbot temporarily unavailable"

---

## Phase 4: Validation Summary

**Purpose**: Document test results and identify issues

- [ ] T021 Create test results document: Document all test outcomes (pass/fail) with screenshots in history/testing/local-test-results.md
- [ ] T022 Identify bugs: List any bugs found during testing with reproduction steps
- [ ] T023 Verify MVP criteria: Confirm User Story 1 (RAG queries) and User Story 3 (UI) acceptance criteria are met
- [ ] T024 Document known limitations: Note any missing features (e.g., chat history persistence, rate limiting)

---

## Success Criteria

✅ **Local Environment Running**: Frontend at http://localhost:3000, Backend at http://localhost:8000
✅ **RAG Queries Working**: Questions return accurate answers with source citations
✅ **Streaming Functional**: Responses stream token-by-token in real-time
✅ **UI Responsive**: Chatbot interface works on desktop and mobile
✅ **Errors Handled Gracefully**: Validation errors and service failures show user-friendly messages

---

## Next Steps After Local Testing

1. **If tests pass**: Ready for production deployment to Railway + GitHub Pages
2. **If bugs found**: Fix issues and retest locally before deployment
3. **Performance issues**: Profile backend latency, optimize vector search or LLM calls
4. **Missing features**: Implement User Story 4 (chat history) or User Story 5 (performance monitoring)
