# ADR-005: API Authentication Mechanism

**Date**: 2025-12-01
**Status**: Accepted
**Related**: RAG Chatbot Integration (Feature 001)

## Context

The backend API needs authentication to prevent unauthorized access while remaining simple for educational use case.

## Decision

**Header-based API key authentication with single shared key**

Implementation:
- Header: `X-API-Key: <secret>`
- Storage: Environment variable (`API_KEY` in `.env`)
- Validation: Middleware checks header on every request
- Frontend: Key embedded in build (acceptable for educational/internal use)

## Rationale

1. **Simplicity**: No user management, OAuth, or token refresh complexity
2. **Sufficient security**: Prevents casual abuse, adequate for educational context
3. **Static deployment**: Works with GitHub Pages (no backend auth service needed)
4. **Easy rotation**: Update environment variable and redeploy

### Security Considerations
- **Not suitable for**: Public commercial apps, sensitive data, multi-tenant systems
- **Acceptable for**: Educational tools, internal apps, proof-of-concepts
- **Mitigation**: Rate limiting, CORS restrictions, HTTPS only

## Implementation

```python
from fastapi import Header, HTTPException

async def api_key_auth(x_api_key: str = Header(...)):
    if x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key
```

## Future Considerations

If scaling to public use:
- Implement per-user API keys with database tracking
- Add JWT-based authentication
- Consider OAuth for institutional deployment

## References

- Research: `specs/001-rag-chatbot-integration/research.md` (Section: Authentication)
