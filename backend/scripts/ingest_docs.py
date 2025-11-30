"""
Document ingestion script.
Scans MDX files, chunks content, generates embeddings, and upserts to Qdrant.
"""
import asyncio
import sys
from pathlib import Path
from typing import List, Dict, Any
from tqdm import tqdm

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import settings
from src.utils.logger import logger
from src.utils.chunking import create_chunker
from src.services.ingestion import IngestionService
from src.services.embedding import EmbeddingService
from src.services.vectorstore import VectorStoreService
from src.models import DocumentChunk


class DocumentIngestionPipeline:
    """Pipeline for ingesting textbook documents into vector store."""

    def __init__(
        self,
        docs_directory: Path,
        skip_unchanged: bool = True
    ):
        """
        Initialize ingestion pipeline.

        Args:
            docs_directory: Directory containing MDX files
            skip_unchanged: Skip files with unchanged content_hash
        """
        self.docs_directory = docs_directory
        self.skip_unchanged = skip_unchanged

        self.ingestion_service = IngestionService()
        self.embedding_service = EmbeddingService()
        self.vectorstore_service = VectorStoreService()
        self.chunker = create_chunker(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap
        )

        # Track processed hashes
        self.processed_hashes: Dict[str, str] = {}

    async def load_existing_hashes(self) -> None:
        """Load content hashes of already-processed documents from vector store."""
        try:
            # Get all existing points from Qdrant
            collection_info = await self.vectorstore_service.get_collection_info()
            logger.info(f"Vector store has {collection_info['points_count']} existing chunks")

            # TODO: Implement hash tracking if needed
            # For now, we'll always re-process (safe but slower)

        except Exception as e:
            logger.warning(f"Could not load existing hashes: {e}")

    async def process_document(self, doc: Dict[str, Any]) -> List[DocumentChunk]:
        """
        Process a single document: chunk, embed, create DocumentChunk instances.

        Args:
            doc: Parsed document dictionary

        Returns:
            List of DocumentChunk instances with embeddings
        """
        try:
            content = doc['content']
            metadata = doc['metadata']
            content_hash = doc['content_hash']

            # Check if already processed
            if self.skip_unchanged and content_hash in self.processed_hashes:
                logger.info(f"Skipping unchanged document: {metadata['source_file']}")
                return []

            # Chunk the document
            chunks_data = self.chunker.chunk_text(content, metadata=metadata)

            if not chunks_data:
                logger.warning(f"No chunks generated for {metadata['source_file']}")
                return []

            # Extract texts for embedding
            texts = [chunk['text'] for chunk in chunks_data]

            # Generate embeddings
            logger.info(f"Generating embeddings for {len(texts)} chunks...")
            embeddings = await self.embedding_service.embed_batch(texts)

            # Create DocumentChunk instances
            document_chunks = []
            for chunk_data, embedding in zip(chunks_data, embeddings):
                chunk = DocumentChunk(
                    text=chunk_data['text'],
                    embedding=embedding,
                    metadata={
                        **chunk_data['metadata'],
                        'content_hash': content_hash
                    }
                )
                document_chunks.append(chunk)

            logger.info(f"Processed {len(document_chunks)} chunks from {metadata['source_file']}")
            return document_chunks

        except Exception as e:
            logger.error(f"Failed to process document: {e}")
            return []

    async def ingest_all(self) -> Dict[str, int]:
        """
        Ingest all documents from the configured directory.

        Returns:
            Statistics dictionary with counts
        """
        try:
            logger.info(f"Starting document ingestion from {self.docs_directory}")

            # Parse all MDX files
            logger.info("Parsing MDX files...")
            documents = self.ingestion_service.parse_mdx_directory(
                self.docs_directory,
                file_pattern="*.md*",
                recursive=True
            )

            if not documents:
                logger.warning("No documents found to ingest")
                return {"documents": 0, "chunks": 0, "skipped": 0}

            logger.info(f"Found {len(documents)} documents to process")

            # Load existing hashes
            await self.load_existing_hashes()

            # Process each document
            all_chunks = []
            skipped_count = 0

            for doc in tqdm(documents, desc="Processing documents"):
                chunks = await self.process_document(doc)
                if chunks:
                    all_chunks.extend(chunks)
                else:
                    skipped_count += 1

            if not all_chunks:
                logger.warning("No chunks to ingest")
                return {
                    "documents": len(documents),
                    "chunks": 0,
                    "skipped": skipped_count
                }

            # Upsert to Qdrant
            logger.info(f"Upserting {len(all_chunks)} chunks to Qdrant...")
            upserted_count = await self.vectorstore_service.upsert_chunks(all_chunks)

            logger.info("Ingestion complete!")
            return {
                "documents": len(documents),
                "chunks": upserted_count,
                "skipped": skipped_count
            }

        except Exception as e:
            logger.error(f"Ingestion failed: {e}")
            raise


async def main():
    """Main entry point for ingestion script."""
    import argparse

    parser = argparse.ArgumentParser(description="Ingest textbook documents into vector store")
    parser.add_argument(
        "--docs-dir",
        type=Path,
        default=Path("docs"),
        help="Directory containing MDX files (default: docs/)"
    )
    parser.add_argument(
        "--no-skip-unchanged",
        action="store_true",
        help="Re-process all files even if unchanged"
    )
    parser.add_argument(
        "--clear-first",
        action="store_true",
        help="Clear vector store before ingestion"
    )

    args = parser.parse_args()

    # Validate docs directory
    if not args.docs_dir.exists():
        logger.error(f"Docs directory not found: {args.docs_dir}")
        sys.exit(1)

    # Clear vector store if requested
    if args.clear_first:
        logger.warning("Clearing vector store...")
        vectorstore = VectorStoreService()
        await vectorstore.clear_collection()

    # Run ingestion
    pipeline = DocumentIngestionPipeline(
        docs_directory=args.docs_dir,
        skip_unchanged=not args.no_skip_unchanged
    )

    stats = await pipeline.ingest_all()

    # Print summary
    logger.info("\n=== Ingestion Summary ===")
    logger.info(f"Documents processed: {stats['documents']}")
    logger.info(f"Chunks ingested: {stats['chunks']}")
    logger.info(f"Documents skipped: {stats['skipped']}")


if __name__ == "__main__":
    asyncio.run(main())
