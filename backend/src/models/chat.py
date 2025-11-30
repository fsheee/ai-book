"""
Chat and message data models.
Represents chat sessions and conversation messages.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class Message(BaseModel):
    """Represents a single message in a chat conversation."""

    id: UUID = Field(default_factory=uuid4)
    chat_id: str = Field(..., description="Chat session ID")
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content text")
    retrieved_chunks: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Retrieved document chunks (for assistant messages)"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "chat_id": "chat_2024_01_15_abc123",
                "role": "user",
                "content": "What are humanoid robots?",
                "retrieved_chunks": None,
                "created_at": "2024-01-15T10:30:00Z"
            }
        }


class Chat(BaseModel):
    """Represents a chat session with multiple messages."""

    id: UUID = Field(default_factory=uuid4)
    chat_id: str = Field(..., description="Unique chat session identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    messages: List[Message] = Field(
        default_factory=list,
        description="List of messages in this chat"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "chat_id": "chat_2024_01_15_abc123",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:35:00Z",
                "messages": []
            }
        }

    def add_message(self, role: str, content: str, retrieved_chunks: Optional[List[Dict[str, Any]]] = None) -> Message:
        """
        Add a new message to the chat.

        Args:
            role: Message role ('user' or 'assistant')
            content: Message content
            retrieved_chunks: Optional retrieved chunks for assistant messages

        Returns:
            Created message instance
        """
        message = Message(
            chat_id=self.chat_id,
            role=role,
            content=content,
            retrieved_chunks=retrieved_chunks
        )
        self.messages.append(message)
        self.updated_at = datetime.utcnow()
        return message

    def get_history(self, max_messages: int = 10) -> List[Dict[str, str]]:
        """
        Get recent chat history formatted for LLM context.

        Args:
            max_messages: Maximum number of recent messages to return

        Returns:
            List of message dicts with 'role' and 'content'
        """
        recent_messages = self.messages[-max_messages:] if len(self.messages) > max_messages else self.messages
        return [
            {"role": msg.role, "content": msg.content}
            for msg in recent_messages
        ]
