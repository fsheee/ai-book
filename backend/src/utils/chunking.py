"""
Text chunking utilities for document processing.
Uses RecursiveCharacterTextSplitter for optimal chunk creation.
"""
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter


class TextChunker:
    """
    Text chunking utility using LangChain's RecursiveCharacterTextSplitter.
    Optimized for semantic coherence and RAG retrieval.
    """

    def __init__(
        self,
        chunk_size: int = 1200,
        chunk_overlap: int = 200,
        separators: List[str] = None
    ):
        """
        Initialize text chunker.

        Args:
            chunk_size: Maximum characters per chunk
            chunk_overlap: Character overlap between chunks for context continuity
            separators: List of separators to split on (default: hierarchical markdown/text)
        """
        if separators is None:
            # Hierarchical separators optimized for markdown/text
            separators = [
                "\n\n\n",  # Multiple newlines (section breaks)
                "\n\n",    # Paragraph breaks
                "\n",      # Line breaks
                ". ",      # Sentence endings
                "? ",
                "! ",
                "; ",
                ", ",      # Clause separators
                " ",       # Word boundaries
                ""         # Character-level fallback
            ]

        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=separators,
            length_function=len,
            is_separator_regex=False
        )

    def chunk_text(
        self,
        text: str,
        metadata: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Split text into chunks with metadata.

        Args:
            text: Text content to chunk
            metadata: Optional metadata to attach to each chunk

        Returns:
            List of chunk dictionaries with 'text' and 'metadata' keys
        """
        if not text or not text.strip():
            return []

        # Create chunks using LangChain splitter
        chunks = self.splitter.split_text(text)

        # Build chunk objects with metadata
        chunk_objects = []
        for i, chunk in enumerate(chunks):
            chunk_metadata = {
                "chunk_index": i,
                "chunk_count": len(chunks),
                "chunk_size": len(chunk),
                **(metadata or {})
            }

            chunk_objects.append({
                "text": chunk,
                "metadata": chunk_metadata
            })

        return chunk_objects

    def chunk_documents(
        self,
        documents: List[Dict[str, Any]],
        text_key: str = "content",
        metadata_key: str = "metadata"
    ) -> List[Dict[str, Any]]:
        """
        Chunk multiple documents.

        Args:
            documents: List of document dictionaries
            text_key: Key in document dict containing text content
            metadata_key: Key in document dict containing metadata

        Returns:
            Flattened list of all chunks from all documents
        """
        all_chunks = []

        for doc_index, doc in enumerate(documents):
            text = doc.get(text_key, "")
            doc_metadata = doc.get(metadata_key, {})

            # Add document-level metadata
            doc_metadata["document_index"] = doc_index

            # Chunk the document
            chunks = self.chunk_text(text, metadata=doc_metadata)
            all_chunks.extend(chunks)

        return all_chunks


def create_chunker(chunk_size: int = 1200, chunk_overlap: int = 200) -> TextChunker:
    """
    Factory function to create a TextChunker instance.

    Args:
        chunk_size: Maximum characters per chunk
        chunk_overlap: Character overlap between chunks

    Returns:
        Configured TextChunker instance
    """
    return TextChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)


def chunk_markdown(
    markdown_text: str,
    chunk_size: int = 1200,
    chunk_overlap: int = 200,
    metadata: Dict[str, Any] = None
) -> List[Dict[str, Any]]:
    """
    Convenience function to chunk markdown text.

    Args:
        markdown_text: Markdown content to chunk
        chunk_size: Maximum characters per chunk
        chunk_overlap: Character overlap between chunks
        metadata: Optional metadata to attach to chunks

    Returns:
        List of chunk dictionaries
    """
    chunker = create_chunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return chunker.chunk_text(markdown_text, metadata=metadata)
