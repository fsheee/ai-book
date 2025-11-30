"""
Data models for RAG content chunks and embeddings.
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator
import uuid


class ContentChunk(BaseModel):
    """Represents a semantically meaningful text chunk for RAG retrieval."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique chunk UUID")
    chapter_id: int = Field(..., gt=0, description="Source chapter")
    section_id: str = Field(..., description="Source section identifier")
    subsection_id: Optional[str] = Field(None, description="Source subsection (if applicable)")
    text: str = Field(..., min_length=50, max_length=2000, description="Chunk text content")
    embedding_vector: List[float] = Field(..., description="1536-dimensional embedding")
    token_count: int = Field(..., gt=0, description="Number of tokens in text")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional context")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator('embedding_vector')
    @classmethod
    def validate_embedding_dimensions(cls, v: List[float]) -> List[float]:
        """Ensure embedding has exactly 1536 dimensions (OpenAI text-embedding-3-small)."""
        if len(v) != 1536:
            raise ValueError(f"Embedding must have 1536 dimensions, got {len(v)}")
        return v

    @field_validator('metadata')
    @classmethod
    def validate_metadata_fields(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure required metadata fields are present."""
        required_fields = ['start_char', 'end_char', 'difficulty', 'tags']
        for field in required_fields:
            if field not in v:
                raise ValueError(f"Metadata must contain '{field}' field")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "id": "chunk_12345678-1234-1234-1234-123456789abc",
                "chapter_id": 2,
                "section_id": "ch2-forward-kinematics",
                "subsection_id": "ch2-fk-dh-parameters",
                "text": "Forward kinematics uses the DH parameter convention to compute the position and orientation of the end-effector given joint angles. The DH parameters consist of four quantities: link length (a), link twist (α), link offset (d), and joint angle (θ).",
                "embedding_vector": [0.123] * 1536,  # Placeholder
                "token_count": 85,
                "metadata": {
                    "start_char": 0,
                    "end_char": 500,
                    "difficulty": "intermediate",
                    "tags": ["kinematics", "dh-parameters"]
                }
            }
        }
