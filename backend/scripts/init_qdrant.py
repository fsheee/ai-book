"""
Initialize Qdrant Vector Database

Creates the "ai_book" collection with proper configuration:
- Vector size: 1536 (OpenAI text-embedding-3-small)
- Distance metric: Cosine similarity
- Payload schema for chunk metadata

Usage:
    python scripts/init_qdrant.py
"""

import os
import sys
from pathlib import Path

# Add backend/src to Python path
backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root / "src"))

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PayloadSchemaType
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "ai_book"
VECTOR_SIZE = 1536  # OpenAI text-embedding-3-small dimension

if not QDRANT_URL or not QDRANT_API_KEY:
    print("ERROR: QDRANT_URL or QDRANT_API_KEY not found in .env file")
    sys.exit(1)


def init_qdrant():
    """Initialize Qdrant collection"""
    print(f"Connecting to Qdrant Cloud...")
    print(f"Qdrant URL: {QDRANT_URL[:50]}...")  # Show first 50 chars only

    try:
        # Connect to Qdrant
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        print("[OK] Connected to Qdrant Cloud")

        # Check if collection exists
        collections = client.get_collections().collections
        collection_names = [col.name for col in collections]

        if COLLECTION_NAME in collection_names:
            print(f"\n[WARNING] Collection '{COLLECTION_NAME}' already exists")
            response = input("Do you want to recreate it? This will delete all data. (yes/no): ")
            if response.lower() != "yes":
                print("Aborting. Existing collection preserved.")
                return True

            # Delete existing collection
            print(f"Deleting existing collection '{COLLECTION_NAME}'...")
            client.delete_collection(collection_name=COLLECTION_NAME)
            print("[OK] Collection deleted")

        # Create collection
        print(f"\nCreating collection '{COLLECTION_NAME}'...")
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE
            ),
        )
        print(f"[OK] Collection '{COLLECTION_NAME}' created successfully")

        # Create payload schema indexes for faster filtering
        print("\nCreating payload indexes...")

        # Index for file_path (used in source filtering)
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="file_path",
            field_schema=PayloadSchemaType.KEYWORD
        )
        print("[OK] Created index: file_path")

        # Index for chapter_title (used in filtering)
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="chapter_title",
            field_schema=PayloadSchemaType.TEXT
        )
        print("[OK] Created index: chapter_title")

        # Verify collection
        collection_info = client.get_collection(collection_name=COLLECTION_NAME)
        print("\n[OK] Qdrant collection initialized successfully!")
        print(f"\nCollection info:")
        print(f"  - Name: {collection_info.config.params.vectors.size}")
        print(f"  - Vector size: {collection_info.config.params.vectors.size}")
        print(f"  - Distance: {collection_info.config.params.vectors.distance}")
        print(f"  - Points count: {collection_info.points_count}")

        print("\n[OK] Qdrant initialization complete!")
        return True

    except Exception as e:
        print(f"\n[ERROR] Qdrant initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Qdrant Vector Database Initialization")
    print("=" * 60)

    success = init_qdrant()

    if success:
        print("\n" + "=" * 60)
        print("[SUCCESS] Qdrant collection is ready for ingestion")
        print("=" * 60)
        print("\nNext steps:")
        print("  1. Run: python scripts/ingest_docs.py")
        print("  2. This will embed and upload textbook content to Qdrant")
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("[FAILED] Qdrant initialization failed")
        print("=" * 60)
        sys.exit(1)
