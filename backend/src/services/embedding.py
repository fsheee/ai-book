"""
Embedding service using OpenAI text-embedding-3-small.
Generates vector embeddings for text chunks.
"""
from typing import List, Dict, Any
from openai import AsyncOpenAI

from src.config import settings
from src.utils.logger import logger


class EmbeddingService:
    """Service for generating text embeddings."""

    def __init__(self):
        """Initialize embedding service with OpenAI client."""
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.embedding_model
        self.dimensions = 1536  # text-embedding-3-small dimension

    async def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Text to embed

        Returns:
            List of embedding values (1536-dimensional vector)

        Raises:
            Exception: If embedding generation fails
        """
        try:
            response = await self.client.embeddings.create(
                model=self.model,
                input=text,
                dimensions=self.dimensions
            )

            embedding = response.data[0].embedding

            logger.debug(f"Generated embedding for text of length {len(text)}")
            return embedding

        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise

    async def embed_batch(
        self,
        texts: List[str],
        batch_size: int = 100
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batches.

        Args:
            texts: List of texts to embed
            batch_size: Maximum texts per API call

        Returns:
            List of embeddings in same order as input texts

        Raises:
            Exception: If embedding generation fails
        """
        try:
            all_embeddings = []

            # Process in batches to avoid API limits
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]

                response = await self.client.embeddings.create(
                    model=self.model,
                    input=batch,
                    dimensions=self.dimensions
                )

                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)

                logger.info(f"Generated embeddings for batch {i // batch_size + 1} ({len(batch)} texts)")

            logger.info(f"Total embeddings generated: {len(all_embeddings)}")
            return all_embeddings

        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}")
            raise

    async def embed_chunks(
        self,
        chunks: List[Dict[str, Any]],
        text_key: str = "text"
    ) -> List[Dict[str, Any]]:
        """
        Generate embeddings for document chunks.

        Args:
            chunks: List of chunk dictionaries with text content
            text_key: Key in chunk dict containing text

        Returns:
            Chunks with 'embedding' field added

        Raises:
            Exception: If embedding generation fails
        """
        try:
            texts = [chunk[text_key] for chunk in chunks]
            embeddings = await self.embed_batch(texts)

            # Add embeddings to chunks
            for chunk, embedding in zip(chunks, embeddings):
                chunk["embedding"] = embedding

            logger.info(f"Embedded {len(chunks)} chunks")
            return chunks

        except Exception as e:
            logger.error(f"Failed to embed chunks: {e}")
            raise

    def get_embedding_dimensions(self) -> int:
        """
        Get embedding vector dimensions.

        Returns:
            Embedding dimensions (1536 for text-embedding-3-small)
        """
        return self.dimensions
