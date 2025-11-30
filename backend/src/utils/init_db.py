"""
Database initialization script for Neon Postgres.
Creates tables for chat history and usage logs.
"""
import psycopg
from psycopg import sql
from src.config import settings
from src.utils.logger import logger


# SQL schema from data-model.md
CREATE_CHATS_TABLE = """
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
"""

CREATE_MESSAGES_TABLE = """
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id VARCHAR(255) NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    retrieved_chunks JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX idx_messages_chat_id (chat_id),
    INDEX idx_messages_created_at (created_at)
);
"""

CREATE_USAGE_LOGS_TABLE = """
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id VARCHAR(255),
    query_type VARCHAR(50) NOT NULL CHECK (query_type IN ('rag', 'selection')),
    question TEXT NOT NULL,
    answer TEXT,
    latency_ms FLOAT NOT NULL,
    tokens_used INTEGER,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX idx_usage_logs_created_at (created_at),
    INDEX idx_usage_logs_query_type (query_type)
);
"""

CREATE_UPDATED_AT_TRIGGER = """
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
"""


def init_database() -> None:
    """
    Initialize database by creating all required tables and triggers.

    Raises:
        psycopg.Error: If database connection or table creation fails
    """
    try:
        logger.info("Connecting to Neon Postgres database...")

        with psycopg.connect(settings.database_url) as conn:
            with conn.cursor() as cur:
                logger.info("Creating chats table...")
                cur.execute(CREATE_CHATS_TABLE)



                logger.info("Creating messages table...")
                cur.execute(CREATE_MESSAGES_TABLE)

                logger.info("Creating usage_logs table...")
                cur.execute(CREATE_USAGE_LOGS_TABLE)

                logger.info("Creating updated_at trigger...")
                cur.execute(CREATE_UPDATED_AT_TRIGGER)

                conn.commit()
                logger.info("Database initialization complete!")

    except psycopg.Error as e:
        logger.error(f"Database initialization failed: {e}")
        raise


def drop_all_tables() -> None:
    """
    Drop all tables (use with caution - for development/testing only).

    Raises:
        psycopg.Error: If database connection or table drop fails
    """
    try:
        logger.warning("Dropping all tables...")

        with psycopg.connect(settings.database_url) as conn:
            with conn.cursor() as cur:
                cur.execute("DROP TABLE IF EXISTS messages CASCADE;")
                cur.execute("DROP TABLE IF EXISTS usage_logs CASCADE;")
                cur.execute("DROP TABLE IF EXISTS chats CASCADE;")
                cur.execute("DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;")

                conn.commit()
                logger.info("All tables dropped successfully")

    except psycopg.Error as e:
        logger.error(f"Failed to drop tables: {e}")
        raise


def check_database_connection() -> bool:
    """
    Check if database connection is working.

    Returns:
        True if connection successful, False otherwise
    """
    try:
        with psycopg.connect(settings.database_url) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                result = cur.fetchone()
                return result[0] == 1
    except psycopg.Error as e:
        logger.error(f"Database connection check failed: {e}")
        return False


if __name__ == "__main__":
    # Run initialization when script is executed directly
    init_database()
