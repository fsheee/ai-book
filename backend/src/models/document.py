"""
Document chunk data model.
Represents a chunk of text from the book with embeddings.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class DocumentChunk(BaseModel):
    """Represents a chunk of document text with metadata and embeddings."""

    id: UUID = Field(default_factory=uuid4, description="Unique chunk identifier")
    text: str = Field(..., description="Chunk text content")
    embedding: Optional[List[float]] = Field(
        default=None,
        description="Vector embedding (1536-dim for text-embedding-3-small)"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Chunk metadata (chapter, section, page, etc.)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "text": "Humanoid robots are robots with a human-like body structure...",
                "embedding": [0.123, -0.456, 0.789],  # Truncated for example
                "metadata": {
                    "chapter": "Chapter 1: Introduction",
                    "section": "1.2 What are Humanoid Robots?",
                    "chunk_index": 0,
                    "chunk_count": 5,
                    "source_file": "chapter1.md"
                }
            }
        }

    def to_qdrant_point(self, point_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Convert to Qdrant point format for insertion.

        Args:
            point_id: Optional custom point ID (defaults to chunk UUID)

        Returns:
            Dictionary in Qdrant point format
        """
        if not self.embedding:
            raise ValueError("Chunk must have embedding to convert to Qdrant point")

        return {
            "id": point_id or str(self.id),
            "vector": self.embedding,
            "payload": {
                "text": self.text,
                **self.metadata
            }
        }

    @classmethod
    def from_qdrant_point(cls, point: Any) -> "DocumentChunk":
        """
        Create DocumentChunk from Qdrant point.

        Args:
            point: Qdrant point object

        Returns:
            DocumentChunk instance
        """
        payload = point.payload
        text = payload.pop("text", "")

        return cls(
            id=UUID(point.id) if isinstance(point.id, str) else uuid4(),
            text=text,
            embedding=point.vector,
            metadata=payload
        )

    def get_context_snippet(self, max_length: int = 200) -> str:
        """
        Get truncated text snippet for display.

        Args:
            max_length: Maximum length of snippet

        Returns:
            Truncated text with ellipsis if needed
        """
        if len(self.text) <= max_length:
            return self.text

        return self.text[:max_length].rsplit(" ", 1)[0] + "..."
