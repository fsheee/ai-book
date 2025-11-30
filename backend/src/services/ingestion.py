"""
Document ingestion service.
Handles MDX parsing, metadata extraction, and content processing.
"""
import re
import hashlib
from typing import Dict, Any, List, Optional
from pathlib import Path
import frontmatter

from src.utils.logger import logger


class IngestionService:
    """Service for processing MDX documents."""

    @staticmethod
    def strip_jsx_tags(content: str) -> str:
        """
        Remove JSX/HTML tags from content.

        Args:
            content: MDX content with potential JSX components

        Returns:
            Plain text content with JSX tags removed
        """
        # Remove JSX component tags (e.g., <CustomComponent />)
        content = re.sub(r'<[A-Z][^>]*?/>', '', content)

        # Remove opening and closing JSX tags (e.g., <Component> </Component>)
        content = re.sub(r'</?[A-Z][^>]*?>', '', content)

        # Remove HTML comments
        content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)

        # Remove import statements
        content = re.sub(r'^import\s+.*?from\s+["\'].*?["\'];?$', '', content, flags=re.MULTILINE)

        # Remove export statements
        content = re.sub(r'^export\s+.*?;?$', '', content, flags=re.MULTILINE)

        # Clean up excessive whitespace
        content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)

        return content.strip()

    @staticmethod
    def compute_content_hash(content: str) -> str:
        """
        Compute SHA256 hash of content for change detection.

        Args:
            content: Document content

        Returns:
            Hex string of content hash
        """
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def parse_mdx_file(self, file_path: Path) -> Dict[str, Any]:
        """
        Parse MDX file and extract metadata and content.

        Args:
            file_path: Path to MDX file

        Returns:
            Dictionary with 'metadata', 'content', and 'content_hash'

        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If file parsing fails
        """
        try:
            if not file_path.exists():
                raise FileNotFoundError(f"MDX file not found: {file_path}")

            # Parse frontmatter using python-frontmatter
            with open(file_path, 'r', encoding='utf-8') as f:
                post = frontmatter.load(f)

            # Extract metadata
            metadata = {
                "title": post.get('title', file_path.stem),
                "chapter": post.get('chapter', ''),
                "section": post.get('section', ''),
                "tags": post.get('tags', []),
                "source_file": str(file_path.name),
                "source_path": str(file_path)
            }

            # Extract and clean content
            raw_content = post.content
            clean_content = self.strip_jsx_tags(raw_content)

            # Compute content hash
            content_hash = self.compute_content_hash(clean_content)

            logger.info(f"Parsed MDX file: {file_path.name} (hash: {content_hash[:8]}...)")

            return {
                "metadata": metadata,
                "content": clean_content,
                "content_hash": content_hash,
                "raw_content": raw_content  # Keep raw for potential future use
            }

        except Exception as e:
            logger.error(f"Failed to parse MDX file {file_path}: {e}")
            raise ValueError(f"MDX parsing failed: {e}")

    def parse_mdx_directory(
        self,
        directory: Path,
        file_pattern: str = "*.md*",
        recursive: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Parse all MDX files in a directory.

        Args:
            directory: Directory containing MDX files
            file_pattern: Glob pattern for file matching
            recursive: Search recursively in subdirectories

        Returns:
            List of parsed document dictionaries

        Raises:
            NotADirectoryError: If directory doesn't exist
        """
        try:
            if not directory.exists() or not directory.is_dir():
                raise NotADirectoryError(f"Directory not found: {directory}")

            # Find all matching files
            if recursive:
                mdx_files = list(directory.rglob(file_pattern))
            else:
                mdx_files = list(directory.glob(file_pattern))

            logger.info(f"Found {len(mdx_files)} MDX files in {directory}")

            # Parse each file
            documents = []
            for file_path in mdx_files:
                try:
                    doc = self.parse_mdx_file(file_path)
                    documents.append(doc)
                except Exception as e:
                    logger.warning(f"Skipping file {file_path}: {e}")
                    continue

            logger.info(f"Successfully parsed {len(documents)} documents")
            return documents

        except Exception as e:
            logger.error(f"Failed to parse directory {directory}: {e}")
            raise

    def extract_chapter_info(self, metadata: Dict[str, Any]) -> Dict[str, str]:
        """
        Extract structured chapter information from metadata.

        Args:
            metadata: Document metadata

        Returns:
            Dictionary with chapter_number, chapter_title, section_number, section_title
        """
        chapter = metadata.get('chapter', '')
        section = metadata.get('section', '')

        # Try to parse chapter number and title
        chapter_match = re.match(r'Chapter\s+(\d+):?\s*(.*)', chapter, re.IGNORECASE)
        if chapter_match:
            chapter_number = chapter_match.group(1)
            chapter_title = chapter_match.group(2).strip()
        else:
            chapter_number = ""
            chapter_title = chapter

        # Try to parse section number and title
        section_match = re.match(r'(\d+\.?\d*):?\s*(.*)', section)
        if section_match:
            section_number = section_match.group(1)
            section_title = section_match.group(2).strip()
        else:
            section_number = ""
            section_title = section

        return {
            "chapter_number": chapter_number,
            "chapter_title": chapter_title,
            "section_number": section_number,
            "section_title": section_title
        }
