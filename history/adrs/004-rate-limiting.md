# ADR-004: Rate Limiting Strategy

**Date**: 2025-12-01
**Status**: Accepted
**Related**: RAG Chatbot Integration (Feature 001)

## Context

The chatbot API needs rate limiting to prevent abuse, manage costs, and ensure fair resource allocation across users.

## Decision

**Implement dual-tier rate limiting: 10 requests/minute per user, 100 requests/hour per user**

Implementation:
- Library: `slowapi` (Flask-Limiter port for FastAPI)
- Identifier: User ID (from request body) or IP address (fallback)
- Storage: In-memory (Redis for production scaling)

## Rationale

1. **10 requests/minute**: Prevents rapid query spam while allowing natural conversation flow
2. **100 requests/hour**: Limits sustained usage without restricting legitimate student use
3. **Per-user limits**: Fair allocation vs per-IP (which penalizes shared networks)
4. **Graceful degradation**: Returns 429 with retry-after header

### Usage Patterns Analysis
- Typical student session: 5-15 queries over 20 minutes = well under limits
- Power user: 50 queries/hour = acceptable educational use
- Abuse scenario: >100 queries/hour = blocked

## Implementation

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/rag/query")
@limiter.limit("10/minute;100/hour")
async def rag_query(...):
    ...
```

## References

- Research: `specs/001-rag-chatbot-integration/research.md` (Section: Rate Limiting)
- Library: [SlowAPI Documentation](https://slowapi.readthedocs.io/)
