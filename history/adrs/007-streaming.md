# ADR-007: Response Streaming Protocol

**Date**: 2025-12-01
**Status**: Accepted
**Related**: RAG Chatbot Integration (Feature 001)

## Context

The chatbot should display responses as they're generated (streaming) to improve perceived responsiveness and user experience.

## Decision

**Use Server-Sent Events (SSE) for streaming LLM responses**

Protocol:
- Backend: FastAPI `StreamingResponse` with async generators
- Frontend: EventSource API for consuming SSE streams
- Format: JSON-encoded events with type field (`token`, `context`, `done`, `error`)

## Rationale

1. **SSE vs WebSocket**:
   - SSE: Simpler, unidirectional (sufficient for our use case), auto-reconnect, HTTP-based
   - WebSocket: Bidirectional (overkill), complex setup, requires persistent connections

2. **SSE vs Long Polling**:
   - SSE: Native browser API, efficient, real-time
   - Long Polling: Higher latency, more server load

3. **SSE vs HTTP/2 Server Push**:
   - SSE: Wider browser support, simpler implementation
   - HTTP/2 Push: Limited browser support, more complex

### Performance Benefits
- **First token latency**: ~500ms (vs ~1500ms for non-streaming)
- **Perceived latency**: Users see progress immediately
- **UX**: Typing animation feels more natural and interactive

## Implementation

**Backend**:
```python
async def stream_rag_query(question: str) -> AsyncGenerator[str, None]:
    # Send retrieved context
    yield f"data: {json.dumps({'type': 'context', 'chunks': chunks})}\n\n"

    # Stream LLM tokens
    async for token in llm_service.generate_stream(question, context):
        yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

    # Send completion
    yield f"data: {json.dumps({'type': 'done', 'metadata': {...}})}\n\n"
```

**Frontend**:
```javascript
const eventSource = new EventSource(`${API_URL}/rag/query?stream=true`);

eventSource.addEventListener('token', (event) => {
    const data = JSON.parse(event.data);
    appendToken(data.content);
});

eventSource.addEventListener('done', (event) => {
    const data = JSON.parse(event.data);
    finalizeSources(data.metadata);
    eventSource.close();
});
```

## Limitations

- **Browser compatibility**: EventSource not supported in IE (acceptable)
- **Error handling**: Must implement custom error recovery
- **API key passing**: Cannot use custom headers with EventSource (pass as query param)

## Alternative Considered

**WebSocket**: Rejected because:
- Adds complexity (connection management, heartbeat, reconnection logic)
- Bidirectional communication not needed (only server→client streaming)
- Requires WebSocket server infrastructure (SSE works with standard HTTP)

## References

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [FastAPI Streaming Responses](https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse)
- Research: `specs/001-rag-chatbot-integration/research.md` (Section: Streaming)
- Related ADRs: ADR-003 (LLM Model supports streaming)
