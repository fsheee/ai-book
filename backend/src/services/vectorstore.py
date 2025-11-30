"""
Vector store service using Qdrant Cloud.
Handles document chunk storage and semantic search.
"""
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue

from src.config import settings
from src.utils.logger import logger
from src.models import DocumentChunk


class VectorStoreService:
    """Service for vector storage and semantic search."""

    def __init__(self):
        """Initialize vector store service with Qdrant client."""
        self.client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=30
        )
        self.collection_name = settings.vector_collection

    async def upsert_chunks(
        self,
        chunks: List[DocumentChunk],
        batch_size: int = 100
    ) -> int:
        """
        Insert or update document chunks in vector store.

        Args:
            chunks: List of DocumentChunk instances with embeddings
            batch_size: Maximum chunks per upsert operation

        Returns:
            Number of chunks upserted

        Raises:
            Exception: If upsert operation fails
        """
        try:
            total_upserted = 0

            # Process in batches
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i:i + batch_size]

                # Convert chunks to Qdrant points
                points = [
                    PointStruct(
                        id=str(chunk.id),
                        vector=chunk.embedding,
                        payload={
                            "text": chunk.text,
                            **chunk.metadata
                        }
                    )
                    for chunk in batch
                ]

                # Upsert to Qdrant
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=points
                )

                total_upserted += len(batch)
                logger.info(f"Upserted batch {i // batch_size + 1} ({len(batch)} chunks)")

            logger.info(f"Total chunks upserted: {total_upserted}")
            return total_upserted

        except Exception as e:
            logger.error(f"Failed to upsert chunks: {e}")
            raise

    async def search(
        self,
        query_vector: List[float],
        limit: int = None,
        score_threshold: float = None,
        filter_conditions: Optional[Dict[str, Any]] = None
    ) -> List[DocumentChunk]:
        """
        Perform semantic search in vector store.

        Args:
            query_vector: Query embedding vector
            limit: Maximum number of results (defaults to settings.top_k)
            score_threshold: Minimum similarity score (defaults to settings.similarity_threshold)
            filter_conditions: Optional metadata filters

        Returns:
            List of retrieved DocumentChunk instances with similarity scores

        Raises:
            Exception: If search operation fails
        """
        try:
            if limit is None:
                limit = settings.top_k
            if score_threshold is None:
                score_threshold = settings.similarity_threshold

            # Build filter if conditions provided
            query_filter = None
            if filter_conditions:
                query_filter = Filter(
                    must=[
                        FieldCondition(
                            key=key,
                            match=MatchValue(value=value)
                        )
                        for key, value in filter_conditions.items()
                    ]
                )

            # Perform search
            search_results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit,
                score_threshold=score_threshold,
                query_filter=query_filter
            )

            # Convert results to DocumentChunk instances
            chunks = []
            for result in search_results:
                payload = result.payload
                text = payload.pop("text", "")

                chunk = DocumentChunk(
                    id=result.id,
                    text=text,
                    embedding=result.vector if hasattr(result, 'vector') else None,
                    metadata={
                        **payload,
                        "score": result.score  # Add similarity score to metadata
                    }
                )
                chunks.append(chunk)

            logger.info(f"Found {len(chunks)} chunks with similarity >= {score_threshold}")
            return chunks

        except Exception as e:
            logger.error(f"Failed to search vector store: {e}")
            raise

    async def delete_chunks(
        self,
        chunk_ids: List[str]
    ) -> bool:
        """
        Delete chunks by IDs.

        Args:
            chunk_ids: List of chunk IDs to delete

        Returns:
            True if deletion successful

        Raises:
            Exception: If deletion fails
        """
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=chunk_ids
            )

            logger.info(f"Deleted {len(chunk_ids)} chunks")
            return True

        except Exception as e:
            logger.error(f"Failed to delete chunks: {e}")
            raise

    async def get_collection_info(self) -> Dict[str, Any]:
        """
        Get information about the vector collection.

        Returns:
            Dictionary with collection statistics

        Raises:
            Exception: If operation fails
        """
        try:
            info = self.client.get_collection(self.collection_name)

            return {
                "name": self.collection_name,
                "vectors_count": info.vectors_count,
                "points_count": info.points_count,
                "status": info.status,
                "optimizer_status": info.optimizer_status
            }

        except Exception as e:
            logger.error(f"Failed to get collection info: {e}")
            raise

    async def clear_collection(self) -> bool:
        """
        Clear all vectors from collection (use with caution).

        Returns:
            True if successful

        Raises:
            Exception: If operation fails
        """
        try:
            # Delete all points by recreating collection
            from src.utils.init_qdrant import delete_collection, init_qdrant

            delete_collection()
            init_qdrant()

            logger.warning(f"Cleared collection '{self.collection_name}'")
            return True

        except Exception as e:
            logger.error(f"Failed to clear collection: {e}")
            raise
