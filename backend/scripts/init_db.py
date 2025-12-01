"""
Initialize Postgres Database

Creates all necessary tables for the RAG chatbot:
- chats: Chat session metadata
- messages: Individual messages in conversations
- usage_logs: Performance and usage tracking

Usage:
    python scripts/init_db.py
"""

import os
import sys
from pathlib import Path

# Add backend/src to Python path
backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root / "src"))

import asyncpg
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in .env file")
    sys.exit(1)

# SQL schema based on data-model.md
CREATE_TABLES_SQL = """
-- Chats table
CREATE TABLE IF NOT EXISTS chats (
    chat_id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    query_type VARCHAR(20) CHECK (query_type IN ('rag', 'selection')),
    sources JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
    log_id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    chat_id UUID REFERENCES chats(chat_id) ON DELETE SET NULL,
    query_type VARCHAR(20) NOT NULL CHECK (query_type IN ('rag', 'selection')),
    question TEXT NOT NULL,
    answer TEXT,
    model_used VARCHAR(100),
    tokens_used INTEGER,
    embedding_ms INTEGER,
    vector_search_ms INTEGER,
    llm_generation_ms INTEGER,
    total_latency_ms INTEGER,
    num_sources INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_query_type ON usage_logs(query_type);
"""


async def init_database():
    """Initialize database tables"""
    print(f"Connecting to database...")
    print(f"Database URL: {DATABASE_URL[:50]}...")  # Show first 50 chars only

    try:
        # Connect to database
        conn = await asyncpg.connect(DATABASE_URL)
        print("[OK] Connected to Postgres database")

        # Execute schema creation
        print("\nCreating tables...")
        await conn.execute(CREATE_TABLES_SQL)
        print("[OK] Tables created successfully")

        # Verify tables exist
        tables = await conn.fetch("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)

        print("\n[OK] Database schema initialized successfully!")
        print("\nTables created:")
        for table in tables:
            print(f"  - {table['table_name']}")

        # Check table row counts
        print("\nTable statistics:")
        for table in tables:
            count = await conn.fetchval(f"SELECT COUNT(*) FROM {table['table_name']}")
            print(f"  - {table['table_name']}: {count} rows")

        await conn.close()
        print("\n[OK] Database initialization complete!")
        return True

    except Exception as e:
        print(f"\n[ERROR] Database initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import asyncio

    print("=" * 60)
    print("PostgreSQL Database Initialization")
    print("=" * 60)

    success = asyncio.run(init_database())

    if success:
        print("\n" + "=" * 60)
        print("[SUCCESS] Database is ready for use")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("[FAILED] Database initialization failed")
        print("=" * 60)
        sys.exit(1)
