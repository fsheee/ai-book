"""
RAG query endpoints.
Handles full-book RAG queries and selection-based queries with streaming support.
"""
import time
import json
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from uuid import uuid4

from src.config import settings
from src.utils.logger import logger
from src.api.middleware.auth import api_key_auth
from src.api.middleware.rate_limit import limiter, get_rate_limit_string
from src.api.schemas import (
    RagQueryRequest,
    SelectionQueryRequest,
    RagQueryResponse,
    RagStreamChunk,
    RetrievedChunk,
    ErrorResponse
)
from src.services.embedding import EmbeddingService
from src.services.vectorstore import VectorStoreService
from src.services.llm import LLMService
from src.services.database import DatabaseService
from src.models import UsageLog


router = APIRouter(prefix="/rag", tags=["RAG"])

# Initialize services
embedding_service = EmbeddingService()
vectorstore_service = VectorStoreService()
llm_service = LLMService()
database_service = DatabaseService()


async def _perform_rag_query(
    question: str,
    chat_id: str,
    request: Request
) -> tuple[str, list, dict, float]:
    """
    Core RAG query logic (non-streaming).

    Returns:
        Tuple of (answer, retrieved_chunks, usage, latency_ms)
    """
    start_time = time.time()
    performance_metrics = {}

    try:
        # 1. Generate query embedding
        logger.info(f"Generating embedding for query: {question[:50]}...")
        embedding_start = time.time()
        query_vector = await embedding_service.embed_text(question)
        embedding_ms = (time.time() - embedding_start) * 1000
        performance_metrics['embedding_ms'] = embedding_ms
        logger.info(f"Embedding generation took {embedding_ms:.2f}ms")

        # 2. Search Qdrant for relevant chunks
        logger.info(f"Searching vector store (top_k={settings.top_k})...")
        search_start = time.time()
        retrieved_docs = await vectorstore_service.search(
            query_vector=query_vector,
            limit=settings.top_k,
            score_threshold=settings.similarity_threshold
        )
        vector_search_ms = (time.time() - search_start) * 1000
        performance_metrics['vector_search_ms'] = vector_search_ms
        logger.info(f"Vector search took {vector_search_ms:.2f}ms")

        if not retrieved_docs:
            logger.warning("No relevant chunks found above similarity threshold")
            retrieved_chunks = []
            context_chunks = []
        else:
            # Convert to API response format
            retrieved_chunks = [
                RetrievedChunk(
                    text=doc.text,
                    score=doc.metadata.get('score', 0.0),
                    metadata={k: v for k, v in doc.metadata.items() if k != 'score'}
                )
                for doc in retrieved_docs
            ]

            # Convert to LLM context format
            context_chunks = [
                {
                    'text': doc.text,
                    'metadata': doc.metadata
                }
                for doc in retrieved_docs
            ]

        # 3. Get chat history
        chat_history = []
        try:
            messages = await database_service.get_chat_history(chat_id, max_messages=5)
            chat_history = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]
        except Exception as e:
            logger.warning(f"Could not load chat history: {e}")

        # 4. Generate LLM response
        logger.info("Generating LLM response...")
        llm_start = time.time()
        result = await llm_service.generate_answer(
            question=question,
            context_chunks=context_chunks if context_chunks else None,
            chat_history=chat_history if chat_history else None
        )
        llm_generation_ms = (time.time() - llm_start) * 1000
        performance_metrics['llm_generation_ms'] = llm_generation_ms
        logger.info(f"LLM generation took {llm_generation_ms:.2f}ms")

        answer = result['answer']
        usage = result['usage']

        # 5. Save to database
        latency_ms = (time.time() - start_time) * 1000
        performance_metrics['total_latency_ms'] = latency_ms

        # Log performance breakdown
        logger.info(f"Performance breakdown - Embedding: {embedding_ms:.2f}ms, "
                   f"Vector search: {vector_search_ms:.2f}ms, "
                   f"LLM generation: {llm_generation_ms:.2f}ms, "
                   f"Total: {latency_ms:.2f}ms")

        try:
            # Save user message
            await database_service.add_message(
                chat_id=chat_id,
                role="user",
                content=question
            )

            # Save assistant message with retrieved chunks
            await database_service.add_message(
                chat_id=chat_id,
                role="assistant",
                content=answer,
                retrieved_chunks=[chunk.dict() for chunk in retrieved_chunks]
            )

            # Log usage
            usage_log = UsageLog(
                chat_id=chat_id,
                query_type="rag",
                question=question,
                answer=answer,
                latency_ms=latency_ms,
                tokens_used=usage['total_tokens'],
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get('user-agent')
            )
            await database_service.log_usage(usage_log)

        except Exception as e:
            logger.error(f"Failed to save to database: {e}")

        logger.info(f"RAG query completed in {latency_ms:.2f}ms")
        return answer, retrieved_chunks, usage, latency_ms

    except Exception as e:
        logger.error(f"RAG query failed: {e}")
        raise


@router.post("/query", response_model=RagQueryResponse)
@limiter.limit(get_rate_limit_string())
async def rag_query(
    request_data: RagQueryRequest,
    request: Request,
    api_key: str = Depends(api_key_auth)
):
    """
    Perform RAG query on entire textbook.

    Retrieves relevant chunks using vector search and generates answer using LLM.
    """
    try:
        # Generate or use provided chat_id
        chat_id = request_data.chat_id or f"chat_{uuid4().hex[:16]}"

        # Handle streaming vs non-streaming
        if request_data.stream:
            return StreamingResponse(
                _stream_rag_query(request_data.question, chat_id, request),
                media_type="text/event-stream"
            )

        # Non-streaming response
        answer, retrieved_chunks, usage, latency_ms = await _perform_rag_query(
            question=request_data.question,
            chat_id=chat_id,
            request=request
        )

        return RagQueryResponse(
            answer=answer,
            chat_id=chat_id,
            retrieved_chunks=retrieved_chunks,
            latency_ms=latency_ms
        )

    except Exception as e:
        logger.error(f"RAG query endpoint failed: {e}")
        raise


async def _stream_rag_query(
    question: str,
    chat_id: str,
    request: Request
) -> AsyncGenerator[str, None]:
    """
    Stream RAG query response via Server-Sent Events.

    Yields SSE-formatted events with type and data.
    """
    start_time = time.time()

    try:
        # 1. Generate query embedding
        query_vector = await embedding_service.embed_text(question)

        # 2. Search vector store
        retrieved_docs = await vectorstore_service.search(
            query_vector=query_vector,
            limit=settings.top_k,
            score_threshold=settings.similarity_threshold
        )

        # Send retrieved chunks
        if retrieved_docs:
            retrieved_chunks = [
                RetrievedChunk(
                    text=doc.text,
                    score=doc.metadata.get('score', 0.0),
                    metadata={k: v for k, v in doc.metadata.items() if k != 'score'}
                )
                for doc in retrieved_docs
            ]

            context_event = RagStreamChunk(
                type="context",
                retrieved_chunks=retrieved_chunks
            )
            yield f"data: {context_event.json()}\n\n"

            context_chunks = [
                {'text': doc.text, 'metadata': doc.metadata}
                for doc in retrieved_docs
            ]
        else:
            context_chunks = []

        # 3. Get chat history
        chat_history = []
        try:
            messages = await database_service.get_chat_history(chat_id, max_messages=5)
            chat_history = [{"role": msg.role, "content": msg.content} for msg in messages]
        except Exception as e:
            logger.warning(f"Could not load chat history: {e}")

        # 4. Stream LLM response
        full_answer = ""
        async for token in llm_service.generate_answer_stream(
            question=question,
            context_chunks=context_chunks if context_chunks else None,
            chat_history=chat_history if chat_history else None
        ):
            full_answer += token

            token_event = RagStreamChunk(
                type="token",
                content=token
            )
            yield f"data: {token_event.json()}\n\n"

        # 5. Send completion metadata
        latency_ms = (time.time() - start_time) * 1000

        done_event = RagStreamChunk(
            type="done",
            metadata={
                "chat_id": chat_id,
                "latency_ms": latency_ms
            }
        )
        yield f"data: {done_event.json()}\n\n"

        # 6. Save to database (async, don't block streaming)
        try:
            await database_service.add_message(chat_id=chat_id, role="user", content=question)
            await database_service.add_message(
                chat_id=chat_id,
                role="assistant",
                content=full_answer,
                retrieved_chunks=[chunk.dict() for chunk in retrieved_chunks] if retrieved_docs else None
            )

            usage_log = UsageLog(
                chat_id=chat_id,
                query_type="rag",
                question=question,
                answer=full_answer,
                latency_ms=latency_ms,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get('user-agent')
            )
            await database_service.log_usage(usage_log)

        except Exception as e:
            logger.error(f"Failed to save streaming query to database: {e}")

    except Exception as e:
        logger.error(f"Streaming RAG query failed: {e}")
        error_event = RagStreamChunk(
            type="error",
            content=str(e)
        )
        yield f"data: {error_event.json()}\n\n"


@router.post("/from-selection")
@limiter.limit(get_rate_limit_string())
async def selection_query(
    request_data: SelectionQueryRequest,
    request: Request,
    api_key: str = Depends(api_key_auth)
):
    """
    Perform query on user-selected text.

    Uses selected text as context instead of RAG retrieval.
    """
    try:
        chat_id = request_data.chat_id or f"chat_{uuid4().hex[:16]}"

        if request_data.stream:
            return StreamingResponse(
                _stream_selection_query(
                    question=request_data.question,
                    selected_text=request_data.selected_text,
                    chat_id=chat_id,
                    request=request
                ),
                media_type="text/event-stream"
            )

        # Non-streaming response
        start_time = time.time()

        # Get chat history
        chat_history = []
        try:
            messages = await database_service.get_chat_history(chat_id, max_messages=5)
            chat_history = [{"role": msg.role, "content": msg.content} for msg in messages]
        except Exception as e:
            logger.warning(f"Could not load chat history: {e}")

        # Generate response
        result = await llm_service.generate_answer(
            question=request_data.question,
            selected_text=request_data.selected_text,
            chat_history=chat_history
        )

        latency_ms = (time.time() - start_time) * 1000

        # Save to database
        try:
            await database_service.add_message(
                chat_id=chat_id,
                role="user",
                content=request_data.question
            )
            await database_service.add_message(
                chat_id=chat_id,
                role="assistant",
                content=result['answer']
            )

            usage_log = UsageLog(
                chat_id=chat_id,
                query_type="selection",
                question=request_data.question,
                answer=result['answer'],
                latency_ms=latency_ms,
                tokens_used=result['usage']['total_tokens'],
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get('user-agent')
            )
            await database_service.log_usage(usage_log)

        except Exception as e:
            logger.error(f"Failed to save selection query to database: {e}")

        return RagQueryResponse(
            answer=result['answer'],
            chat_id=chat_id,
            retrieved_chunks=[],  # No RAG retrieval for selection queries
            latency_ms=latency_ms
        )

    except Exception as e:
        logger.error(f"Selection query endpoint failed: {e}")
        raise


async def _stream_selection_query(
    question: str,
    selected_text: str,
    chat_id: str,
    request: Request
) -> AsyncGenerator[str, None]:
    """Stream selection query response via SSE."""
    start_time = time.time()

    try:
        # Get chat history
        chat_history = []
        try:
            messages = await database_service.get_chat_history(chat_id, max_messages=5)
            chat_history = [{"role": msg.role, "content": msg.content} for msg in messages]
        except Exception as e:
            logger.warning(f"Could not load chat history: {e}")

        # Stream LLM response
        full_answer = ""
        async for token in llm_service.generate_answer_stream(
            question=question,
            selected_text=selected_text,
            chat_history=chat_history
        ):
            full_answer += token

            token_event = RagStreamChunk(type="token", content=token)
            yield f"data: {token_event.json()}\n\n"

        # Send completion
        latency_ms = (time.time() - start_time) * 1000

        done_event = RagStreamChunk(
            type="done",
            metadata={"chat_id": chat_id, "latency_ms": latency_ms}
        )
        yield f"data: {done_event.json()}\n\n"

        # Save to database
        try:
            await database_service.add_message(chat_id=chat_id, role="user", content=question)
            await database_service.add_message(chat_id=chat_id, role="assistant", content=full_answer)

            usage_log = UsageLog(
                chat_id=chat_id,
                query_type="selection",
                question=question,
                answer=full_answer,
                latency_ms=latency_ms,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get('user-agent')
            )
            await database_service.log_usage(usage_log)

        except Exception as e:
            logger.error(f"Failed to save streaming selection query: {e}")

    except Exception as e:
        logger.error(f"Streaming selection query failed: {e}")
        error_event = RagStreamChunk(type="error", content=str(e))
        yield f"data: {error_event.json()}\n\n"


@router.get("/history")
@limiter.limit(get_rate_limit_string())
async def get_chat_history(
    chat_id: str,
    max_messages: int = 50,
    request: Request = None,
    api_key: str = Depends(api_key_auth)
):
    """
    Retrieve chat history for a given chat_id.

    Returns the most recent messages in chronological order (oldest first).

    Args:
        chat_id: Chat session identifier
        max_messages: Maximum number of messages to return (default: 50, max: 100)

    Returns:
        List of chat messages with metadata
    """
    try:
        # Validate max_messages
        max_messages = min(max_messages, 100)

        # Get messages from database
        messages = await database_service.get_chat_history(
            chat_id=chat_id,
            max_messages=max_messages
        )

        # Format response
        formatted_messages = []
        for msg in messages:
            formatted_msg = {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat() if hasattr(msg, 'created_at') else None,
                "retrieved_chunks": msg.retrieved_chunks if hasattr(msg, 'retrieved_chunks') else None,
            }
            formatted_messages.append(formatted_msg)

        return {
            "chat_id": chat_id,
            "messages": formatted_messages,
            "total": len(formatted_messages),
        }

    except Exception as e:
        logger.error(f"Failed to retrieve chat history: {e}")
        raise
