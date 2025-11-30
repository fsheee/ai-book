"""
Database service for Neon Postgres operations.
Handles chat history and usage log persistence.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import psycopg
from psycopg.rows import dict_row
from uuid import uuid4

from src.config import settings
from src.utils.logger import logger
from src.models import Chat, Message, UsageLog


class DatabaseService:
    """Service for database operations."""

    def __init__(self):
        """Initialize database service with connection string."""
        self.connection_string = settings.database_url

    def _get_connection(self):
        """Get database connection."""
        return psycopg.connect(self.connection_string, row_factory=dict_row)

    # Chat operations

    async def create_chat(self, chat_id: str) -> Chat:
        """
        Create a new chat session.

        Args:
            chat_id: Unique chat identifier

        Returns:
            Created chat instance
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO chats (chat_id)
                        VALUES (%s)
                        ON CONFLICT (chat_id) DO NOTHING
                        RETURNING id, chat_id, created_at, updated_at
                        """,
                        (chat_id,)
                    )
                    result = cur.fetchone()
                    conn.commit()

                    if result:
                        return Chat(
                            id=result["id"],
                            chat_id=result["chat_id"],
                            created_at=result["created_at"],
                            updated_at=result["updated_at"]
                        )
                    else:
                        # Chat already exists, fetch it
                        return await self.get_chat(chat_id)

        except psycopg.Error as e:
            logger.error(f"Failed to create chat: {e}")
            raise

    async def get_chat(self, chat_id: str) -> Optional[Chat]:
        """
        Get chat by ID.

        Args:
            chat_id: Chat identifier

        Returns:
            Chat instance or None if not found
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT id, chat_id, created_at, updated_at
                        FROM chats
                        WHERE chat_id = %s
                        """,
                        (chat_id,)
                    )
                    result = cur.fetchone()

                    if not result:
                        return None

                    return Chat(
                        id=result["id"],
                        chat_id=result["chat_id"],
                        created_at=result["created_at"],
                        updated_at=result["updated_at"]
                    )

        except psycopg.Error as e:
            logger.error(f"Failed to get chat: {e}")
            raise

    async def add_message(
        self,
        chat_id: str,
        role: str,
        content: str,
        retrieved_chunks: Optional[List[Dict[str, Any]]] = None
    ) -> Message:
        """
        Add a message to a chat.

        Args:
            chat_id: Chat identifier
            role: Message role ('user' or 'assistant')
            content: Message content
            retrieved_chunks: Optional retrieved chunks

        Returns:
            Created message instance
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    # Ensure chat exists
                    await self.create_chat(chat_id)

                    # Insert message
                    cur.execute(
                        """
                        INSERT INTO messages (chat_id, role, content, retrieved_chunks)
                        VALUES (%s, %s, %s, %s)
                        RETURNING id, chat_id, role, content, retrieved_chunks, created_at
                        """,
                        (chat_id, role, content, retrieved_chunks)
                    )
                    result = cur.fetchone()
                    conn.commit()

                    return Message(
                        id=result["id"],
                        chat_id=result["chat_id"],
                        role=result["role"],
                        content=result["content"],
                        retrieved_chunks=result["retrieved_chunks"],
                        created_at=result["created_at"]
                    )

        except psycopg.Error as e:
            logger.error(f"Failed to add message: {e}")
            raise

    async def get_chat_history(
        self,
        chat_id: str,
        max_messages: int = 10
    ) -> List[Message]:
        """
        Get recent chat history.

        Args:
            chat_id: Chat identifier
            max_messages: Maximum number of messages to retrieve

        Returns:
            List of messages in chronological order
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT id, chat_id, role, content, retrieved_chunks, created_at
                        FROM messages
                        WHERE chat_id = %s
                        ORDER BY created_at DESC
                        LIMIT %s
                        """,
                        (chat_id, max_messages)
                    )
                    results = cur.fetchall()

                    # Reverse to get chronological order
                    messages = [
                        Message(
                            id=row["id"],
                            chat_id=row["chat_id"],
                            role=row["role"],
                            content=row["content"],
                            retrieved_chunks=row["retrieved_chunks"],
                            created_at=row["created_at"]
                        )
                        for row in reversed(results)
                    ]

                    return messages

        except psycopg.Error as e:
            logger.error(f"Failed to get chat history: {e}")
            raise

    # Usage log operations

    async def log_usage(self, usage_log: UsageLog) -> None:
        """
        Log API usage.

        Args:
            usage_log: UsageLog instance to persist
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO usage_logs (
                            chat_id, query_type, question, answer,
                            latency_ms, tokens_used, error_message,
                            ip_address, user_agent
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            usage_log.chat_id,
                            usage_log.query_type,
                            usage_log.question,
                            usage_log.answer,
                            usage_log.latency_ms,
                            usage_log.tokens_used,
                            usage_log.error_message,
                            usage_log.ip_address,
                            usage_log.user_agent
                        )
                    )
                    conn.commit()

        except psycopg.Error as e:
            logger.error(f"Failed to log usage: {e}")
            # Don't raise - usage logging should not block main operations

    async def get_usage_stats(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get usage statistics.

        Args:
            start_date: Start date for statistics
            end_date: End date for statistics

        Returns:
            Dictionary with usage statistics
        """
        try:
            if not start_date:
                start_date = datetime.utcnow() - timedelta(days=30)
            if not end_date:
                end_date = datetime.utcnow()

            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT
                            COUNT(*) as total_queries,
                            COUNT(DISTINCT chat_id) as unique_chats,
                            AVG(latency_ms) as avg_latency_ms,
                            MAX(latency_ms) as max_latency_ms,
                            SUM(tokens_used) as total_tokens,
                            COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as error_count
                        FROM usage_logs
                        WHERE created_at BETWEEN %s AND %s
                        """,
                        (start_date, end_date)
                    )
                    result = cur.fetchone()

                    return {
                        "total_queries": result["total_queries"] or 0,
                        "unique_chats": result["unique_chats"] or 0,
                        "avg_latency_ms": float(result["avg_latency_ms"] or 0),
                        "max_latency_ms": float(result["max_latency_ms"] or 0),
                        "total_tokens": result["total_tokens"] or 0,
                        "error_count": result["error_count"] or 0,
                        "start_date": start_date.isoformat(),
                        "end_date": end_date.isoformat()
                    }

        except psycopg.Error as e:
            logger.error(f"Failed to get usage stats: {e}")
            raise
