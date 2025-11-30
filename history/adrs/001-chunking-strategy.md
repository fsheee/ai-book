# ADR-001: Text Chunking Strategy

**Date**: 2025-12-01
**Status**: Accepted
**Decision Makers**: Development Team
**Related**: RAG Chatbot Integration (Feature 001)

## Context

The RAG chatbot needs to break down textbook content into manageable chunks for embedding and retrieval. The chunking strategy directly impacts retrieval accuracy, response quality, and system performance.

### Requirements
- Chunks must preserve semantic meaning
- Chunks should fit within OpenAI embedding model limits (8192 tokens for text-embedding-3-small)
- Chunks must be small enough for efficient retrieval but large enough to provide meaningful context
- Chunks should minimize splitting of related content (paragraphs, code blocks, sections)

### Options Considered

1. **Fixed-size chunking (500 tokens)**: Simple but can split semantic units
2. **Sentence-based chunking**: Preserves sentences but variable size
3. **Recursive character splitting with overlap (1200/200)**: Balances size and semantic coherence
4. **Markdown-aware chunking**: Respects document structure but complex implementation

## Decision

**Selected: Recursive Character Text Splitter with 1200 character chunks and 200 character overlap**

Parameters:
- `chunk_size`: 1200 characters (~300 tokens)
- `chunk_overlap`: 200 characters (~50 tokens)
- Separators: `["\n\n", "\n", " ", ""]` (respects paragraphs, then lines, then words)

## Rationale

1. **Semantic Coherence**: 1200 characters typically contains 1-3 paragraphs, preserving topic coherence
2. **Context Preservation**: 200-character overlap ensures no information is lost at chunk boundaries
3. **Retrieval Performance**: Smaller chunks (vs 2000+) improve retrieval precision by reducing noise
4. **Token Efficiency**: ~300 tokens per chunk leaves room for 15+ chunks in context window (4096 tokens for GPT-4)
5. **Markdown Compatibility**: Recursive splitting respects paragraph breaks (`\n\n`) in MDX files

### Performance Data
Based on research.md analysis:
- Chunk size <800 chars: Too fragmented, loses context
- Chunk size >2000 chars: Too broad, reduces retrieval precision
- Overlap <100 chars: Risk of information loss
- Overlap >300 chars: Redundancy without benefit

## Consequences

### Positive
- Improved retrieval accuracy with focused semantic units
- Better LLM responses due to relevant, coherent context
- Efficient token usage (top_k=5 yields ~1500 tokens of context)
- Respects natural document structure

### Negative
- Some long code examples may be split (mitigated by overlap)
- Slightly higher storage requirements due to overlap
- Requires periodic re-chunking if parameters are tuned

## Implementation

- **File**: `backend/src/utils/chunking.py`
- **Library**: LangChain `RecursiveCharacterTextSplitter`
- **Configuration**: Defined in `backend/src/config.py` as environment variables

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1200,
    chunk_overlap=200,
    separators=["\n\n", "\n", " ", ""],
    length_function=len
)
```

## References

- [LangChain Text Splitters](https://python.langchain.com/docs/modules/data_connection/document_transformers/)
- Research: `specs/001-rag-chatbot-integration/research.md` (Section: Chunking Strategy)
- Related ADRs: ADR-002 (Embedding Model)
