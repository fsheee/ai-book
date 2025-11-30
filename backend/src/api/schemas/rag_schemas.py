"""
Pydantic schemas for RAG API request/response validation.
Defines data models for all API endpoints.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime


class RagQueryRequest(BaseModel):
    """Request schema for full-book RAG query."""

    question: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="User's question to answer using RAG"
    )
    chat_id: Optional[str] = Field(
        default=None,
        description="Optional chat session ID for history tracking"
    )
    stream: bool = Field(
        default=True,
        description="Enable streaming response via SSE"
    )

    @validator("question")
    def validate_question(cls, v):
        """Validate question is not empty or just whitespace."""
        if not v.strip():
            raise ValueError("Question cannot be empty or whitespace only")
        return v.strip()


class SelectionQueryRequest(BaseModel):
    """Request schema for selection-based query."""

    question: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="User's question about the selected text"
    )
    selected_text: str = Field(
        ...,
        min_length=50,
        max_length=8000,
        description="Text selected by user from the book"
    )
    chat_id: Optional[str] = Field(
        default=None,
        description="Optional chat session ID for history tracking"
    )
    stream: bool = Field(
        default=True,
        description="Enable streaming response via SSE"
    )

    @validator("question")
    def validate_question(cls, v):
        """Validate question is not empty or just whitespace."""
        if not v.strip():
            raise ValueError("Question cannot be empty or whitespace only")
        return v.strip()

    @validator("selected_text")
    def validate_selected_text(cls, v):
        """Validate selected text meets length requirements."""
        text = v.strip()
        if len(text) < 50:
            raise ValueError("Selected text must be at least 50 characters")
        if len(text) > 8000:
            raise ValueError("Selected text cannot exceed 8000 characters")
        return text


class RetrievedChunk(BaseModel):
    """Schema for a retrieved document chunk."""

    text: str = Field(..., description="Chunk text content")
    score: float = Field(..., description="Similarity score (0.0-1.0)")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Chunk metadata (chapter, section, etc.)"
    )


class RagQueryResponse(BaseModel):
    """Response schema for RAG query (non-streaming)."""

    answer: str = Field(..., description="Generated answer text")
    chat_id: str = Field(..., description="Chat session ID")
    retrieved_chunks: List[RetrievedChunk] = Field(
        default_factory=list,
        description="Retrieved document chunks used for answer"
    )
    latency_ms: float = Field(..., description="Query latency in milliseconds")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Response timestamp"
    )


class RagStreamChunk(BaseModel):
    """Schema for streaming response chunks (SSE)."""

    type: str = Field(
        ...,
        description="Chunk type: 'token', 'context', 'metadata', 'done', 'error'"
    )
    content: Optional[str] = Field(
        default=None,
        description="Content for 'token' and 'error' types"
    )
    retrieved_chunks: Optional[List[RetrievedChunk]] = Field(
        default=None,
        description="Retrieved chunks for 'context' type"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Metadata for 'metadata' and 'done' types"
    )


class HealthResponse(BaseModel):
    """Response schema for health check endpoint."""

    status: str = Field(default="healthy", description="Service health status")
    version: str = Field(default="1.0.0", description="API version")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Health check timestamp"
    )
    services: Dict[str, str] = Field(
        default_factory=dict,
        description="Status of dependent services (db, qdrant, openai)"
    )


class ErrorResponse(BaseModel):
    """Response schema for error responses."""

    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(
        default=None,
        description="Optional error code for client handling"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Error timestamp"
    )
