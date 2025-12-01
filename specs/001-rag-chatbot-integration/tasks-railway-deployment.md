# Tasks: Railway Backend Deployment for GitHub Pages Integration

**Context**: Frontend is deployed to GitHub Pages (https://fsheee.github.io/ai-book/) but backend is running locally (localhost:8000). GitHub Pages cannot reach local backend, causing "Streaming connection failed" errors.

**Goal**: Deploy backend to Railway (publicly accessible) so GitHub Pages frontend can connect to it.

**Prerequisites**:
- Backend code complete and tested locally ✅
- Databases initialized (Postgres + Qdrant) ✅
- Backend running successfully at localhost:8000 ✅
- Railway account (free tier available)
- Railway CLI installed (optional, can use web interface)

---

## Phase 1: Railway Account Setup

**Purpose**: Create Railway account and prepare for deployment

- [ ] T001 Sign up for Railway account at https://railway.app/ (use GitHub OAuth for easy authentication)
- [ ] T002 Verify email and complete Railway account setup
- [ ] T003 (Optional) Install Railway CLI: Run `npm install -g @railway/cli` for command-line deployment

---

## Phase 2: Railway Project Setup

**Purpose**: Create Railway project and configure services

- [ ] T004 Create new Railway project: Click "New Project" in Railway dashboard
- [ ] T005 Name project: "ai-book-backend" or similar descriptive name
- [ ] T006 Connect GitHub repository: Link Railway to your GitHub repo (fsheee/ai-book) for automatic deployments

---

## Phase 3: Environment Variables Configuration

**Purpose**: Configure production environment variables in Railway

- [ ] T007 Add OPENAI_API_KEY: Copy from backend/.env to Railway project environment variables
- [ ] T008 Add QDRANT_URL: Copy Qdrant Cloud URL from backend/.env
- [ ] T009 Add QDRANT_API_KEY: Copy Qdrant API key from backend/.env
- [ ] T010 Add DATABASE_URL: Copy Neon Postgres connection string from backend/.env
- [ ] T011 Add API_KEY: Generate or copy API key for frontend authentication
- [ ] T012 Add CORS_ORIGINS: Set to "https://fsheee.github.io" (GitHub Pages URL)
- [ ] T013 Add PORT: Set to "8000" (Railway will expose this port publicly)
- [ ] T014 Add EMBEDDING_MODEL: Set to "text-embedding-3-small"
- [ ] T015 Add LLM_MODEL: Set to "gpt-4-turbo-preview"

---

## Phase 4: Railway Deployment Configuration

**Purpose**: Configure Railway to build and run the backend

- [ ] T016 Verify railway.toml exists: Check backend/railway.toml has correct build and start commands
- [ ] T017 Update railway.toml if needed: Ensure it specifies Python 3.11+, pip install, and uvicorn start command
- [ ] T018 Create nixpacks.toml (if needed): Configure Python version and dependencies for Railway's build system
- [ ] T019 Add Procfile (alternative): Create backend/Procfile with `web: cd backend && uvicorn src.main:app --host 0.0.0.0 --port $PORT`

---

## Phase 5: Deploy Backend to Railway

**Purpose**: Push backend code to Railway and start service

- [ ] T020 Deploy via GitHub: Railway auto-deploys after connecting GitHub repo (push to trigger deployment)
- [ ] T021 Monitor deployment logs: Check Railway dashboard for build progress and errors
- [ ] T022 Wait for deployment to complete: Verify Railway shows "Deployed" status (typically 2-5 minutes)
- [ ] T023 Get Railway public URL: Copy the generated Railway URL (e.g., https://ai-book-backend-production.up.railway.app)

---

## Phase 6: Initialize Databases on Railway

**Purpose**: Run database initialization scripts on Railway backend

- [ ] T024 Run init_db.py on Railway: Use Railway CLI `railway run python scripts/init_db.py` or create one-off command in dashboard
- [ ] T025 Run init_qdrant.py on Railway: Use Railway CLI `railway run python scripts/init_qdrant.py` to create Qdrant collection
- [ ] T026 Ingest content to Qdrant: Run `railway run python scripts/ingest_docs.py --docs-dir ../docs/` to populate vector database

---

## Phase 7: Update Frontend Configuration

**Purpose**: Point frontend to Railway backend instead of localhost

- [ ] T027 Update frontend API URL: Edit frontend/src/utils/constants.js to use Railway URL instead of localhost:8000
- [ ] T028 Update CORS configuration: Ensure backend CORS_ORIGINS includes GitHub Pages URL
- [ ] T029 Rebuild frontend: Run `npm run build` in frontend/ directory
- [ ] T030 Commit changes: Commit updated constants.js to Git

---

## Phase 8: Redeploy Frontend to GitHub Pages

**Purpose**: Deploy updated frontend that points to Railway backend

- [ ] T031 Push to GitHub: `git push origin 001-rag-chatbot-integration` to trigger GitHub Pages rebuild
- [ ] T032 Verify GitHub Actions: Check GitHub Actions tab for successful deployment
- [ ] T033 Wait for deployment: GitHub Pages typically takes 1-3 minutes to update
- [ ] T034 Clear browser cache: Hard refresh (Ctrl+Shift+R) to ensure new code loads

---

## Phase 9: End-to-End Validation

**Purpose**: Test chatbot from GitHub Pages with Railway backend

- [ ] T035 Open GitHub Pages site: Navigate to https://fsheee.github.io/ai-book/
- [ ] T036 Test floating button: Verify chat button appears and opens panel
- [ ] T037 Test basic query: Ask "What is Physical AI?" and verify response streams correctly
- [ ] T038 Test source citations: Verify sources are displayed and clickable
- [ ] T039 Test multiple queries: Send 5 different questions to verify consistent functionality
- [ ] T040 Test error handling: Verify empty message shows validation error
- [ ] T041 Check response latency: Measure time to first token (<1s) and full response (<2.5s)
- [ ] T042 Test on mobile: Open site on mobile device and verify responsive UI works

---

## Phase 10: Monitoring and Optimization

**Purpose**: Set up monitoring and optimize production deployment

- [ ] T043 Monitor Railway logs: Check Railway dashboard logs for any errors or warnings
- [ ] T044 Monitor Railway metrics: Check CPU, memory, and request count in Railway dashboard
- [ ] T045 Test rate limiting: Send rapid requests to verify rate limiting (10/min) is working
- [ ] T046 Review OpenAI API usage: Check OpenAI dashboard for token usage and costs
- [ ] T047 Review Qdrant usage: Check Qdrant Cloud dashboard for vector operations and storage
- [ ] T048 Document Railway URL: Add Railway backend URL to DEPLOYMENT_STATUS.md

---

## Success Criteria

✅ **Backend Deployed**: Railway backend running and accessible at public URL
✅ **Databases Connected**: Postgres and Qdrant working from Railway
✅ **Content Ingested**: Vector database populated with textbook content
✅ **Frontend Updated**: GitHub Pages pointing to Railway backend URL
✅ **End-to-End Working**: Chatbot queries working from GitHub Pages
✅ **Performance Met**: Response latency <2.5s, streaming functional
✅ **Monitoring Active**: Railway logs and metrics being tracked

---

## Troubleshooting Common Issues

### Issue 1: Railway Build Fails
**Solution**: Check Railway logs for Python version or dependency errors. Ensure requirements.txt has correct versions.

### Issue 2: CORS Errors in Browser
**Solution**: Verify CORS_ORIGINS in Railway includes exact GitHub Pages URL (https://fsheee.github.io, no trailing slash).

### Issue 3: Database Connection Errors
**Solution**: Double-check DATABASE_URL, QDRANT_URL, and QDRANT_API_KEY in Railway environment variables match .env file.

### Issue 4: 500 Internal Server Error
**Solution**: Check Railway logs for traceback. Common causes: missing environment variable, database not initialized.

### Issue 5: Slow Response Times
**Solution**: Railway free tier has cold starts. First request may be slow (5-10s), subsequent requests should be fast (<2.5s).

---

## Cost Estimates (Railway Free Tier)

- **Free Tier Limits**: $5/month execution time, 512MB RAM, shared CPU
- **Expected Usage**: RAG chatbot with light traffic (~100 queries/day) should stay within free tier
- **Upgrade Path**: If free tier exceeded, Railway Pro is $20/month for 8GB RAM and more execution time

---

## Alternative: Render Deployment

If Railway doesn't work, you can deploy to Render (another free hosting option):

1. Sign up at https://render.com/
2. Create new Web Service
3. Connect GitHub repo
4. Set build command: `pip install -r backend/requirements.txt`
5. Set start command: `cd backend && uvicorn src.main:app --host 0.0.0.0 --port $PORT`
6. Add same environment variables as Railway
7. Deploy and follow same frontend update steps

---

**Total Tasks**: 48 tasks across 10 phases for complete Railway deployment and GitHub Pages integration.
