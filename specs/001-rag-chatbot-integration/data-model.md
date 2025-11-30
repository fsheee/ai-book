# Data Model: RAG Chatbot Integration

**Feature**: 001-rag-chatbot-integration
**Date**: 2025-11-30
**Status**: Complete

## Overview

The RAG chatbot system uses two primary storage systems:
1. **Neon Serverless Postgres**: Stores chat interactions, usage logs, and metadata
2. **Qdrant Cloud**: Stores vector embeddings of textbook content with metadata for semantic search

This document defines the complete data model, schemas, relationships, and access patterns.

---

## Postgres Database Schema (Neon)

### Database Configuration

```sql
-- Database: rag_chatbot_db
-- Neon Postgres version: 15+
-- Connection: postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/rag_chatbot_db

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Table: `chats`

Stores individual chat interactions between users and the chatbot.

```sql
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    query_type VARCHAR(50) NOT NULL CHECK (query_type IN ('full-rag', 'selection')),
    selected_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for efficient queries
    CONSTRAINT chk_selected_text CHECK (
        (query_type = 'selection' AND selected_text IS NOT NULL) OR
        (query_type = 'full-rag' AND selected_text IS NULL)
    )
);

-- Index for user history queries (most recent first)
CREATE INDEX idx_chats_user_created ON chats(user_id, created_at DESC);

-- Index for temporal queries (e.g., last 30 days)
CREATE INDEX idx_chats_created ON chats(created_at DESC);

-- Index for query type analysis
CREATE INDEX idx_chats_query_type ON chats(query_type);
```

**Field Descriptions**:
- `id`: Unique identifier for the chat interaction (UUIDv4)
- `user_id`: Anonymous user identifier generated client-side (e.g., UUID stored in LocalStorage)
- `question`: User's question text (max length not enforced, typically <1000 characters per frontend validation)
- `answer`: Chatbot's generated response
- `query_type`: Discriminator for query mode (`'full-rag'` or `'selection'`)
- `selected_text`: User-selected text for context-specific queries (NULL for full-rag queries)
- `created_at`: Timestamp of chat interaction (UTC)

**Validation Rules**:
- `question`: Must not be empty (enforced by NOT NULL + application validation)
- `query_type`: Must be either `'full-rag'` or `'selection'`
- `selected_text`: Must be NULL for full-rag queries, NOT NULL for selection queries (CHECK constraint)

### Table: `usage_logs`

Stores performance metrics and usage statistics for analytics and monitoring.

```sql
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    tokens_used INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    vector_search_ms INTEGER,
    embedding_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_latency_positive CHECK (latency_ms >= 0),
    CONSTRAINT chk_tokens_positive CHECK (tokens_used >= 0)
);

-- Index for temporal analytics
CREATE INDEX idx_usage_logs_created ON usage_logs(created_at DESC);

-- Index for model-specific analytics
CREATE INDEX idx_usage_logs_model ON usage_logs(model);

-- Index for performance monitoring (latency queries)
CREATE INDEX idx_usage_logs_latency ON usage_logs(latency_ms);

-- Foreign key index (automatically created but explicit for clarity)
CREATE INDEX idx_usage_logs_chat_id ON usage_logs(chat_id);
```

**Field Descriptions**:
- `id`: Unique identifier for the usage log entry
- `chat_id`: Foreign key to `chats` table (CASCADE DELETE: when chat is deleted, usage logs are also deleted)
- `model`: OpenAI model used (e.g., `'gpt-4-turbo-preview'`, `'gpt-4'`)
- `tokens_used`: Total tokens consumed (input + output)
- `latency_ms`: Total response time in milliseconds (from request received to response complete)
- `vector_search_ms`: Time spent on Qdrant vector search (NULL for selection queries)
- `embedding_ms`: Time spent generating embeddings (NULL for selection queries)
- `created_at`: Timestamp of log entry (UTC, should match `chats.created_at`)

**Validation Rules**:
- `tokens_used`: Must be non-negative
- `latency_ms`: Must be non-negative
- `vector_search_ms`, `embedding_ms`: Optional (NULL for selection queries)

### Data Retention Policy

```sql
-- Automated cleanup of old chat history (30-day retention)
-- Run daily via cron job or Neon scheduled function

CREATE OR REPLACE FUNCTION cleanup_old_chats() RETURNS void AS $$
BEGIN
    DELETE FROM chats WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule: Run daily at 2 AM UTC
-- (Implementation depends on deployment platform: Neon scheduled functions, Railway cron, or external scheduler)
```

### Query Patterns

**1. Fetch user's recent chat history (last 50 messages)**:
```sql
SELECT id, question, answer, query_type, created_at
FROM chats
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 50;
```

**2. Fetch usage statistics for last 24 hours**:
```sql
SELECT
    COUNT(*) AS total_queries,
    AVG(latency_ms) AS avg_latency_ms,
    MAX(latency_ms) AS max_latency_ms,
    SUM(tokens_used) AS total_tokens,
    AVG(tokens_used) AS avg_tokens_per_query
FROM usage_logs
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

**3. Monitor model performance (last 7 days)**:
```sql
SELECT
    model,
    COUNT(*) AS query_count,
    AVG(latency_ms) AS avg_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms,
    AVG(tokens_used) AS avg_tokens
FROM usage_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY model
ORDER BY query_count DESC;
```

**4. Identify slow queries (p99 latency threshold)**:
```sql
SELECT
    c.id,
    c.question,
    c.query_type,
    u.latency_ms,
    u.vector_search_ms,
    c.created_at
FROM chats c
JOIN usage_logs u ON c.id = u.chat_id
WHERE u.latency_ms > (
    SELECT PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms)
    FROM usage_logs
    WHERE created_at >= NOW() - INTERVAL '24 hours'
)
ORDER BY u.latency_ms DESC
LIMIT 20;
```

---

## Qdrant Vector Database Schema

### Collection: `ai_book`

Stores vector embeddings of textbook content chunks with metadata for semantic search.

**Collection Configuration**:
```python
{
    "name": "ai_book",
    "vectors": {
        "size": 1536,  # text-embedding-3-small dimension
        "distance": "Cosine"  # Cosine similarity metric
    },
    "optimizers_config": {
        "default_segment_number": 2
    },
    "replication_factor": 1,  # Free tier: single replica
    "write_consistency_factor": 1
}
```

**Payload Schema**:
```python
{
    "text": str,           # Chunk content (full text, indexed for keyword search)
    "chapter": str,        # e.g., "Chapter 5: Inverse Kinematics"
    "section": str,        # e.g., "5.2 Jacobian Methods"
    "file_path": str,      # e.g., "docs/05-kinematics/inverse.mdx"
    "chunk_index": int,    # Position in document (0-indexed)
    "total_chunks": int,   # Total chunks in source document
    "created_at": str,     # ISO 8601 timestamp (e.g., "2025-11-30T12:34:56Z")
    "content_hash": str    # MD5 hash of source file (for change detection)
}
```

**Field Descriptions**:
- `text`: The actual text content of the chunk (1200 characters max, 200-character overlap with adjacent chunks)
- `chapter`: Human-readable chapter title extracted from MDX frontmatter or file path
- `section`: Section title or subsection identifier
- `file_path`: Relative path to source MDX file (for citation links)
- `chunk_index`: Position of this chunk within its source document (enables ordered retrieval)
- `total_chunks`: Total number of chunks from the source document (useful for completeness checks)
- `created_at`: Timestamp when chunk was ingested (for tracking content updates)
- `content_hash`: MD5 hash of the source MDX file (detects when content needs re-ingestion)

**Payload Indexing**:
```python
# Enable full-text search on chunk content
{
    "text": {"type": "text", "index": True},
    "chapter": {"type": "keyword"},
    "section": {"type": "keyword"},
    "file_path": {"type": "keyword"},
    "chunk_index": {"type": "integer"},
    "total_chunks": {"type": "integer"}
}
```

### Vector Search Patterns

**1. Semantic search (RAG query)**:
```python
from qdrant_client import QdrantClient
from qdrant_client.models import SearchRequest, Filter, FieldCondition, MatchValue

client = QdrantClient(url="https://xyz.qdrant.cloud", api_key="...")

# Generate query embedding
query_embedding = openai.Embedding.create(
    input="Explain inverse kinematics",
    model="text-embedding-3-small"
).data[0].embedding

# Search for top-5 most similar chunks
results = client.search(
    collection_name="ai_book",
    query_vector=query_embedding,
    limit=5,
    score_threshold=0.70,  # Minimum cosine similarity
    with_payload=True,
    with_vectors=False  # Don't return vectors (save bandwidth)
)

# Results structure:
# [
#     ScoredPoint(
#         id="chunk_001",
#         score=0.92,
#         payload={
#             "text": "Inverse kinematics is the process...",
#             "chapter": "Chapter 5: Inverse Kinematics",
#             "section": "5.2 Jacobian Methods",
#             "file_path": "docs/05-kinematics/inverse.mdx",
#             ...
#         }
#     ),
#     ...
# ]
```

**2. Filtered search (by chapter)**:
```python
# Search within specific chapter
results = client.search(
    collection_name="ai_book",
    query_vector=query_embedding,
    limit=5,
    score_threshold=0.70,
    query_filter=Filter(
        must=[
            FieldCondition(
                key="chapter",
                match=MatchValue(value="Chapter 5: Inverse Kinematics")
            )
        ]
    ),
    with_payload=True
)
```

**3. Retrieve context for ordered chunks** (get surrounding chunks):
```python
# After finding relevant chunk, retrieve adjacent chunks for more context
relevant_chunk = results[0]
file_path = relevant_chunk.payload["file_path"]
chunk_index = relevant_chunk.payload["chunk_index"]

# Get chunks [chunk_index-1, chunk_index, chunk_index+1] from same document
adjacent_chunks = client.scroll(
    collection_name="ai_book",
    scroll_filter=Filter(
        must=[
            FieldCondition(key="file_path", match=MatchValue(value=file_path)),
            FieldCondition(
                key="chunk_index",
                range={"gte": chunk_index - 1, "lte": chunk_index + 1}
            )
        ]
    ),
    with_payload=True,
    limit=3
)
```

**4. Hybrid search (semantic + keyword)**:
```python
# Combine vector search with keyword filtering
results = client.search(
    collection_name="ai_book",
    query_vector=query_embedding,
    limit=10,
    score_threshold=0.70,
    query_filter=Filter(
        should=[  # At least one of these conditions
            FieldCondition(key="text", match={"text": "Jacobian"}),
            FieldCondition(key="text", match={"text": "inverse kinematics"})
        ]
    ),
    with_payload=True
)
```

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client-Side                              │
│  ┌───────────────────────┐                                      │
│  │   User Session        │                                      │
│  │  (LocalStorage)       │                                      │
│  │  - user_id: UUID      │                                      │
│  │  - chatHistory: []    │                                      │
│  │  - apiKey: string     │                                      │
│  └──────────┬────────────┘                                      │
└─────────────┼─────────────────────────────────────────────────── ┘
              │
              │ HTTP Request (POST /rag/query or /rag/from-selection)
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                             │
│                                                                  │
│  1. Authenticate (API key validation)                           │
│  2. Rate limit check (slowapi)                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Query Processing Pipeline                             │     │
│  │                                                        │     │
│  │  IF query_type == 'full-rag':                         │     │
│  │      ┌─────────────────────────────────────┐          │     │
│  │      │  1. Generate embedding (OpenAI)     │          │     │
│  │      │     text-embedding-3-small          │          │     │
│  │      └──────────────┬──────────────────────┘          │     │
│  │                     │                                  │     │
│  │                     ▼                                  │     │
│  │      ┌─────────────────────────────────────┐          │     │
│  │      │  2. Vector search (Qdrant)          │◄─────────┼─────┤
│  │      │     Collection: ai_book              │          │     │
│  │      │     top_k=5, threshold=0.70          │          │     │
│  │      └──────────────┬──────────────────────┘          │     │
│  │                     │                                  │     │
│  │  ELSE (selection):  │                                  │     │
│  │      context = selected_text                          │     │
│  │                     │                                  │     │
│  │                     ▼                                  │     │
│  │      ┌─────────────────────────────────────┐          │     │
│  │      │  3. Generate response (OpenAI)      │          │     │
│  │      │     gpt-4-turbo-preview              │          │     │
│  │      │     context + question               │          │     │
│  │      └──────────────┬──────────────────────┘          │     │
│  │                     │                                  │     │
│  │                     ▼                                  │     │
│  │      ┌─────────────────────────────────────┐          │     │
│  │      │  4. Store chat + usage log          │──────────┼─────┤
│  │      │     Postgres (Neon)                  │          │     │
│  │      └──────────────┬──────────────────────┘          │     │
│  │                     │                                  │     │
│  └─────────────────────┼────────────────────────────────┘     │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         │ HTTP Response (SSE stream or JSON)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Client-Side                              │
│  ┌───────────────────────┐                                      │
│  │   Chat UI             │                                      │
│  │  - Display answer     │                                      │
│  │  - Show sources       │                                      │
│  │  - Update history     │                                      │
│  └───────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Qdrant Cloud                               │
│  ┌────────────────────────────────────────────────┐          │
│  │  Collection: ai_book                           │          │
│  │  - Vectors (1536-dim, cosine similarity)       │          │
│  │  - Payloads (text, chapter, section, ...)     │          │
│  │  - Indexes (text, keywords)                    │          │
│  └────────────────────────────────────────────────┘          │
│                         ▲                                     │
│                         │                                     │
│                         │ Ingestion (POST /embed-book)       │
│                         │                                     │
│  ┌────────────────────────────────────────────────┐          │
│  │  Ingestion Pipeline (Python script)            │          │
│  │  1. Parse MDX files (frontmatter + content)    │          │
│  │  2. Chunk text (1200 chars, 200 overlap)       │          │
│  │  3. Generate embeddings (OpenAI batch)         │          │
│  │  4. Upsert to Qdrant with metadata             │          │
│  └────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Neon Postgres                              │
│  ┌────────────────────────────────────────────────┐          │
│  │  Table: chats                                  │          │
│  │  - id, user_id, question, answer, ...          │          │
│  └────────────────────────────────────────────────┘          │
│  ┌────────────────────────────────────────────────┐          │
│  │  Table: usage_logs                             │          │
│  │  - id, chat_id (FK), model, tokens, latency... │          │
│  └────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

---

## State Transitions

### Chat Interaction Lifecycle

```
[User opens chatbot]
       │
       ▼
[User types question] ──────────────────┐
       │                                │
       ▼                                │
[Submit query]                          │
       │                                │
       ├─► [Validate: empty?] ──Yes──► [Show error] ──┐
       │         │                                      │
       │        No                                      │
       ▼                                                │
[Generate user_id if not exists]                       │
       │                                                │
       ▼                                                │
[Send POST request to backend]                         │
       │                                                │
       ├─► [Backend: Rate limit check] ──Exceed──► [429 error] ──┐
       │         │                                                 │
       │        OK                                                 │
       ▼                                                           │
[Backend: Process query]                                          │
       │                                                           │
       ├──► IF full-rag:                                          │
       │      ├─► [Generate embedding]                            │
       │      ├─► [Vector search Qdrant]                          │
       │      └─► [No results?] ──Yes──► [Return "not in book"]  │
       │                │                                          │
       │               No                                          │
       │                │                                          │
       ├──► ELSE (selection):                                     │
       │      └─► [Use selected_text as context]                  │
       │                                                           │
       ▼                                                           │
[Generate response with OpenAI]                                   │
       │                                                           │
       ├─► [OpenAI error?] ──Yes──► [Retry once] ──Failed──► [Return error] ──┐
       │         │                                                               │
       │        No                                                               │
       ▼                                                                         │
[Save to Postgres: chats + usage_logs]                                          │
       │                                                                         │
       ├─► [DB error?] ──Yes──► [Log error, continue response] (degrade gracefully)
       │         │                                                               │
       │        No                                                               │
       ▼                                                                         │
[Stream response to client (SSE)]                                               │
       │                                                                         │
       ▼                                                                         │
[Client: Display response + sources]                                            │
       │                                                                         │
       ▼                                                                         │
[Save to LocalStorage]                                                          │
       │                                                                         │
       └────────────────────────► [Chatbot ready for next query] ◄──────────────┘
```

---

## Data Migration and Versioning

### Initial Setup

**1. Create Postgres tables** (run once during deployment):
```bash
python scripts/init_db.py
```

**2. Create Qdrant collection** (run once during deployment):
```bash
python scripts/init_qdrant.py
```

**3. Ingest textbook content** (run after content updates):
```bash
python scripts/ingest_docs.py --content-dir ./docs
```

### Schema Versioning

- **Version 1.0** (Current):
  - Postgres: `chats`, `usage_logs` tables as defined above
  - Qdrant: `ai_book` collection with payload schema v1

- **Future migrations**:
  - Add migration tracking table: `schema_migrations` (id, version, applied_at)
  - Use Alembic for Postgres schema migrations
  - Qdrant collection updates: Create new collection (e.g., `ai_book_v2`), migrate data, atomic switch

### Backup and Recovery

- **Postgres**: Neon provides automatic daily backups (7-day retention on free tier)
- **Qdrant**: Use Qdrant's snapshot API for periodic backups:
  ```python
  client.create_snapshot(collection_name="ai_book")
  # Download snapshot: GET /collections/{collection_name}/snapshots/{snapshot_name}
  ```

---

## Performance Considerations

### Postgres Optimization

1. **Indexing**: All critical query paths covered by indexes
2. **Connection pooling**: Use PgBouncer or Neon's built-in pooling (default 100 connections)
3. **Query optimization**: Use `EXPLAIN ANALYZE` for slow queries
4. **Partition consideration** (future): Partition `chats` and `usage_logs` by month if volume exceeds 1M rows

### Qdrant Optimization

1. **Vector quantization**: Enable scalar quantization on free tier to reduce memory (trade-off: slight accuracy reduction)
   ```python
   client.update_collection(
       collection_name="ai_book",
       quantization_config=ScalarQuantization(
           scalar=ScalarQuantizationConfig(
               type=ScalarType.INT8,
               quantile=0.99
           )
       )
   )
   ```
2. **Payload indexing**: Only index fields used in filters (`chapter`, `section`, `file_path`)
3. **Search optimization**: Use `search_params` to tune HNSW graph traversal (ef=128 default)

---

**Data Model Complete**: Ready for implementation in `/sp.tasks` phase.
