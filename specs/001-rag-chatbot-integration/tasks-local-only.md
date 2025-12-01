# Tasks: Local Testing Only (No Cloud Deployment)

**Context**: User wants to test chatbot locally without deploying to Railway. Backend runs at localhost:8000, frontend will run at localhost:3000.

**Goal**: Get chatbot working on local machine for testing and development.

**Current Status**:
- ✅ Backend running at localhost:8000
- ✅ Postgres database initialized (3 tables)
- ✅ Qdrant collection created (0 vectors)
- ✅ Sample content available (docs/intro.mdx)
- ❌ Frontend only deployed to GitHub Pages (can't reach localhost)
- ❌ Vector database empty (no content ingested)

---

## Phase 1: Prepare Content

**Purpose**: Add textbook content to vector database for RAG queries

- [x] T001 Ingest sample content: Run `cd backend && python scripts/ingest_docs.py --docs-dir ../docs/` to embed intro.mdx and upload to Qdrant
- [x] T002 Verify ingestion: Check backend logs or Qdrant dashboard to confirm vectors were uploaded (should see ~10-15 chunks from intro.mdx)

---

## Phase 2: Start Local Frontend

**Purpose**: Run frontend dev server locally to connect to local backend

- [x] T003 Navigate to frontend directory: `cd frontend`
- [x] T004 Install dependencies (if needed): Run `npm install` to ensure all packages are installed
- [x] T005 Start development server: Run `npm start` to launch Docusaurus at http://localhost:3001 (port 3000 was in use)
- [x] T006 Wait for server to start: Typically takes 30-60 seconds, browser should auto-open to localhost:3001

---

## Phase 3: Test Chatbot Locally

**Purpose**: Validate chatbot works end-to-end on local machine

### Basic Functionality Tests

- [ ] T007 Verify floating button appears: Check bottom-right corner of any page at localhost:3000
- [ ] T008 Open chat panel: Click floating button and verify panel opens
- [ ] T009 Test first query: Type "What is Physical AI?" and press Enter
- [ ] T010 Verify response streams: Watch tokens appear progressively (not all at once)
- [ ] T011 Check source citations: Verify response includes "Sources:" section with chapter references
- [ ] T012 Test second query: Ask "What is inverse kinematics?" to test retrieval accuracy
- [ ] T013 Test query with no match: Ask "What is quantum computing?" and verify "not covered" response

### UI Interaction Tests

- [ ] T014 Test minimize: Click minimize button and verify panel closes to floating button
- [ ] T015 Test reopen: Click floating button again and verify chat history persists
- [ ] T016 Test full-page mode: Click expand button and verify navigation to /chat route
- [ ] T017 Test mobile view: Resize browser to 375px width and verify responsive layout

### Text Selection Tests (if implemented)

- [ ] T018 Select text on page: Highlight a paragraph and verify blue selection highlighting
- [ ] T019 Test selection context: With text selected, ask question in chatbot and verify selected text appears in context banner
- [ ] T020 Clear selection: Click X on context banner and verify selection context is removed

### Error Handling Tests

- [ ] T021 Test empty message: Try sending blank message and verify "Please enter a question" validation
- [ ] T022 Test very long query: Send 500+ character question and verify it works or shows appropriate limit message
- [ ] T023 Stop backend: Kill backend process and send query, verify "service unavailable" error message

---

## Phase 4: Performance Testing

**Purpose**: Measure response times and system performance

- [ ] T024 Measure query latency: Send 5 different queries and record time from Enter press to first token appearing (target: <1 second)
- [ ] T025 Measure full response time: Record time from Enter to complete response (target: <2.5 seconds)
- [ ] T026 Test concurrent queries: Open two browser tabs and send queries simultaneously, verify both work
- [ ] T027 Check backend logs: Review backend terminal for any errors or warnings during testing

---

## Phase 5: Content Testing

**Purpose**: Validate RAG retrieval accuracy

- [ ] T028 Test specific content recall: Ask "What sensors are mentioned in the intro?" and verify answer matches intro.mdx content
- [ ] T029 Test multi-concept query: Ask "Explain the relationship between sensor fusion and inverse kinematics" to test multi-chunk retrieval
- [ ] T030 Test edge case: Ask very short query "robot?" and verify reasonable response
- [ ] T031 Test follow-up question: Ask "Tell me more about that" after initial query (tests if context is maintained)

---

## Phase 6: Documentation

**Purpose**: Record test results for future reference

- [ ] T032 Create test results file: Create `history/testing/local-test-results-[date].md`
- [ ] T033 Document passing tests: List all tests that passed with screenshots
- [ ] T034 Document failing tests: List any failures with error messages and reproduction steps
- [ ] T035 Note performance metrics: Record average latency, response times, and any bottlenecks
- [ ] T036 List known limitations: Document features not yet implemented (e.g., chat history persistence)

---

## Success Criteria

✅ **Frontend Running**: Docusaurus dev server at http://localhost:3000
✅ **Backend Connected**: Frontend successfully calls localhost:8000 APIs
✅ **Content Available**: At least 10 chunks in Qdrant from intro.mdx
✅ **RAG Queries Working**: Questions return accurate answers with sources
✅ **Streaming Active**: Responses appear token-by-token in real-time
✅ **UI Functional**: All buttons, panels, and navigation working
✅ **Performance Acceptable**: First token <1s, full response <2.5s

---

## Common Issues & Solutions

### Issue 1: "npm start" fails
**Solution**:
- Run `npm install` first
- Check Node.js version (need v18+)
- Delete `node_modules` and `.docusaurus` folders, run `npm install` again

### Issue 2: Backend connection refused
**Solution**:
- Verify backend is running (check for process at localhost:8000)
- Check backend logs for startup errors
- Ensure CORS_ORIGINS in .env includes "http://localhost:3000"

### Issue 3: No vectors in Qdrant
**Solution**:
- Re-run ingestion: `cd backend && python scripts/ingest_docs.py --docs-dir ../docs/`
- Check if docs/intro.mdx exists
- Check backend logs during ingestion for errors

### Issue 4: Chatbot returns "not covered"
**Solution**:
- Verify content was ingested (check Qdrant collection count)
- Try simpler query matching exact content (e.g., "Physical AI")
- Check similarity threshold isn't too high (should be 0.70)

### Issue 5: Slow responses (>5 seconds)
**Solution**:
- Check internet connection (OpenAI API calls)
- Verify OpenAI API key is valid
- Check OpenAI API status page
- Consider switching to faster model (gpt-3.5-turbo instead of gpt-4-turbo-preview)

---

## Next Steps After Local Testing

### If Everything Works:
1. **Option A**: Keep using locally for development/testing
2. **Option B**: Deploy to Railway when ready for production (see tasks-railway-deployment.md)
3. **Option C**: Add more content to docs/ and re-ingest

### If Issues Found:
1. Document bugs in GitHub issues
2. Fix issues in local environment
3. Re-test after fixes
4. Repeat until all tests pass

---

**Total Tasks**: 36 tasks across 6 phases for complete local testing workflow

**Time Estimate**:
- Phase 1: 5 minutes (content ingestion)
- Phase 2: 5 minutes (start frontend)
- Phase 3: 20 minutes (functional testing)
- Phase 4: 10 minutes (performance testing)
- Phase 5: 10 minutes (content testing)
- Phase 6: 10 minutes (documentation)
- **Total: ~60 minutes** for thorough local testing
