"""
Data models for RAG chatbot queries and responses.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
import uuid


class ChatQuery(BaseModel):
    """Represents a user query to the RAG chatbot."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique query UUID")
    session_id: str = Field(..., description="Conversation session ID")
    user_text: str = Field(..., min_length=3, max_length=1000, description="User's question")
    selected_context: Optional[str] = Field(
        None,
        max_length=5000,
        description="User-selected text from chapter (optional)"
    )
    chapter_filter: Optional[int] = Field(None, gt=0, description="Limit search to chapter")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "q_12345678-1234-1234-1234-123456789abc",
                "session_id": "sess_abc123",
                "user_text": "What is forward kinematics?",
                "selected_context": None,
                "chapter_filter": 2,
                "timestamp": "2025-11-30T12:00:00Z"
            }
        }


class Source(BaseModel):
    """Represents a cited source from the textbook."""

    chapter_id: int = Field(..., gt=0)
    section_id: str = Field(...)
    section_title: str = Field(...)
    chunk_id: str = Field(...)
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="Similarity score")
    excerpt: Optional[str] = Field(None, max_length=500, description="Brief excerpt")


class ChatResponse(BaseModel):
    """Represents the chatbot's response to a query."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique response UUID")
    query_id: str = Field(..., description="Associated query ID")
    response_text: str = Field(..., min_length=1, description="Generated response")
    retrieved_chunks: List[str] = Field(
        default_factory=list,
        description="IDs of chunks used"
    )
    sources: List[Source] = Field(
        default_factory=list,
        description="Cited sources with section references"
    )
    confidence_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Retrieval relevance score"
    )
    generation_time_ms: int = Field(..., gt=0, description="Response latency")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    @field_validator('sources')
    @classmethod
    def validate_sources(cls, v: List[Source]) -> List[Source]:
        """Ensure sources list is valid (can be empty for general knowledge responses)."""
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "id": "r_12345678-1234-1234-1234-123456789abc",
                "query_id": "q_12345678-1234-1234-1234-123456789abc",
                "response_text": "Forward kinematics is the process of calculating the position and orientation of the robot's end-effector given the joint angles. It uses transformation matrices derived from DH parameters to compute the final pose.",
                "retrieved_chunks": ["chunk_abc123", "chunk_def456"],
                "sources": [
                    {
                        "chapter_id": 2,
                        "section_id": "ch2-forward-kinematics",
                        "section_title": "Forward Kinematics",
                        "chunk_id": "chunk_abc123",
                        "relevance_score": 0.95,
                        "excerpt": "Forward kinematics uses DH parameters to systematically compute..."
                    }
                ],
                "confidence_score": 0.92,
                "generation_time_ms": 1250,
                "timestamp": "2025-11-30T12:00:05Z"
            }
        }
