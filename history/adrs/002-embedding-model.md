# ADR-002: Embedding Model Selection

**Date**: 2025-12-01
**Status**: Accepted
**Decision Makers**: Development Team
**Related**: RAG Chatbot Integration (Feature 001)

## Context

The RAG system requires an embedding model to convert text chunks into vector representations for semantic search. The embedding model choice impacts retrieval accuracy, cost, and latency.

### Requirements
- High semantic understanding for technical robotics content
- Reasonable cost per embedding operation
- Fast inference (<200ms per query embedding)
- Compatibility with Qdrant vector database
- Support for batch operations during ingestion

### Options Considered

1. **text-embedding-ada-002** (OpenAI legacy): Proven, but older technology
2. **text-embedding-3-small** (OpenAI): Newer, better performance, lower cost
3. **text-embedding-3-large** (OpenAI): Highest quality, but expensive and slower
4. **sentence-transformers/all-MiniLM-L6-v2**: Open source, self-hosted, free but lower quality

## Decision

**Selected: OpenAI text-embedding-3-small**

Specifications:
- Dimensions: 1536
- Max input: 8192 tokens
- Cost: $0.02 per 1M tokens
- Performance: ~30ms average latency

## Rationale

1. **Cost Efficiency**: 5x cheaper than ada-002 ($0.02 vs $0.10 per 1M tokens)
2. **Performance**: Superior to ada-002 on MTEB benchmark (62.3% vs 61.0%)
3. **Speed**: Fast enough for real-time query embedding (<50ms typically)
4. **Quality**: Excellent semantic understanding for technical content
5. **Production Ready**: Hosted service, no infrastructure management needed

### Cost Analysis (for 10,000-page textbook)
- Textbook size: ~5M characters → ~1.25M tokens
- Embedding cost: ~$0.025 for full ingestion
- Query cost: ~$0.02 per 1000 queries
- **Total estimated cost**: <$5/month for 10K queries

### Compared to Alternatives
- **vs text-embedding-3-large**: 3-4x more expensive, marginally better quality (not worth cost)
- **vs open source models**: Lower quality, requires infrastructure, higher operational overhead
- **vs ada-002**: text-embedding-3-small is both cheaper and better performing

## Consequences

### Positive
- Low operational cost for both ingestion and queries
- Excellent retrieval accuracy for technical content
- No infrastructure management required
- Easy to upgrade to text-embedding-3-large if needed

### Negative
- Vendor lock-in to OpenAI
- Requires API key management
- Network dependency (no offline operation)
- Rate limits (3000 RPM on tier 1, sufficient for our use case)

## Implementation

- **Service**: `backend/src/services/embedding.py`
- **Configuration**: `EMBEDDING_MODEL=text-embedding-3-small` in `.env`
- **Batch Size**: 2048 tokens per API call (max allowed)

```python
from openai import OpenAI

client = OpenAI(api_key=settings.openai_api_key)

def embed_text(text: str) -> List[float]:
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding
```

## Monitoring

- Track embedding latency in `usage_logs` table
- Monitor monthly OpenAI costs via dashboard
- Alert if latency exceeds 200ms (p95)

## Future Considerations

- If costs become prohibitive (>$50/month), consider text-embedding-3-large with lower ingestion frequency
- If offline operation is required, explore fine-tuned sentence-transformers models
- Monitor OpenAI model releases for potential upgrades

## References

- [OpenAI Embeddings Documentation](https://platform.openai.com/docs/guides/embeddings)
- [text-embedding-3 Announcement](https://openai.com/blog/new-embedding-models-and-api-updates)
- Research: `specs/001-rag-chatbot-integration/research.md` (Section: Embedding Models)
- Related ADRs: ADR-001 (Chunking Strategy), ADR-003 (LLM Model)
