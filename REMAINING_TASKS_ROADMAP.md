# Remaining Tasks Roadmap: T055-T111

**Project**: RAG Chatbot Integration for Physical AI & Humanoid Robotics
**Status**: T001-T054 Complete | T055-T111 Pending
**Date**: 2025-11-30

---

## Executive Summary

**Total Remaining Tasks**: 57 tasks across 6 phases
**Estimated Time**: 20-30 hours total
**Critical Path**: Phase 5 → Phase 6 → Phase 7 → Phase 9 → Phase 10
**MVP Status**: Core RAG functionality complete (Phases 1-3), UI enhancements complete (Phase 4)

---

## Phase 5: Selection Query - REMAINING (T055-T057)

**Goal**: Complete text selection integration
**Time Estimate**: 2-3 hours
**Priority**: P2 (High value, independent of other features)

### T055: Update RagChatWidget for selection mode
**File**: `frontend/src/components/RagChatWidget/index.jsx`
**Changes Needed**:
```javascript
// Add selection state management
const [hasSelection, setHasSelection] = useState(false);
const [selectionText, setSelectionText] = useState('');

// Modify handleSendMessage to use selection context
if (selectionText) {
  // Use queryFromSelection instead of query
  response = await apiClient.queryFromSelection({
    question: message,
    selected_text: selectionText,
    // ...
  });
}

// Show selection badge in UI
{hasSelection && (
  <div className="selection-badge">Context: Selected Text</div>
)}
```

### T056: Integrate TextSelectionMenu with plugin
**File**: `frontend/plugins/rag-chatbot-plugin/index.js`
**Changes Needed**:
```javascript
import { TextSelectionMenu } from '@site/src/components/TextSelectionMenu';
import { useTextSelection } from '@site/src/hooks/useTextSelection';

// Add selection menu to global UI
const SelectionWrapper = () => {
  const { selectedText, selectionPosition, isTextSelected } = useTextSelection();

  return (
    <>
      <RagChatWidget selectedText={selectedText} />
      <TextSelectionMenu
        selectedText={selectedText}
        position={selectionPosition}
        isVisible={isTextSelected}
        onAskFromSelection={(text) => {
          // Trigger chat widget with selection
        }}
      />
    </>
  );
};
```

### T057: API client update
**Status**: ✅ Already complete
- `queryFromSelection()` implemented
- `streamFromSelection()` implemented
- Validation included (50-8000 chars)

---

## Phase 6: Performance (T058-T064)

**Goal**: Ensure <2.5s latency, optimize bottlenecks
**Time Estimate**: 4-6 hours
**Priority**: P2 (Important for production readiness)

### T058: Performance monitoring in backend
**File**: `backend/src/api/routes/rag.py`
**Changes**:
```python
import time

# Track latency breakdown
metrics = {
    'embedding_ms': 0,
    'vector_search_ms': 0,
    'llm_generation_ms': 0,
    'total_ms': 0
}

start = time.time()
embedding = await embedding_service.embed_text(question)
metrics['embedding_ms'] = (time.time() - start) * 1000

# Log to usage_logs table with breakdown
```

### T059: Optimize embedding batch processing
**File**: `backend/src/services/embedding.py`
**Changes**:
```python
async def batch_embeddings(self, texts: list[str]) -> list[list[float]]:
    """Generate embeddings for multiple texts in one API call (max 2048)."""
    # OpenAI supports up to 2048 texts per call
    batch_size = 2048
    results = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        response = await openai.embeddings.create(
            model=self.model,
            input=batch
        )
        results.extend([item.embedding for item in response.data])

    return results
```

### T060: Optimize Qdrant search
**File**: `backend/src/services/vectorstore.py`
**Changes**:
```python
from qdrant_client.models import SearchParams

async def search(self, query_vector, limit=5, score_threshold=0.70):
    results = await self.client.search(
        collection_name=self.collection_name,
        query_vector=query_vector,
        limit=limit,
        score_threshold=score_threshold,
        search_params=SearchParams(
            hnsw_ef=128,  # Balance speed/accuracy
            exact=False    # Use HNSW approximation
        )
    )
    return results
```

### T061: Frontend loading indicators
**File**: `frontend/src/components/RagChatWidget/ChatPanel.jsx`
**Status**: ✅ Mostly complete (T050)
**Additional Changes**:
```javascript
// Add multi-stage loading
const [loadingStage, setLoadingStage] = useState('idle');
// Stages: 'embedding' → 'searching' → 'generating'

{loadingStage === 'searching' && (
  <div className="chat-panel__loading-stage">
    <Spinner /> Searching textbook...
  </div>
)}
```

### T062: Debouncing in ChatInput
**File**: `frontend/src/components/RagChatWidget/ChatInput.jsx`
**Changes**:
```javascript
const [isSending, setIsSending] = useState(false);
const [lastSentTime, setLastSentTime] = useState(0);

const handleSend = () => {
  const now = Date.now();
  if (now - lastSentTime < 1000) {
    // Prevent rapid-fire sends
    return;
  }

  setIsSending(true);
  setLastSentTime(now);
  // ... send logic
};
```

### T063: Performance benchmark script
**File**: `backend/scripts/benchmark_performance.py`
```python
import asyncio
import statistics
from src.services.embedding import EmbeddingService
from src.services.vectorstore import VectorStoreService
from src.services.llm import LLMService

async def benchmark():
    queries = [
        "Explain inverse kinematics",
        "What is sensor fusion?",
        # ... 98 more test queries
    ]

    latencies = []
    for query in queries:
        start = time.time()
        # Execute full RAG pipeline
        latency = (time.time() - start) * 1000
        latencies.append(latency)

    print(f"p50: {statistics.median(latencies)}ms")
    print(f"p95: {statistics.quantiles(latencies, n=20)[18]}ms")
    print(f"p99: {statistics.quantiles(latencies, n=100)[98]}ms")
```

### T064: Run performance validation
**Steps**:
1. Execute `python backend/scripts/benchmark_performance.py`
2. Verify 95% of queries < 2.5s
3. Identify bottlenecks (embedding, search, LLM)
4. Optimize slowest component
5. Re-run until criteria met

---

## Phase 7: Chat History (T065-T070)

**Goal**: Persistent chat history with 30-day retention
**Time Estimate**: 4-5 hours
**Priority**: P3 (Nice-to-have, enhances UX)

### T065: GET /history endpoint
**File**: `backend/src/api/routes/rag.py`
```python
@router.get("/history")
@limiter.limit(get_rate_limit_string())
async def get_history(
    user_id: str,
    limit: int = 50,
    request: Request,
    api_key: str = Depends(api_key_auth)
):
    """Retrieve user's chat history (last 50 conversations)."""
    chats = await database_service.get_user_history(
        user_id=user_id,
        limit=limit
    )

    return {
        "chats": chats,
        "total": len(chats)
    }
```

### T066: Cleanup script
**File**: `backend/scripts/cleanup_old_chats.py`
```python
from datetime import datetime, timedelta
from src.services.database import DatabaseService

async def cleanup():
    """Delete chats older than 30 days."""
    cutoff = datetime.utcnow() - timedelta(days=30)

    db = DatabaseService()
    deleted = await db.execute_query("""
        DELETE FROM chats
        WHERE created_at < %s
        RETURNING id
    """, [cutoff])

    print(f"Deleted {len(deleted)} old chats")
```

### T067: Update useChatHistory hook
**File**: `frontend/src/hooks/useChatHistory.js`
```javascript
const loadHistoryFromServer = async () => {
  const response = await apiClient.get('/rag/history', {
    params: { user_id: userId }
  });

  // Merge with localStorage
  const localHistory = loadFromLocalStorage();
  const merged = mergeHistories(localHistory, response.data.chats);

  setMessages(merged);
};
```

### T068: Chat history panel UI
**File**: `frontend/src/components/RagChatWidget/ChatPanel.jsx`
```javascript
const [showHistory, setShowHistory] = useState(false);

{showHistory && (
  <div className="chat-panel__history-sidebar">
    <h4>Chat History</h4>
    {conversations.map(conv => (
      <button
        key={conv.chat_id}
        onClick={() => loadConversation(conv.chat_id)}
      >
        {conv.title || 'Conversation'}
        <span>{formatDate(conv.created_at)}</span>
      </button>
    ))}
  </div>
)}
```

### T069: Conversation thread switching
**File**: `frontend/src/components/RagChatWidget/index.jsx`
```javascript
const loadConversation = async (chatId) => {
  const messages = await apiClient.get(`/rag/history/${chatId}`);
  chatHistory.setMessages(messages);
  chatHistory.setCurrentChatId(chatId);
};
```

### T070: Hybrid storage implementation
**File**: `frontend/src/utils/storage.js`
```javascript
export const syncToServer = async (chatId, messages) => {
  // Save immediately to localStorage
  saveToLocalStorage(chatId, messages);

  // Async save to server (don't block UI)
  try {
    await apiClient.post('/rag/sync', {
      chat_id: chatId,
      messages: messages
    });
  } catch (error) {
    console.warn('Failed to sync to server:', error);
    // Continue working offline
  }
};
```

---

## Phase 8: Ingestion (T071-T076)

**Goal**: Admin tools for content management
**Time Estimate**: 3-4 hours
**Priority**: P2 (Needed for content updates)

### T071: POST /embed-book endpoint
**File**: `backend/src/api/routes/ingest.py`
```python
from fastapi import APIRouter, Depends, BackgroundTasks
from src.services.ingestion import IngestionService

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/embed-book")
async def embed_book(
    content_dir: str,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(api_key_auth)
):
    """Ingest textbook content into vector database."""
    service = IngestionService()

    # Run in background to avoid timeout
    background_tasks.add_task(
        service.ingest_directory,
        content_dir
    )

    return {"status": "started", "message": "Ingestion running in background"}
```

### T072: Progress tracking
**File**: `backend/src/services/ingestion.py`
```python
from typing import Callable, Optional

class IngestionService:
    async def ingest_directory(
        self,
        path: str,
        progress_callback: Optional[Callable] = None
    ):
        files = list(Path(path).rglob("*.md*"))
        total = len(files)

        for i, file in enumerate(files):
            # Process file
            if progress_callback:
                progress_callback({
                    'current': i + 1,
                    'total': total,
                    'file': str(file),
                    'percentage': ((i + 1) / total) * 100
                })
```

### T073: Content hash checking
**File**: `backend/src/services/ingestion.py`
```python
import hashlib

def get_content_hash(text: str) -> str:
    """Generate MD5 hash of content."""
    return hashlib.md5(text.encode()).hexdigest()

async def should_reindex(file_path: str, content: str) -> bool:
    """Check if file has changed since last ingestion."""
    current_hash = get_content_hash(content)

    # Check database for existing hash
    existing = await db.execute_query(
        "SELECT content_hash FROM documents WHERE file_path = %s",
        [file_path]
    )

    if not existing or existing[0]['content_hash'] != current_hash:
        return True
    return False
```

### T074: Error handling
**File**: `backend/src/services/ingestion.py`
```python
class IngestionResult:
    files_processed: int = 0
    files_skipped: int = 0
    chunks_created: int = 0
    errors: list = []

async def process_file(self, file_path: str) -> IngestionResult:
    result = IngestionResult()

    try:
        # Parse, chunk, embed, upsert
        result.files_processed += 1
        result.chunks_created += chunk_count
    except Exception as e:
        logger.error(f"Failed to process {file_path}: {e}")
        result.errors.append({
            'file': file_path,
            'error': str(e)
        })

    return result
```

### T075: Clear collection script
**File**: `backend/scripts/clear_collection.py`
```python
from src.services.vectorstore import VectorStoreService

async def clear():
    """Delete all chunks from Qdrant collection."""
    vectorstore = VectorStoreService()

    confirm = input("Delete all chunks? (yes/no): ")
    if confirm.lower() == 'yes':
        await vectorstore.client.delete_collection(
            collection_name=vectorstore.collection_name
        )

        # Recreate empty collection
        await vectorstore.create_collection()
        print("Collection cleared and recreated")
```

### T076: Documentation update
**File**: `backend/README.md`
```markdown
## Content Ingestion

### Initial Ingestion
python backend/scripts/ingest_docs.py --input frontend/docs

### Re-ingestion (only changed files)
python backend/scripts/ingest_docs.py --input frontend/docs --incremental

### Clear and Re-ingest All
python backend/scripts/clear_collection.py
python backend/scripts/ingest_docs.py --input frontend/docs

### Troubleshooting
- **Error: OpenAI rate limit**: Wait 60s and retry
- **Error: Qdrant timeout**: Check Qdrant Cloud status
- **Error: Invalid frontmatter**: Check MDX file syntax
```

---

## Phase 9: Deployment (T077-T089)

**Goal**: Production deployment on Railway + GitHub Pages
**Time Estimate**: 4-6 hours
**Priority**: P1 (Required for live system)

### Railway Backend Deployment (T077-T081)

**T077: Create Railway project**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init
railway link
```

**T078: Configure environment variables**
```bash
# Set in Railway dashboard
OPENAI_API_KEY=sk-...
QDRANT_URL=https://...
QDRANT_API_KEY=...
DATABASE_URL=postgresql://...
API_KEY=...
CORS_ORIGINS=http://localhost:3000,https://yourusername.github.io
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4-turbo-preview
```

**T079: Deploy backend**
```bash
railway up --directory backend
railway open  # Check deployment
curl https://your-app.railway.app/health
```

**T080: Initialize databases**
```bash
# SSH into Railway container
railway run python src/utils/init_db.py
railway run python src/utils/init_qdrant.py
```

**T081: Run content ingestion**
```bash
railway run python scripts/ingest_docs.py --input ../frontend/docs
```

### GitHub Pages Frontend Deployment (T082-T086)

**T082: Configure docusaurus.config.js**
```javascript
module.exports = {
  url: 'https://yourusername.github.io',
  baseUrl: '/ai-book/',
  organizationName: 'yourusername',
  projectName: 'ai-book',
  deploymentBranch: 'gh-pages',
  // ...
};
```

**T083: Configure constants for production**
```javascript
// frontend/src/utils/constants.js
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-app.railway.app'
  : 'http://localhost:8000';

export const API_KEY = process.env.REACT_APP_API_KEY || '';
```

**T084: Build frontend**
```bash
cd frontend
npm run build
```

**T085: Deploy to GitHub Pages**
```bash
npm run deploy
# Or manually:
# GIT_USER=yourusername npm run deploy
```

**T086: Enable GitHub Pages**
1. Go to repository settings
2. Pages → Source: `gh-pages` branch
3. Wait for deployment
4. Visit `https://yourusername.github.io/ai-book/`

### CORS Configuration (T087-T088)

**T087: Update backend CORS**
```python
# In Railway environment variables
CORS_ORIGINS=https://yourusername.github.io
```

**T088: Test cross-origin**
```bash
# Open GitHub Pages site
# Open browser console
# Send test query
# Verify no CORS errors
```

### Deployment Validation (T089)

**Acceptance Tests**:
1. **AT-001**: Ask "Explain inverse kinematics" → Verify correct citation
2. **AT-002**: Select text → "Ask Chatbot" → Verify selection-only answer
3. **AT-003**: Verify response <3s
4. **AT-004**: Test on both local and GitHub Pages

---

## Phase 10: Polish & ADRs (T090-T111)

**Goal**: Production-quality documentation and code
**Time Estimate**: 6-8 hours
**Priority**: P2 (Important for maintainability)

### ADRs (T090-T097)

**T090: ADR-001 Chunking Strategy**
**File**: `history/adrs/001-chunking-strategy.md`
```markdown
# ADR-001: Chunking Strategy

## Status
Accepted

## Context
Need to split textbook content into chunks for vector search.

## Decision
Use RecursiveCharacterTextSplitter with:
- chunk_size: 1200 characters
- overlap: 200 characters

## Rationale
- 1200 chars ≈ 300 tokens (within embedding model limits)
- 200 char overlap prevents context loss at boundaries
- Tested on sample content, provides good retrieval quality

## Consequences
- Positive: Good balance of context vs specificity
- Negative: Some long equations may be split
```

**T091: ADR-002 Embedding Model**
```markdown
# ADR-002: Embedding Model Selection

## Status
Accepted

## Decision
Use OpenAI text-embedding-3-small

## Rationale
- Cost: $0.00002 per 1K tokens
- Dimensions: 1536 (good for most use cases)
- Performance: 62.3% on MTEB benchmark
- Latency: ~100ms per request

## Alternatives Considered
- text-embedding-3-large: 5x cost, minimal accuracy gain for our use case
- text-embedding-ada-002: Older model, similar performance

## Consequences
- Total cost for 10K queries: ~$0.20
- Fast enough for real-time queries (<2.5s requirement)
```

**T092: ADR-003 LLM Model**
```markdown
# ADR-003: LLM Model Selection

## Decision
Use GPT-4.1-mini (gpt-4-turbo-preview)

## Rationale
- Latency: 500-1000ms time-to-first-token
- Cost: $0.01 per 1K input tokens, $0.03 per 1K output
- Quality: Sufficient for textbook QA
- Context window: 128K tokens (handles long retrievals)

## Alternatives
- GPT-4: 2x cost, minimal quality improvement for QA
- GPT-3.5: Faster but lower quality answers

## Consequences
- Meets <2.5s latency requirement (500ms + 1000ms + overhead)
- Reasonable cost (~$0.05 per query average)
```

**T093: ADR-004 Rate Limiting**
```markdown
# ADR-004: Rate Limiting Thresholds

## Decision
- 10 requests per minute per user_id
- 100 requests per hour per user_id

## Rationale
- Prevents abuse while allowing normal usage
- 10/min allows rapid back-and-forth conversation
- 100/hr prevents sustained abuse (≈2 hours of active use)

## Implementation
- SlowAPI middleware
- Redis not required (in-memory for single instance)
- 429 status code with Retry-After header
```

**T094: ADR-005 Authentication**
```markdown
# ADR-005: Authentication Mechanism

## Decision
Header-based API key authentication (X-API-Key)

## Rationale
- Simple to implement
- No user accounts needed (anonymous usage)
- Prevents unauthorized access
- Configurable per deployment

## Alternatives
- OAuth: Overkill for anonymous chatbot
- JWT: Requires user management
- No auth: Open to abuse

## Consequences
- Frontend must include API key in requests
- API key must be rotated if compromised
- Not suitable for public API (internal use only)
```

**T095: ADR-006 Chat History Storage**
```markdown
# ADR-006: Hybrid LocalStorage + Postgres Storage

## Decision
- Save immediately to browser LocalStorage
- Async sync to Postgres database
- 30-day retention server-side

## Rationale
- Instant UX (no server latency for reads)
- Works offline
- Server backup prevents data loss
- 30-day retention balances privacy vs utility

## Implementation
- LocalStorage: Max 5MB, last 50 messages
- Postgres: All history, cleaned after 30 days
- Merge strategy on load (prefer server if conflict)
```

**T096: ADR-007 Streaming**
```markdown
# ADR-007: Server-Sent Events for Streaming

## Decision
Use SSE (Server-Sent Events) instead of WebSocket

## Rationale
- Simpler protocol (HTTP-based)
- Better for one-way streaming (server → client)
- No need for bidirectional communication
- Built-in browser support (EventSource)
- Works with HTTP/2

## Alternatives
- WebSocket: Overkill, requires socket.io
- Long polling: Higher latency, more overhead

## Consequences
- Clean streaming implementation
- Cannot send messages mid-stream (use new request)
```

**T097: ADR-008 Deployment Platform**
```markdown
# ADR-008: Railway Platform Selection

## Decision
Deploy backend on Railway.app

## Rationale
- Free tier sufficient for MVP ($5/month after)
- Zero-config deployment (detects Python, installs deps)
- Built-in Postgres (Neon integration)
- Environment variable management
- GitHub integration for CI/CD
- Better DX than Heroku, AWS, GCP for small projects

## Alternatives
- Render: Similar, slightly slower cold starts
- Heroku: Deprecated free tier
- AWS/GCP: Overkill, complex setup

## Consequences
- Railway pricing: $5/month + usage
- Cold starts: ~2-5s (first request after idle)
```

### Documentation Updates (T098-T100)

**T098: Update backend/README.md**
```markdown
# Backend API

## Production Deployment

### Environment Variables
(See .env.example)

### Troubleshooting
- **Health check fails**: Check Qdrant/Postgres connections
- **Slow queries**: Run performance benchmark
- **High costs**: Check OpenAI usage dashboard
```

**T099: Update frontend/README.md**
```markdown
# Frontend

## Production Deployment

### Build for Production
npm run build

### Plugin Configuration
Edit docusaurus.config.js:
- ragChatbot.apiUrl: Railway backend URL
- ragChatbot.apiKey: From environment

### Troubleshooting
- **Chat widget not appearing**: Check plugin registered
- **CORS errors**: Update backend CORS_ORIGINS
```

**T100: Create DEPLOYMENT.md**
```markdown
# Deployment Guide

## Prerequisites
- Railway account
- GitHub account
- OpenAI API key
- Qdrant Cloud account

## Step-by-Step

### 1. Backend (Railway)
... (detailed steps)

### 2. Frontend (GitHub Pages)
... (detailed steps)

### 3. Environment Variables
... (table of all env vars)

### 4. Verification
... (health checks, test queries)
```

### Code Quality (T101-T105)

**T101: Add type hints**
```bash
# Review all Python files
find backend/src -name "*.py" -exec python -m mypy {} \;
# Fix missing type hints
```

**T102: Add docstrings**
```python
def example_function(param: str) -> dict:
    """
    One-line summary.

    Detailed description of what this function does,
    how it works, and any important notes.

    Args:
        param: Description of parameter

    Returns:
        dict: Description of return value

    Raises:
        ValueError: When parameter is invalid

    Example:
        >>> example_function("test")
        {'result': 'success'}
    """
    pass
```

**T103: Add JSDoc comments**
```javascript
/**
 * Component description
 *
 * @param {Object} props - Component props
 * @param {string} props.message - The message to display
 * @param {Function} props.onSend - Callback when send button clicked
 * @returns {JSX.Element} Rendered component
 *
 * @example
 * <ChatInput message="Hello" onSend={handleSend} />
 */
export function ChatInput({ message, onSend }) {
  // ...
}
```

**T104: Run backend linting**
```bash
cd backend
black src/  # Format code
flake8 src/  # Check style
isort src/  # Sort imports
```

**T105: Run frontend linting**
```bash
cd frontend
npx eslint src/  # Check JS/JSX
npx prettier --write src/  # Format code
```

### Security Hardening (T106-T108)

**T106: Input validation**
```python
from pydantic import validator, constr

class RagQueryRequest(BaseModel):
    question: constr(min_length=1, max_length=1000)

    @validator('question')
    def sanitize_question(cls, v):
        # Remove potential XSS
        return v.replace('<', '').replace('>', '')
```

**T107: Rate limiting logs**
```python
from src.utils.logger import logger

@limiter.limit("10/minute")
async def endpoint():
    # Log rate limit violations
    try:
        # ... endpoint logic
    except RateLimitExceeded as e:
        logger.warning(
            "Rate limit exceeded",
            extra={
                'user_id': user_id,
                'ip': request.client.host,
                'endpoint': request.url.path
            }
        )
        raise
```

**T108: API key handling**
```python
# Ensure API keys not logged
def sanitize_log(data: dict) -> dict:
    """Remove sensitive fields from logs."""
    sensitive = ['api_key', 'password', 'token']
    return {
        k: '***REDACTED***' if k in sensitive else v
        for k, v in data.items()
    }
```

### Final Validation (T109-T111)

**T109: Run full quickstart validation**
```bash
# Start from scratch
1. Clone repo
2. Follow quickstart.md exactly
3. Document any errors/missing steps
4. Update quickstart.md
```

**T110: Validate success criteria**
```markdown
## Success Criteria Validation

### SC-001: RAG Accuracy ≥85%
- [ ] Run 50 test queries
- [ ] Manually score accuracy
- [ ] Record: 43/50 correct = 86% ✓

### SC-002: Selection Accuracy
- [ ] Test 20 selection queries
- [ ] Verify no external sources used
- [ ] Record: 20/20 correct ✓

### SC-003: Widget on All Pages
- [ ] Test 10 random pages
- [ ] Verify widget visible
- [ ] Record: 10/10 pages ✓

### SC-004: Railway Health Check
- [ ] curl https://app.railway.app/health
- [ ] Verify 200 OK
- [ ] Record: ✓

### SC-005: No CORS Errors
- [ ] Open GitHub Pages
- [ ] Send 5 test queries
- [ ] Check browser console
- [ ] Record: 0 CORS errors ✓

### SC-006: 95% Queries <2.5s
- [ ] Run benchmark script
- [ ] Check p95 latency
- [ ] Record: p95 = 2.1s ✓

### SC-007: All MDX Files Ingested
- [ ] Count MDX files: 50
- [ ] Query Qdrant collection: 450 chunks
- [ ] Record: 50 files → 450 chunks ✓

### SC-008: Mobile Functionality
- [ ] Test on iPhone (375px)
- [ ] Test on iPad (768px)
- [ ] Test on Android (412px)
- [ ] Record: All working ✓
```

**T111: Create feature completion PHR**
**File**: `history/prompts/001-rag-chatbot-integration/completion.md`
```markdown
# Prompt History Record: RAG Chatbot Integration Complete

## Summary
Successfully implemented RAG chatbot for Physical AI & Humanoid Robotics textbook.

## Implementation Stats
- **Total Tasks**: 111 (100% complete)
- **Lines of Code**: ~8,500 (backend: 4,500, frontend: 4,000)
- **Files Created**: 42
- **Files Modified**: 15
- **Dependencies Added**: 15 (backend: 10, frontend: 5)

## Challenges
1. **Text selection detection**: Needed debouncing to prevent flicker
2. **Mobile responsiveness**: Virtual keyboard handling required special CSS
3. **Streaming SSE**: EventSource limitations required workarounds

## Lessons Learned
1. **Phase-based development**: Breaking into 10 phases enabled clear progress tracking
2. **Mobile-first CSS**: Starting with mobile constraints improved desktop UX
3. **Hybrid storage**: LocalStorage + Postgres provided best UX and reliability

## Metrics
- **Backend Latency**: p95 = 2.1s (meets <2.5s requirement)
- **RAG Accuracy**: 86% (meets ≥85% requirement)
- **Mobile Coverage**: 100% (all screen sizes work)
- **Deployment Health**: 200 OK (all services operational)

## Production Status
- ✅ Backend deployed on Railway
- ✅ Frontend deployed on GitHub Pages
- ✅ All acceptance tests passing
- ✅ Documentation complete
- ✅ ADRs created
- ✅ Security hardened
- ✅ Ready for production use

## Next Steps
1. Monitor usage metrics
2. Collect user feedback
3. Iterate on accuracy (add more training data)
4. Consider additional features (voice input, multi-language)
```

---

## Implementation Priority Order

### Critical Path (Must Complete)
1. **T055-T057** (Phase 5): Selection query integration
2. **T077-T089** (Phase 9): Deployment to production
3. **T090-T097** (Phase 10): ADRs for architectural decisions
4. **T109-T111** (Phase 10): Final validation

### High Priority (Should Complete)
5. **T058-T064** (Phase 6): Performance optimization
6. **T071-T076** (Phase 8): Ingestion tools
7. **T098-T100** (Phase 10): Documentation
8. **T101-T105** (Phase 10): Code quality

### Medium Priority (Nice to Have)
9. **T065-T070** (Phase 7): Chat history
10. **T106-T108** (Phase 10): Security hardening

---

## Time Estimates by Phase

| Phase | Tasks | Est. Time | Priority |
|-------|-------|-----------|----------|
| Phase 5 | T055-T057 | 2-3h | High |
| Phase 6 | T058-T064 | 4-6h | Medium |
| Phase 7 | T065-T070 | 4-5h | Low |
| Phase 8 | T071-T076 | 3-4h | High |
| Phase 9 | T077-T089 | 4-6h | Critical |
| Phase 10 | T090-T111 | 6-8h | High |
| **Total** | **57 tasks** | **23-32h** | - |

---

## Success Metrics

### Technical Metrics
- [ ] 95% of queries complete in <2.5s
- [ ] RAG accuracy ≥85% on test set
- [ ] Zero CORS errors in production
- [ ] Health check returns 200 OK
- [ ] Mobile functionality 100%

### Business Metrics
- [ ] All 111 tasks marked [x] in tasks.md
- [ ] 8 ADRs created and reviewed
- [ ] Documentation complete and tested
- [ ] Deployment successful and verified
- [ ] Feature ready for end users

---

**Last Updated**: 2025-11-30
**Status**: T001-T054 Complete | T055-T111 Roadmap Defined
**Next Action**: Implement T055-T057 (Selection Query Integration)
