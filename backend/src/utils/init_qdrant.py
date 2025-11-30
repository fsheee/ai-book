"""
Qdrant Cloud initialization script.
Creates vector collection for document embeddings.
"""
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    CreateCollection,
    OptimizersConfigDiff,
)
from src.config import settings
from src.utils.logger import logger


def init_qdrant() -> None:
    """
    Initialize Qdrant Cloud by creating the vector collection.

    Collection configuration:
    - Vector size: 1536 (text-embedding-3-small)
    - Distance metric: Cosine similarity
    - Indexing: HNSW (Hierarchical Navigable Small World)

    Raises:
        Exception: If Qdrant connection or collection creation fails
    """
    try:
        logger.info("Connecting to Qdrant Cloud...")

        client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=30
        )

        # Check if collection already exists
        collections = client.get_collections().collections
        collection_names = [col.name for col in collections]

        if settings.vector_collection in collection_names:
            logger.info(f"Collection '{settings.vector_collection}' already exists")

            # Get collection info
            info = client.get_collection(settings.vector_collection)
            logger.info(f"Collection info: {info.vectors_count} vectors, status: {info.status}")
            return

        logger.info(f"Creating collection '{settings.vector_collection}'...")

        # Create collection with optimal settings
        client.create_collection(
            collection_name=settings.vector_collection,
            vectors_config=VectorParams(
                size=1536,  # text-embedding-3-small dimension
                distance=Distance.COSINE
            ),
            optimizers_config=OptimizersConfigDiff(
                indexing_threshold=10000,  # Start indexing after 10k vectors
            ),
            # HNSW indexing is default and optimal for this use case
        )

        logger.info(f"Collection '{settings.vector_collection}' created successfully!")

    except Exception as e:
        logger.error(f"Qdrant initialization failed: {e}")
        raise


def delete_collection() -> None:
    """
    Delete the vector collection (use with caution - for development/testing only).

    Raises:
        Exception: If Qdrant connection or collection deletion fails
    """
    try:
        logger.warning(f"Deleting collection '{settings.vector_collection}'...")

        client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=30
        )

        client.delete_collection(settings.vector_collection)
        logger.info(f"Collection '{settings.vector_collection}' deleted successfully")

    except Exception as e:
        logger.error(f"Failed to delete collection: {e}")
        raise


def check_qdrant_connection() -> bool:
    """
    Check if Qdrant Cloud connection is working.

    Returns:
        True if connection successful, False otherwise
    """
    try:
        client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=10
        )

        # Try to list collections to verify connection
        collections = client.get_collections()
        logger.info(f"Qdrant connection successful. Found {len(collections.collections)} collections")
        return True

    except Exception as e:
        logger.error(f"Qdrant connection check failed: {e}")
        return False


def get_collection_info() -> dict:
    """
    Get information about the vector collection.

    Returns:
        Dictionary with collection stats

    Raises:
        Exception: If collection doesn't exist or connection fails
    """
    try:
        client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=30
        )

        info = client.get_collection(settings.vector_collection)

        return {
            "name": settings.vector_collection,
            "vectors_count": info.vectors_count,
            "points_count": info.points_count,
            "status": info.status,
            "optimizer_status": info.optimizer_status,
        }

    except Exception as e:
        logger.error(f"Failed to get collection info: {e}")
        raise


if __name__ == "__main__":
    # Run initialization when script is executed directly
    init_qdrant()
