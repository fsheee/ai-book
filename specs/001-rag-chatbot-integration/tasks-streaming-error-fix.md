# Tasks: Fix Streaming Connection Error

**Issue**: User reports "Streaming connection failed" when typing in chatbot at localhost:3001

**Root Causes Identified**:
1. **API_KEY Mismatch**: Frontend constants.js has placeholder API key, backend .env has actual key `e7270f4b-d4c3-4c74-81d8-0cc8b818112f`
2. **CORS Configuration**: Backend CORS_ORIGINS only allows `localhost:3000`, but frontend runs on `localhost:3001`

**Impact**: Frontend cannot authenticate with backend, causing all API requests to fail

---

## Phase 1: Fix API Key Mismatch

**Purpose**: Update frontend to use correct API key matching backend

- [ ] T001 Update frontend/src/utils/constants.js: Change API_KEY from `'your-secret-api-key-here-generate-random-string'` to `'e7270f4b-d4c3-4c74-81d8-0cc8b818112f'` (match backend/.env)

---

## Phase 2: Fix CORS Configuration

**Purpose**: Allow backend to accept requests from localhost:3001

- [ ] T002 Update backend/.env: Change CORS_ORIGINS from `http://localhost:3000,https://fsheee.github.io` to `http://localhost:3000,http://localhost:3001,https://fsheee.github.io`
- [ ] T003 Restart backend server: Kill current backend process and restart with `cd backend && python -m src.main` to apply new CORS settings

---

## Phase 3: Rebuild Frontend

**Purpose**: Apply changes to running frontend

- [ ] T004 Kill current frontend dev servers: Stop both port 3000 and 3001 servers
- [ ] T005 Restart frontend on port 3001: Run `cd frontend && npm start -- --port 3001` to apply updated API_KEY

---

## Phase 4: Verify Fix

**Purpose**: Confirm streaming connection works

- [ ] T006 Open browser: Navigate to http://localhost:3001/ai-book/
- [ ] T007 Open chat panel: Click floating chat button
- [ ] T008 Send test query: Type "What is Physical AI?" and press Enter
- [ ] T009 Verify success: Confirm response streams without "connection failed" error
- [ ] T010 Check browser DevTools: Open Network tab and verify /rag/query request returns 200 OK (not 401 or 403)

---

## Expected Behavior After Fix

✅ **Before**: "Streaming connection failed" error
✅ **After**: Response streams successfully with answer and sources

## Technical Details

### API Authentication Flow
1. Frontend sends request to `http://localhost:8000/rag/query`
2. Request includes header: `X-API-Key: e7270f4b-d4c3-4c74-81d8-0cc8b818112f`
3. Backend middleware validates key against `API_KEY` in .env
4. If match → request proceeds, if mismatch → 401 Unauthorized

### CORS Flow
1. Browser sends preflight OPTIONS request from `http://localhost:3001`
2. Backend checks if origin in `CORS_ORIGINS` list
3. If allowed → responds with Access-Control-Allow-Origin header
4. Browser allows actual request, otherwise blocks with CORS error

---

**Total Tasks**: 10 tasks across 4 phases

**Time Estimate**: 5 minutes (mostly server restarts)
