"""
Usage log data model.
Tracks API usage, performance metrics, and errors.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class UsageLog(BaseModel):
    """Represents a single API usage log entry."""

    id: UUID = Field(default_factory=uuid4)
    chat_id: Optional[str] = Field(
        default=None,
        description="Associated chat session ID"
    )
    query_type: str = Field(
        ...,
        description="Query type: 'rag' or 'selection'"
    )
    question: str = Field(..., description="User's question")
    answer: Optional[str] = Field(
        default=None,
        description="Generated answer (null if error occurred)"
    )
    latency_ms: float = Field(..., description="Query latency in milliseconds")
    tokens_used: Optional[int] = Field(
        default=None,
        description="Total tokens used (prompt + completion)"
    )
    error_message: Optional[str] = Field(
        default=None,
        description="Error message if query failed"
    )
    ip_address: Optional[str] = Field(
        default=None,
        description="Client IP address"
    )
    user_agent: Optional[str] = Field(
        default=None,
        description="Client user agent string"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "chat_id": "chat_2024_01_15_abc123",
                "query_type": "rag",
                "question": "What are humanoid robots?",
                "answer": "Humanoid robots are robots designed with a human-like body structure...",
                "latency_ms": 1850.5,
                "tokens_used": 1250,
                "error_message": None,
                "ip_address": "192.168.1.100",
                "user_agent": "Mozilla/5.0...",
                "created_at": "2024-01-15T10:30:00Z"
            }
        }

    def is_error(self) -> bool:
        """Check if this log represents an error."""
        return self.error_message is not None

    def is_slow_query(self, threshold_ms: float = 2500.0) -> bool:
        """
        Check if query exceeded latency threshold.

        Args:
            threshold_ms: Latency threshold in milliseconds

        Returns:
            True if query was slower than threshold
        """
        return self.latency_ms > threshold_ms

    def to_dict(self) -> dict:
        """Convert to dictionary for database insertion."""
        return {
            "id": str(self.id),
            "chat_id": self.chat_id,
            "query_type": self.query_type,
            "question": self.question,
            "answer": self.answer,
            "latency_ms": self.latency_ms,
            "tokens_used": self.tokens_used,
            "error_message": self.error_message,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "created_at": self.created_at.isoformat()
        }
