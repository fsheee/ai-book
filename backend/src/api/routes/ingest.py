"""
Content Ingestion Endpoints

Admin endpoints for ingesting and managing textbook content in the vector database.
"""

import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel, Field

from src.config import settings
from src.utils.logger import logger
from src.api.middleware.auth import api_key_auth
from src.api.middleware.rate_limit import limiter, get_rate_limit_string
from src.services.ingestion import IngestionService


router = APIRouter(prefix="/ingest", tags=["Ingestion"])

# Initialize ingestion service
ingestion_service = IngestionService()


class IngestRequest(BaseModel):
    """Request schema for content ingestion"""
    content_dir: str = Field(..., description="Path to content directory containing MDX files")
    force_reingest: bool = Field(False, description="Re-ingest all files even if unchanged")
    file_pattern: str = Field("**/*.mdx", description="Glob pattern for files to ingest")


class IngestResponse(BaseModel):
    """Response schema for content ingestion"""
    status: str = Field(..., description="Overall ingestion status: success, partial, or failed")
    chunks_created: int = Field(..., description="Total number of chunks created")
    files_processed: int = Field(..., description="Number of files successfully processed")
    files_skipped: int = Field(0, description="Number of files skipped (unchanged)")
    files_failed: int = Field(0, description="Number of files that failed processing")
    errors: list = Field(default_factory=list, description="List of errors encountered")
    duration_seconds: float = Field(..., description="Total ingestion duration")


class CollectionInfoResponse(BaseModel):
    """Response schema for collection info"""
    collection_name: str
    vector_count: int
    indexed: bool
    status: str


@router.post("/embed-book", response_model=IngestResponse)
@limiter.limit("5/hour")  # Strict rate limit for ingestion
async def embed_book(
    request_data: IngestRequest,
    request: Request,
    api_key: str = Depends(api_key_auth)
):
    """
    Ingest and embed textbook content from MDX files.

    This endpoint scans the specified directory for MDX files, extracts content,
    chunks it, generates embeddings, and uploads to Qdrant vector database.

    **Rate Limited**: 5 requests per hour (ingestion is resource-intensive)

    Args:
        content_dir: Path to directory containing MDX files
        force_reingest: If True, re-ingest all files; if False, skip unchanged files
        file_pattern: Glob pattern for matching files (default: **/*.mdx)

    Returns:
        IngestResponse with statistics and any errors encountered

    Example:
        ```
        POST /ingest/embed-book
        {
            "content_dir": "/app/docs",
            "force_reingest": false,
            "file_pattern": "**/*.mdx"
        }
        ```
    """
    logger.info(f"Starting content ingestion from: {request_data.content_dir}")
    logger.info(f"Force reingest: {request_data.force_reingest}")
    logger.info(f"File pattern: {request_data.file_pattern}")

    try:
        # Run ingestion
        result = await ingestion_service.ingest_directory(
            content_dir=request_data.content_dir,
            file_pattern=request_data.file_pattern,
            force_reingest=request_data.force_reingest
        )

        # Determine overall status
        if result['files_failed'] == 0:
            status = "success"
        elif result['files_processed'] > 0:
            status = "partial"
        else:
            status = "failed"

        response = IngestResponse(
            status=status,
            chunks_created=result['chunks_created'],
            files_processed=result['files_processed'],
            files_skipped=result.get('files_skipped', 0),
            files_failed=result['files_failed'],
            errors=result.get('errors', []),
            duration_seconds=result['duration_seconds']
        )

        logger.info(f"Ingestion completed: {status}")
        logger.info(f"Files processed: {result['files_processed']}, "
                   f"Chunks created: {result['chunks_created']}, "
                   f"Errors: {result['files_failed']}")

        return response

    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Ingestion failed: {str(e)}"
        )


@router.get("/collection-info", response_model=CollectionInfoResponse)
@limiter.limit(get_rate_limit_string())
async def get_collection_info(
    request: Request,
    api_key: str = Depends(api_key_auth)
):
    """
    Get information about the vector database collection.

    Returns stats about the current state of the Qdrant collection,
    including total vectors and indexing status.

    Returns:
        CollectionInfoResponse with collection statistics
    """
    try:
        info = await ingestion_service.get_collection_info()

        return CollectionInfoResponse(
            collection_name=info['collection_name'],
            vector_count=info['vectors_count'],
            indexed=info.get('indexed', False),
            status=info.get('status', 'unknown')
        )

    except Exception as e:
        logger.error(f"Failed to get collection info: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get collection info: {str(e)}"
        )


@router.delete("/clear-collection")
@limiter.limit("1/hour")  # Very strict rate limit for destructive operation
async def clear_collection(
    confirm: bool = False,
    request: Request = None,
    api_key: str = Depends(api_key_auth)
):
    """
    Clear all vectors from the collection.

    **WARNING**: This is a destructive operation that deletes all embedded content.

    **Rate Limited**: 1 request per hour

    Args:
        confirm: Must be True to proceed with deletion

    Returns:
        dict with deletion status
    """
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Must set confirm=True to proceed with collection deletion"
        )

    logger.warning("DESTRUCTIVE OPERATION: Clearing vector collection")

    try:
        result = await ingestion_service.clear_collection()

        logger.warning(f"Collection cleared: {result['vectors_deleted']} vectors deleted")

        return {
            "status": "success",
            "message": "Collection cleared successfully",
            "vectors_deleted": result['vectors_deleted']
        }

    except Exception as e:
        logger.error(f"Failed to clear collection: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear collection: {str(e)}"
        )
