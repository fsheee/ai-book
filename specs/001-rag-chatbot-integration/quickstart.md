# RAG Chatbot Integration - Quickstart Guide

**Feature**: 001-rag-chatbot-integration
**Last Updated**: 2025-11-30

This guide provides step-by-step instructions for setting up and deploying the RAG chatbot system for the "Physical AI & Humanoid Robotics" textbook.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Local Development](#local-development)
5. [Deployment](#deployment)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Python 3.11+**: [Download](https://www.python.org/downloads/)
- **Node.js 18+**: [Download](https://nodejs.org/)
- **Git**: [Download](https://git-scm.com/downloads)

### Required Accounts (Free Tier)

1. **OpenAI API Key**: [Get API key](https://platform.openai.com/api-keys)
   - Required for ChatCompletions and Embeddings
   - Free tier: $5 credit (expires after 3 months)
   - Paid: Pay-as-you-go, ~$0.50-$2/day for typical usage

2. **Qdrant Cloud**: [Sign up](https://cloud.qdrant.io/)
   - Free tier: 1GB vector storage
   - No credit card required

3. **Neon Postgres**: [Sign up](https://neon.tech/)
   - Free tier: 0.5GB storage, 100 hours compute/month
   - No credit card required

4. **Railway** (for deployment): [Sign up](https://railway.app/)
   - Free tier: $5/month credit
   - Credit card required but not charged unless exceeded

### System Requirements

- **Disk Space**: 500MB for backend dependencies, 300MB for frontend
- **RAM**: 512MB minimum for local development
- **OS**: Windows, macOS, or Linux

---

## Backend Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ai-book.git
cd ai-book
```

### 2. Create Backend Directory Structure

```bash
mkdir -p backend/src/{models,services,api/routes,api/middleware,api/schemas,utils}
mkdir -p backend/tests/{unit,integration,e2e}
mkdir -p backend/scripts
cd backend
```

### 3. Create Virtual Environment

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 4. Install Dependencies

Create `requirements.txt`:

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
openai==1.10.0
qdrant-client==1.7.3
psycopg[binary]==3.1.17
pydantic==2.5.3
python-dotenv==1.0.0
slowapi==0.1.9
python-frontmatter==1.1.0
langchain==0.1.4
```

Install:

```bash
pip install -r requirements.txt
```

### 5. Environment Configuration

Create `.env` file in `backend/` directory:

```env
# OpenAI API
OPENAI_API_KEY=sk-proj-...your-key-here...

# Qdrant Cloud
QDRANT_URL=https://xyz-example.qdrant.cloud:6333
QDRANT_API_KEY=your-qdrant-api-key-here

# Neon Postgres
DATABASE_URL=postgresql://username:password@ep-xyz.us-east-2.aws.neon.tech/rag_chatbot_db

# API Security
API_KEY=your-secret-api-key-here-generate-random-string

# CORS (update with your GitHub Pages URL for production)
CORS_ORIGINS=http://localhost:3000,https://yourusername.github.io

# Configuration
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4-turbo-preview
VECTOR_COLLECTION=ai_book
TOP_K=5
SIMILARITY_THRESHOLD=0.70
CHUNK_SIZE=1200
CHUNK_OVERLAP=200

# Rate Limiting
RATE_LIMIT_PER_MINUTE=10
RATE_LIMIT_PER_HOUR=100
```

**Note**: Copy `.env.example` (to be created during implementation) and fill in your credentials.

### 6. Initialize Databases

Create `scripts/init_db.py`:

```python
# Implementation in /sp.tasks phase
# This script creates Postgres tables (chats, usage_logs)
```

Create `scripts/init_qdrant.py`:

```python
# Implementation in /sp.tasks phase
# This script creates Qdrant collection with proper configuration
```

Run initialization:

```bash
python scripts/init_db.py
python scripts/init_qdrant.py
```

Expected output:

```
✓ Connected to Postgres: ep-xyz.us-east-2.aws.neon.tech
✓ Created table: chats
✓ Created table: usage_logs
✓ Created indexes
Database initialization complete!

✓ Connected to Qdrant: xyz-example.qdrant.cloud
✓ Created collection: ai_book (1536 dimensions, Cosine distance)
✓ Created payload indexes
Qdrant initialization complete!
```

### 7. Ingest Textbook Content

Create `scripts/ingest_docs.py`:

```python
# Implementation in /sp.tasks phase
# This script parses MDX files, chunks content, generates embeddings, uploads to Qdrant
```

Run ingestion (assumes Docusaurus content is in `../docs`):

```bash
python scripts/ingest_docs.py --content-dir ../docs
```

Expected output:

```
Scanning docs directory: ../docs
Found 87 MDX files

Processing files:
[████████████████████████████████████████] 100% (87/87)

Generating embeddings (batch size: 100):
[████████████████████████████████████████] 100% (1234/1234 chunks)

Uploading to Qdrant:
[████████████████████████████████████████] 100% (1234/1234 chunks)

✓ Ingestion complete!
  Files processed: 87
  Files skipped: 0 (no changes)
  Chunks created: 1234
  Total time: 3m 42s
```

### 8. Run Development Server

```bash
uvicorn src.main:app --reload --port 8000
```

Expected output:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

Test health endpoint:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "healthy",
  "services": {
    "postgres": true,
    "qdrant": true,
    "openai": true
  },
  "timestamp": "2025-11-30T12:34:56Z",
  "version": "1.0.0"
}
```

---

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd ../  # Back to repository root
# Assuming Docusaurus is already set up in repository root
# If not, run: npx create-docusaurus@latest frontend classic
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Frontend Components

Create directory structure:

```bash
mkdir -p src/components/RagChatWidget
mkdir -p src/components/TextSelectionMenu
mkdir -p src/pages/chat
mkdir -p src/utils
mkdir -p src/hooks
mkdir -p plugins/rag-chatbot-plugin
mkdir -p static/css
```

### 4. Configure API Endpoint

Create `src/utils/constants.js`:

```javascript
export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://your-backend.railway.app'  // Update with your Railway URL
    : 'http://localhost:8000';

export const API_KEY =
  process.env.NODE_ENV === 'production'
    ? 'your-production-api-key'  // Store in GitHub Secrets for GH Pages
    : 'your-secret-api-key-here-generate-random-string';  // Same as backend .env
```

**Security Note**: For production, use environment variables or GitHub Secrets, not hardcoded keys.

### 5. Add Chatbot Plugin to Docusaurus

Edit `docusaurus.config.js`:

```javascript
module.exports = {
  // ... existing config
  plugins: [
    './plugins/rag-chatbot-plugin',  // Add this line
    // ... other plugins
  ],
  // ...
};
```

### 6. Run Development Server

```bash
npm start
```

Expected output:

```
[SUCCESS] Docusaurus website is running at: http://localhost:3000/
```

Open browser to `http://localhost:3000` and verify:
- Floating chat button appears in bottom-right corner
- Clicking button opens chat panel
- Typing a message sends request to backend (check browser console for API calls)

---

## Local Development

### Running Both Servers Simultaneously

**Option 1: Two Terminal Windows**

Terminal 1 (Backend):

```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
uvicorn src.main:app --reload --port 8000
```

Terminal 2 (Frontend):

```bash
npm start
```

**Option 2: Using tmux (macOS/Linux)**

```bash
tmux new-session -s dev \; \
  send-keys 'cd backend && source venv/bin/activate && uvicorn src.main:app --reload' C-m \; \
  split-window -h \; \
  send-keys 'npm start' C-m \;
```

**Option 3: Using Windows Terminal (Windows)**

```json
// Windows Terminal settings.json profile
{
  "name": "Dev Server",
  "commandline": "powershell.exe -NoExit -Command \"cd backend; .\\venv\\Scripts\\activate; uvicorn src.main:app --reload\"",
  "startingDirectory": "F:\\claude-code\\ai-book"
}
```

### Testing the Integration

1. **Full-book RAG Query**:
   - Open `http://localhost:3000`
   - Click floating chat button
   - Type: "Explain inverse kinematics from Chapter 5"
   - Verify: Response includes answer + source citations

2. **Selection-based Query**:
   - Select text on a page (hold Shift, drag cursor)
   - Right-click → "Ask from Selection" (or button appears)
   - Type: "What is the main point here?"
   - Verify: Response uses only selected text (no sources listed)

3. **Rate Limiting**:
   - Send 11 rapid requests
   - Verify: 11th request returns 429 error with "Retry-After" message

---

## Deployment

### Backend Deployment (Railway)

#### 1. Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `yourusername/ai-book` repository
4. Select `backend` directory as root

#### 2. Configure Environment Variables

In Railway dashboard → `backend` service → Variables tab:

```
OPENAI_API_KEY=sk-proj-...
QDRANT_URL=https://...
QDRANT_API_KEY=...
DATABASE_URL=postgresql://...
API_KEY=...
CORS_ORIGINS=https://yourusername.github.io
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4-turbo-preview
VECTOR_COLLECTION=ai_book
TOP_K=5
SIMILARITY_THRESHOLD=0.70
CHUNK_SIZE=1200
CHUNK_OVERLAP=200
RATE_LIMIT_PER_MINUTE=10
RATE_LIMIT_PER_HOUR=100
```

#### 3. Create railway.toml

Create `backend/railway.toml`:

```toml
[build]
builder = "nixpacks"
buildCommand = "pip install -r requirements.txt"

[deploy]
startCommand = "uvicorn src.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

#### 4. Deploy

```bash
git add .
git commit -m "Add backend deployment configuration"
git push origin main
```

Railway will automatically deploy on push. Check logs in dashboard for deployment status.

#### 5. Get Deployment URL

- Railway dashboard → `backend` service → Settings → Domains
- Copy URL (e.g., `https://backend-production-abc123.up.railway.app`)
- Update `CORS_ORIGINS` to include this URL
- Update frontend `API_BASE_URL` constant

### Frontend Deployment (GitHub Pages)

#### 1. Configure Docusaurus for GitHub Pages

Edit `docusaurus.config.js`:

```javascript
module.exports = {
  url: 'https://yourusername.github.io',  // Your GitHub Pages URL
  baseUrl: '/ai-book/',  // Repository name
  organizationName: 'yourusername',  // GitHub username
  projectName: 'ai-book',  // Repository name
  deploymentBranch: 'gh-pages',
  trailingSlash: false,
  // ... rest of config
};
```

#### 2. Update API Endpoint for Production

Edit `src/utils/constants.js`:

```javascript
export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://backend-production-abc123.up.railway.app'  // Your Railway URL
    : 'http://localhost:8000';
```

#### 3. Build and Deploy

```bash
npm run build
GIT_USER=yourusername npm run deploy
```

This will build the site and push to `gh-pages` branch.

#### 4. Enable GitHub Pages

1. Go to GitHub repository → Settings → Pages
2. Source: `gh-pages` branch, `/` (root) directory
3. Save

Site will be live at `https://yourusername.github.io/ai-book/` in 1-2 minutes.

#### 5. Verify Deployment

- Open `https://yourusername.github.io/ai-book/`
- Check browser console for API calls (should use Railway URL)
- Test full-book query and selection-based query
- Verify no CORS errors

---

## Testing

### Backend Tests

#### Unit Tests

```bash
cd backend
pytest tests/unit/ -v
```

Expected output:

```
tests/unit/test_embedding.py::test_generate_embedding PASSED
tests/unit/test_chunking.py::test_chunk_text PASSED
tests/unit/test_models.py::test_chat_model PASSED
...
====== 15 passed in 2.34s ======
```

#### Integration Tests

```bash
pytest tests/integration/ -v
```

**Note**: Integration tests require running Postgres, Qdrant, and OpenAI. Set `TEST_DATABASE_URL`, `TEST_QDRANT_URL` in `.env.test`.

#### End-to-End Tests

```bash
pytest tests/e2e/ -v
```

Expected output:

```
tests/e2e/test_full_flow.py::test_rag_query_full_flow PASSED
tests/e2e/test_full_flow.py::test_selection_query_flow PASSED
...
====== 5 passed in 12.45s ======
```

### Frontend Tests

```bash
npm test
```

Expected output:

```
PASS src/components/RagChatWidget/ChatInput.test.jsx
PASS src/components/RagChatWidget/ChatMessage.test.jsx
...
Test Suites: 8 passed, 8 total
Tests:       24 passed, 24 total
```

### End-to-End Tests (Playwright)

```bash
npx playwright test
```

Expected output:

```
Running 10 tests using 5 workers

  ✓ chatbot-flow.spec.ts:12:5 › should open chatbot (1.2s)
  ✓ chatbot-flow.spec.ts:23:5 › should send full-book query (3.4s)
  ✓ chatbot-flow.spec.ts:45:5 › should handle selection query (2.8s)
  ...

10 passed (15.3s)
```

---

## Troubleshooting

### Backend Issues

#### Problem: "Connection to Postgres failed"

**Symptoms**:

```
ERROR: could not connect to server: connection refused
```

**Solutions**:

1. Check `DATABASE_URL` in `.env` is correct
2. Verify Neon database is active (free tier hibernates after inactivity)
3. Check Neon dashboard for connection string
4. Test connection: `psql $DATABASE_URL`

#### Problem: "Qdrant collection not found"

**Symptoms**:

```
ERROR: Collection 'ai_book' does not exist
```

**Solutions**:

1. Run `python scripts/init_qdrant.py`
2. Verify Qdrant URL and API key in `.env`
3. Check Qdrant Cloud dashboard for collection status

#### Problem: "OpenAI rate limit exceeded"

**Symptoms**:

```
ERROR: Rate limit reached for requests
```

**Solutions**:

1. Check OpenAI dashboard for usage limits
2. Upgrade to paid tier (tier 1: 500 RPM, tier 2: 5000 RPM)
3. Implement request queuing in backend

#### Problem: "CORS error in browser"

**Symptoms**:

```
Access to fetch at 'http://localhost:8000/rag/query' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions**:

1. Check `CORS_ORIGINS` in backend `.env` includes frontend URL
2. Restart backend server after changing `.env`
3. Verify `CORSMiddleware` is configured in `src/main.py`

### Frontend Issues

#### Problem: "API key not defined"

**Symptoms**:

```
Uncaught ReferenceError: API_KEY is not defined
```

**Solutions**:

1. Check `src/utils/constants.js` exports `API_KEY`
2. Verify `.env` file in backend has `API_KEY` set
3. Clear browser cache and reload

#### Problem: "Chatbot button not appearing"

**Symptoms**: No floating button visible on page

**Solutions**:

1. Check browser console for errors
2. Verify plugin is registered in `docusaurus.config.js`
3. Check `src/components/RagChatWidget/index.jsx` is correctly imported
4. Inspect element: button should have `id="rag-chatbot-button"`

#### Problem: "Selected text context menu not appearing"

**Symptoms**: Right-click on selected text, no "Ask from Selection" option

**Solutions**:

1. Check `src/hooks/useTextSelection.js` is properly configured
2. Verify selection length is ≥ 50 characters
3. Check browser console for JavaScript errors

### Deployment Issues

#### Problem: "Railway deployment failed"

**Symptoms**:

```
Build failed: Python version not found
```

**Solutions**:

1. Check `runtime.txt` specifies `python-3.11`
2. Verify `railway.toml` has correct build command
3. Check Railway logs for specific error
4. Ensure all dependencies are in `requirements.txt`

#### Problem: "GitHub Pages 404 error"

**Symptoms**: `https://yourusername.github.io/ai-book/` returns 404

**Solutions**:

1. Check GitHub repository → Settings → Pages → Source is `gh-pages` branch
2. Verify `baseUrl` in `docusaurus.config.js` matches repository name
3. Wait 2-3 minutes for GitHub Pages to update
4. Check `gh-pages` branch exists: `git branch -a | grep gh-pages`

---

## Additional Resources

- **OpenAPI Documentation**: See `contracts/openapi.yaml` for full API reference
- **TypeScript Types**: See `contracts/frontend-api.ts` for frontend API client
- **Data Model**: See `data-model.md` for database schemas
- **Research Decisions**: See `research.md` for technical decisions and rationale

---

## Next Steps

After completing quickstart:

1. **Run `/sp.tasks`**: Generate detailed implementation tasks
2. **Create ADRs**: Document architectural decisions (see `research.md` for ADR list)
3. **Performance Testing**: Validate <2.5s latency and ≥85% accuracy requirements
4. **Security Audit**: Review API key handling, rate limiting, input validation
5. **User Acceptance Testing**: Test with real students, gather feedback

---

**Quickstart Guide Complete**: System ready for implementation phase.
