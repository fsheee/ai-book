# ADR-006: Chat History Storage Strategy

**Date**: 2025-12-01
**Status**: Accepted
**Related**: RAG Chatbot Integration (Feature 001)

## Context

The chatbot needs to persist conversation history for returning users while minimizing latency and complexity.

## Decision

**Hybrid storage: LocalStorage (frontend) + Postgres (backend) with eventual consistency**

Architecture:
- **LocalStorage**: Immediate persistence, instant load, offline access
- **Postgres**: Long-term storage, cross-device sync, 30-day retention
- **Sync strategy**: Save to LocalStorage immediately, async push to backend
- **Conflict resolution**: Backend is source of truth, LocalStorage caches

## Rationale

1. **Performance**: LocalStorage provides instant access (0ms), no network latency
2. **Reliability**: Backend sync ensures data survives browser clear/device change
3. **Offline support**: Users can browse history even offline
4. **Simple implementation**: No complex sync protocols, eventual consistency is acceptable

### Trade-offs
- **Consistency**: Slight delay between devices (acceptable for chat history)
- **Storage limits**: LocalStorage ~10MB (sufficient for 1000+ messages)
- **Privacy**: Data in browser (transparent to users, they control it)

## Implementation

```javascript
// Save immediately to LocalStorage
localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages));

// Async sync to backend (fire and forget)
api.saveHistory(chatId, messages).catch(err => console.warn('Sync failed:', err));

// Load: Try LocalStorage first, fallback to backend
const messages = loadFromLocalStorage(chatId) || await api.loadHistory(chatId);
```

**Backend Schema (Postgres)**:
```sql
CREATE TABLE chats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_id TEXT REFERENCES chats(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    retrieved_chunks JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Data Retention

- **LocalStorage**: Persists until user clears browser data
- **Backend**: 30-day retention (automated cleanup via cron)
- **Justification**: Educational use doesn't require long-term history

## References

- Research: `specs/001-rag-chatbot-integration/research.md` (Section: Data Management)
- Related ADRs: ADR-004 (Rate Limiting affects history endpoints)
