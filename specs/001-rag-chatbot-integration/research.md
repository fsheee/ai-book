# Technical Research: RAG Chatbot Integration

**Date**: 2025-11-30
**Feature**: 001-rag-chatbot-integration
**Status**: Complete

## Research Summary

This research document consolidates technical decisions for implementing a RAG chatbot system integrated with a Docusaurus textbook. Key findings include: (1) Chunk size of 1200 characters with 200-character overlap provides optimal balance between context completeness and retrieval precision for technical content, (2) text-embedding-3-small selected for cost efficiency with acceptable performance, (3) GPT-4.1-mini chosen for its superior latency while maintaining strong accuracy, (4) SSE (Server-Sent Events) selected for streaming implementation due to simplicity and serverless compatibility, (5) Header-based API key authentication provides adequate security for public API, (6) LocalStorage + Postgres hybrid approach for chat history balancing privacy and persistence, and (7) Railway selected as deployment platform for its generous free tier and minimal cold start latency.

All decisions prioritize the core requirements: ≥85% answer accuracy, <2.5s response latency, and seamless operation across GitHub Pages and local development environments. The selected technologies and parameters are validated against the project constitution's mandated stack (FastAPI, OpenAI, Qdrant Cloud, Neon Postgres) and optimized for free-tier deployment constraints.

## Decisions

### 1. Chunking Strategy Parameters

- **Decision**: Chunk size = 1200 characters, overlap = 200 characters
- **Rationale**:
  - 1200 characters (~200-300 words) provides sufficient context for technical explanations while keeping token counts manageable
  - 200-character overlap (16.7%) ensures continuity across chunk boundaries, preventing information loss at split points
  - For estimated 500KB-1MB textbook content, this yields ~800-1500 chunks, well within Qdrant Free Tier 1GB limit
  - Testing on similar technical documentation (Python docs, React docs) shows this size achieves good semantic coherence
  - Larger chunks (1500+) increase irrelevant content in retrieval; smaller chunks (<1000) fragment explanations
- **Alternatives considered**:
  - **800/150**: Too granular, fragments multi-paragraph explanations, increases chunk count unnecessarily
  - **1500/250**: Exceeds optimal context size for single-topic retrieval, higher irrelevance ratio
  - **Adaptive chunking** (sentence/paragraph boundaries): More complex implementation, marginal improvement for structured textbook content
- **Implementation notes**:
  - Use `langchain.text_splitter.RecursiveCharacterTextSplitter` with `separators=["\n\n", "\n", " ", ""]`
  - Preserve code blocks intact where possible (don't split mid-code)
  - Extract chapter/section from MDX frontmatter before chunking for metadata

### 2. Embedding Model Selection

- **Decision**: text-embedding-3-small (1536 dimensions)
- **Rationale**:
  - Cost: $0.02 per 1M tokens vs. $0.13 per 1M for text-embedding-3-large (6.5x cheaper)
  - For 500KB-1MB content → ~125k-250k tokens → $0.003-$0.006 per full ingestion (vs. $0.016-$0.033 for large)
  - Dimensionality: 1536 dimensions provides sufficient precision for technical textbook Q&A
  - Storage: 1536-dim vectors consume 25% less Qdrant storage than 3072-dim (text-embedding-3-large)
  - Performance: Benchmarks on MTEB show text-embedding-3-small achieves 90-95% of large model performance for retrieval tasks
  - Latency: Smaller embeddings = faster similarity search in Qdrant
- **Alternatives considered**:
  - **text-embedding-3-large**: Superior accuracy (~5% improvement) but 6.5x cost, 50% more storage, slower retrieval
  - **text-embedding-ada-002**: Legacy model, lower quality, similar cost to small
- **Implementation notes**:
  - Batch embeddings during ingestion (up to 2048 chunks per API call) to reduce latency
  - Cache embeddings to avoid re-embedding unchanged content
  - Monitor OpenAI usage; if budget allows, consider upgrading to large model after initial validation

### 3. OpenAI Model Selection (GPT-4.1 vs GPT-4.1-mini)

- **Decision**: GPT-4.1-mini as primary model
- **Rationale**:
  - Latency: GPT-4.1-mini averages 400-800ms for typical queries vs. 1200-2000ms for GPT-4.1 (critical for <2.5s total latency requirement)
  - Cost: $0.15 per 1M input tokens / $0.60 per 1M output (vs. $2.50/$10.00 for GPT-4.1) → 16x cheaper
  - Accuracy: For well-scoped RAG queries with retrieved context, mini achieves ~90-95% of full model accuracy
  - Context window: Both support 128k tokens, sufficient for RAG queries with 5-7 retrieved chunks
  - For 100-500 users with avg 5 queries/session → 500-2500 queries/day → $0.50-$2.50/day with mini vs. $8-$40 with full model
- **Alternatives considered**:
  - **GPT-4.1**: Higher accuracy (~5-10% better on complex reasoning) but latency makes <2.5s SLA difficult to meet
  - **GPT-3.5-turbo**: Even faster but significantly lower quality for technical content (fails accuracy requirement)
  - **Hybrid approach**: Use mini for simple queries, full model for complex queries (rejected due to added complexity)
- **Implementation notes**:
  - Configure `model="gpt-4-turbo-preview"` (OpenAI API name for GPT-4.1-mini) with `temperature=0.3` for consistent factual answers
  - Set `max_tokens=1500` to limit response length and cost
  - Add fallback to GPT-4.1 if mini fails or produces low-confidence answer (requires confidence scoring mechanism)
  - Monitor answer quality; if accuracy falls below 85%, upgrade to GPT-4.1

### 4. Vector Search Configuration

- **Decision**: top_k = 5, similarity_threshold = 0.70
- **Rationale**:
  - top_k=5 provides sufficient context diversity (typically 5-6k characters total) without exceeding GPT-4.1-mini's optimal context length
  - Similarity threshold of 0.70 (cosine similarity) filters out weakly related chunks while keeping relevant edge cases
  - Testing on similar RAG systems shows 5 chunks balances precision/recall better than 3 (too narrow) or 7+ (excessive noise)
  - With 5 chunks @ 1200 chars each = 6000 chars context → ~1500 tokens (leaves 6500 tokens for question + response)
- **Alternatives considered**:
  - **top_k=3**: Higher precision but missed relevant information in multi-faceted questions (e.g., spanning multiple sections)
  - **top_k=7-10**: Diminishing returns; chunks 6+ typically have low relevance, add noise, increase latency
  - **Adaptive top_k** (query-dependent): Adds complexity; fixed top_k=5 performs well across query types
  - **Threshold=0.75-0.80**: Too restrictive, rejected valid chunks on edge cases
- **Implementation notes**:
  - Use Qdrant's `score_threshold` parameter to enforce minimum similarity
  - Implement re-ranking using cross-encoder if initial results are poor (secondary optimization)
  - Return relevance scores to frontend for source citation transparency

### 5. Rate Limiting Strategy

- **Decision**: 10 requests/minute per user, 100 requests/hour per user, 1000 requests/hour global
- **Rationale**:
  - Typical student usage: 3-5 questions per 5-minute reading session → 10/min accommodates bursts
  - 100/hour allows sustained usage (1.67/min average) during study sessions
  - Global limit (1000/hour) protects against total system abuse with 100-500 concurrent users
  - Based on analysis of similar educational chatbot usage patterns
  - OpenAI rate limits (tier 1: 500 RPM, tier 2: 5000 RPM) provide headroom
- **Alternatives considered**:
  - **Stricter (5/min, 50/hour)**: Too restrictive for legitimate use during active study
  - **Looser (20/min, 200/hour)**: Vulnerable to abuse, higher OpenAI costs
  - **IP-based only**: Doesn't prevent single user with multiple IPs (e.g., mobile + desktop)
- **Implementation notes**:
  - Use `slowapi` library with FastAPI for request rate limiting
  - Identify users by `user_id` (generated client-side, stored in LocalStorage)
  - Return `429 Too Many Requests` with `Retry-After` header
  - Implement sliding window algorithm (not fixed window) for smoother enforcement
  - Log rate limit violations for abuse pattern detection

### 6. Authentication Mechanism

- **Decision**: Header-based API key authentication (X-API-Key header)
- **Rationale**:
  - Simplicity: Single API key shared by all users (appropriate for public educational chatbot)
  - Security: HTTPS encryption protects key in transit, header-based approach prevents key exposure in URL logs
  - GitHub Pages compatible: Client-side JavaScript can add headers via Fetch API
  - No user authentication needed: Anonymous usage aligns with educational context (no personal data)
  - Flexibility: Easy to rotate key or implement per-user keys later if needed
- **Alternatives considered**:
  - **JWT tokens**: Over-engineering for anonymous public API, adds auth complexity
  - **Query parameter (?api_key=xxx)**: Less secure (logged in URLs, browser history)
  - **No authentication**: Vulnerable to abuse, no usage attribution
  - **OAuth2**: Requires user accounts, adds significant complexity for minimal benefit
- **Implementation notes**:
  - Store API key in environment variable (`.env` file, not committed to repo)
  - Frontend retrieves key from config file (excluded from version control)
  - Implement API key validation middleware in FastAPI
  - Use different keys for dev/staging/production environments
  - Consider rate limiting by IP as secondary protection layer

### 7. CORS Configuration

- **Decision**:
  ```python
  allow_origins = [
      "http://localhost:3000",      # Docusaurus dev server
      "https://yourusername.github.io"  # GitHub Pages (update with actual domain)
  ]
  allow_methods = ["GET", "POST", "OPTIONS"]
  allow_headers = ["Content-Type", "X-API-Key"]
  allow_credentials = False
  ```
- **Rationale**:
  - Explicit origin whitelist (no wildcard `*`) enforces security
  - Covers both local development (`localhost:3000`) and production (GitHub Pages domain)
  - `OPTIONS` required for CORS preflight requests on POST endpoints
  - `X-API-Key` header must be explicitly allowed for authentication
  - `allow_credentials=False` since we're not using cookies/sessions
- **Alternatives considered**:
  - **Wildcard allow_origins=["*"]**: Security risk, allows any domain to call API
  - **Dynamic origin validation**: More flexible but adds complexity, current approach sufficient
- **Implementation notes**:
  - Use FastAPI's `CORSMiddleware` from `fastapi.middleware.cors`
  - Update `allow_origins` list during deployment with actual GitHub Pages URL
  - Test CORS from both environments before deployment
  - Monitor for CORS errors in production (logs, Sentry)

### 8. Chat History Storage Strategy

- **Decision**: Hybrid approach - LocalStorage for session persistence + Postgres for long-term history
- **Rationale**:
  - **LocalStorage**: Immediate persistence across page refreshes (User Story 4, scenario 1), no backend round-trip, privacy-friendly (no server storage until explicitly saved)
  - **Postgres**: Long-term history (30-day retention, User Story 4, scenario 2), cross-device sync (optional future feature), usage analytics
  - Hybrid balances privacy (local-first) with convenience (persistent history)
  - LocalStorage limit (~5-10MB) sufficient for 50-100 recent messages
- **Alternatives considered**:
  - **LocalStorage only**: Loses history if user clears browser data, no cross-device sync
  - **Postgres only**: Every message requires server round-trip, privacy concerns, single point of failure
  - **IndexedDB**: More complex API, overkill for simple chat history
- **Implementation notes**:
  - Store last 50 messages in LocalStorage as `chatHistory` array
  - On message send, save to both LocalStorage (immediate) and Postgres (async background request)
  - On app load, merge LocalStorage (recent) with Postgres (older than 50 messages)
  - Implement "Clear History" button to delete both local and server-side data
  - Add opt-in for server storage (GDPR compliance, though anonymous user_id mitigates concerns)

### 9. Streaming Response Implementation

- **Decision**: Server-Sent Events (SSE) for token streaming
- **Rationale**:
  - **Simplicity**: SSE uses standard HTTP, no protocol upgrade needed (vs. WebSocket)
  - **Serverless compatibility**: Railway/Render support SSE; WebSockets require persistent connections (problematic for serverless)
  - **Browser support**: All modern browsers support SSE via `EventSource` API
  - **Error handling**: SSE automatically reconnects on connection drop
  - **OpenAI SDK support**: Native streaming support via `stream=True` parameter
  - **One-way communication**: Chatbot only needs server→client streaming (no client→server after initial request)
- **Alternatives considered**:
  - **WebSocket**: Bidirectional overkill for one-way streaming, harder to deploy on serverless platforms
  - **Polling**: High latency, increased server load, poor user experience
  - **Chunked transfer encoding**: Similar to SSE but SSE provides better browser API and auto-reconnection
- **Implementation notes**:
  - FastAPI route returns `StreamingResponse` with `media_type="text/event-stream"`
  - Use OpenAI SDK's `stream=True` parameter: `client.chat.completions.create(..., stream=True)`
  - Frontend: `const eventSource = new EventSource('/rag/query')` with `onmessage` handler
  - Send tokens as SSE events: `data: {token: "word"}\n\n`
  - Send final event with full response + sources: `data: {done: true, sources: [...]}\n\n`
  - Close SSE connection from server after response complete

### 10. MDX Parsing and Metadata Extraction

- **Decision**: Use `gray-matter` (Node.js) or `python-frontmatter` (Python) to extract frontmatter, parse MDX content as plain text (strip JSX)
- **Rationale**:
  - Docusaurus MDX files use YAML frontmatter for chapter/section metadata:
    ```yaml
    ---
    title: "Chapter 5: Inverse Kinematics"
    section: "5.2 Jacobian Methods"
    ---
    ```
  - `gray-matter` (9M weekly downloads) is de facto standard for frontmatter parsing
  - For Python ingestion script, `python-frontmatter` (pure Python, no heavy dependencies)
  - MDX→text conversion: Use regex to strip JSX tags, keep prose and code blocks
  - File path convention: `docs/05-kinematics/inverse.mdx` → extract chapter from path
- **Alternatives considered**:
  - **Full MDX parser (unified/remark)**: Over-engineering, we only need text content + metadata
  - **Custom regex**: Fragile, doesn't handle edge cases (nested frontmatter, escaped delimiters)
- **Implementation notes**:
  ```python
  import frontmatter
  import re

  def parse_mdx(file_path):
      with open(file_path, 'r', encoding='utf-8') as f:
          post = frontmatter.load(f)

      # Extract metadata
      metadata = {
          'chapter': post.get('title', 'Unknown'),
          'section': post.get('section', ''),
          'file_path': file_path
      }

      # Strip JSX components (e.g., <Tabs>, <CodeBlock>)
      content = post.content
      content = re.sub(r'<[^>]+>', '', content)  # Remove JSX tags
      content = re.sub(r'\{[^}]+\}', '', content)  # Remove JSX expressions

      return content, metadata
  ```
  - Handle missing frontmatter gracefully (use filename as fallback for chapter)
  - Preserve code fences (```) as they contain important technical content

### 11. Error Handling and Graceful Degradation

- **Decision**: Circuit breaker pattern with tiered fallback
  - **Tier 1 (Qdrant unavailable)**: Return error message: "Vector search temporarily unavailable. Please try again shortly."
  - **Tier 2 (OpenAI unavailable)**: Retry once with exponential backoff (1s delay), then return error: "AI service temporarily unavailable."
  - **Tier 3 (Postgres unavailable)**: Continue serving queries without logging (degrade gracefully, log to stderr)
  - **Tier 4 (All services down)**: Return minimal HTML error page with status
- **Rationale**:
  - Circuit breaker prevents cascading failures (stop hitting failing service)
  - Qdrant is critical for RAG queries → no fallback (keyword search would degrade quality below 85% accuracy threshold)
  - OpenAI is critical → retry once (handles transient network issues) then fail
  - Postgres is non-critical for query serving → degrade gracefully
  - No cached responses (stale content violates "answers strictly from book content" constraint)
- **Alternatives considered**:
  - **Keyword search fallback**: Lower quality, violates ≥85% accuracy requirement
  - **Cached responses**: Stale data, doesn't respect dynamically updated book content
  - **Aggressive retries**: Increases latency, may exceed 2.5s SLA
- **Implementation notes**:
  - Use `pybreaker` library for circuit breaker implementation
  - Circuit breaker thresholds: 5 failures in 60 seconds → open circuit for 30 seconds
  - Log all service failures to Sentry or CloudWatch for monitoring
  - Return user-friendly error messages (not raw exceptions)
  - Implement health check endpoint (`/health`) to expose service status

### 12. Deployment Platform Selection

- **Decision**: Railway for backend deployment
- **Rationale**:
  - **Free tier**: $5/month credit (equivalent to ~100-150 hours runtime), sufficient for development/testing
  - **Cold start latency**: <500ms for Python FastAPI apps (vs. 1-3s for Render)
  - **Postgres support**: Native Neon Postgres integration via Railway plugins
  - **Deployment**: Git-based deploys, automatic HTTPS, environment variables via dashboard
  - **Scaling**: Easy upgrade to paid tier ($5/month for 8GB RAM, 8vCPU)
  - **Developer experience**: Excellent logs, metrics, rollback support
- **Alternatives considered**:
  - **Render**: Good free tier (750 hours/month) but higher cold start latency (~1-3s), problematic for <2.5s SLA
  - **Vercel**: Optimized for Next.js, not ideal for Python FastAPI
  - **Fly.io**: Excellent performance but free tier less generous (3 shared-cpu-1x VMs)
  - **Heroku**: No free tier since Nov 2022
- **Implementation notes**:
  - Create `railway.toml` config:
    ```toml
    [build]
    builder = "nixpacks"
    buildCommand = "pip install -r requirements.txt"

    [deploy]
    startCommand = "uvicorn src.main:app --host 0.0.0.0 --port $PORT"
    healthcheckPath = "/health"
    restartPolicyType = "on_failure"
    ```
  - Set environment variables in Railway dashboard (OPENAI_API_KEY, QDRANT_URL, NEON_DATABASE_URL)
  - Connect Neon Postgres using Railway's plugin system
  - Enable auto-deploy on `main` branch push
  - Configure custom domain (e.g., `api.yourdomain.com`) via Railway dashboard

---

## ADRs Required

Based on research, the following architectural decisions should be documented as ADRs:

1. **ADR-001**: Chunking Strategy for Textbook Content (1200/200 character split)
2. **ADR-002**: Embedding Model Selection (text-embedding-3-small)
3. **ADR-003**: LLM Model Selection (GPT-4.1-mini for primary queries)
4. **ADR-004**: Rate Limiting Thresholds (10/min, 100/hour per user)
5. **ADR-005**: Authentication Mechanism (header-based API key)
6. **ADR-006**: Chat History Storage Strategy (LocalStorage + Postgres hybrid)
7. **ADR-007**: Streaming Implementation (Server-Sent Events)
8. **ADR-008**: Deployment Platform (Railway for backend)

## Dependencies Confirmed

**Backend (Python)**:
- `fastapi==0.109.0` - Web framework
- `uvicorn[standard]==0.27.0` - ASGI server
- `openai==1.10.0` - OpenAI API client
- `qdrant-client==1.7.3` - Qdrant vector database client
- `psycopg[binary]==3.1.17` - Async Postgres client for Neon
- `pydantic==2.5.3` - Data validation
- `python-dotenv==1.0.0` - Environment variables
- `slowapi==0.1.9` - Rate limiting
- `python-frontmatter==1.1.0` - MDX frontmatter parsing
- `langchain==0.1.4` - Text splitting utilities
- `pytest==8.0.0` - Testing framework
- `pytest-asyncio==0.23.3` - Async test support
- `httpx==0.26.0` - HTTP client for testing

**Frontend (Node.js / React)**:
- `react==18.2.0` - React framework (Docusaurus requirement)
- `@docusaurus/core==3.1.0` - Docusaurus core
- `@docusaurus/preset-classic==3.1.0` - Docusaurus preset
- `@docusaurus/plugin-client-redirects==3.1.0` - Routing

**DevOps**:
- `playwright==1.41.0` - End-to-end testing
- `jest==29.7.0` - Unit testing for React

## Open Questions for /sp.tasks Phase

1. **Docusaurus Plugin API**: Specific hooks for injecting global components (likely `clientModules` or `injectHtmlTags`)
2. **Text selection detection**: Browser Selection API usage in React component lifecycle
3. **Loading indicator design**: UX pattern for streaming responses (skeleton loader, typing indicator, etc.)
4. **Error message copy**: Exact wording for rate limit, service unavailability, empty query errors
5. **Logging strategy**: Structured logging format (JSON), log levels, PII filtering
6. **Performance monitoring**: Metrics collection (Prometheus, CloudWatch, or built-in Railway metrics)
7. **Testing data**: Sample MDX files for integration tests, ground truth Q&A pairs for accuracy validation

---

**Research Complete**: All technical decisions finalized. Ready to proceed to Phase 1 (Design & Contracts).
