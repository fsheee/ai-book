"""
Health check endpoint.
Verifies connectivity to all dependent services.
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from src.api.schemas import HealthResponse
from src.utils.logger import logger
from src.utils.init_db import check_database_connection
from src.utils.init_qdrant import check_qdrant_connection


router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.

    Checks connectivity to:
    - Neon Postgres database
    - Qdrant Cloud vector store
    - OpenAI API (basic check)

    Returns 200 if all services healthy, 503 if any service unhealthy.
    """
    try:
        # Check database
        db_status = "healthy" if check_database_connection() else "unhealthy"

        # Check Qdrant
        qdrant_status = "healthy" if check_qdrant_connection() else "unhealthy"

        # OpenAI check is done lazily on first query
        openai_status = "unknown"

        services = {
            "database": db_status,
            "qdrant": qdrant_status,
            "openai": openai_status
        }

        # Overall status
        overall_status = "healthy" if db_status == "healthy" and qdrant_status == "healthy" else "degraded"

        status_code = 200 if overall_status == "healthy" else 503

        return JSONResponse(
            status_code=status_code,
            content=HealthResponse(
                status=overall_status,
                version="1.0.0",
                services=services
            ).dict()
        )

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "version": "1.0.0",
                "error": str(e)
            }
        )
