"""
FastAPI application entry point for RAG Chatbot Backend.
Initializes app, middleware, routes, and services.
"""
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from src.config import settings
from src.utils.logger import logger, setup_logger
from src.api.middleware import setup_cors, setup_rate_limiting
from src.api.schemas import HealthResponse


# Setup logger
setup_logger(level="INFO", json_format=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting RAG Chatbot Backend...")
    logger.info(f"Environment: {settings.llm_model}, {settings.embedding_model}")
    logger.info(f"CORS origins: {settings.cors_origins_list}")

    # Verify service connections
    try:
        from src.utils.init_db import check_database_connection
        from src.utils.init_qdrant import check_qdrant_connection

        db_ok = check_database_connection()
        qdrant_ok = check_qdrant_connection()

        if not db_ok:
            logger.warning("Database connection check failed - some features may not work")
        if not qdrant_ok:
            logger.warning("Qdrant connection check failed - RAG queries will fail")

        if db_ok and qdrant_ok:
            logger.info("All service connections verified successfully")

    except Exception as e:
        logger.error(f"Service connection verification failed: {e}")

    logger.info("Application startup complete")

    yield

    # Shutdown
    logger.info("Shutting down RAG Chatbot Backend...")


# Create FastAPI app
app = FastAPI(
    title="RAG Chatbot API",
    description="Retrieval-Augmented Generation chatbot for 'Physical AI & Humanoid Robotics' textbook",
    version="1.0.0",
    lifespan=lifespan
)

# Setup middleware
setup_cors(app, settings.cors_origins_list)
limiter = setup_rate_limiting(app)


# Health check endpoint
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    Returns service status and basic information.
    """
    try:
        from src.utils.init_db import check_database_connection
        from src.utils.init_qdrant import check_qdrant_connection

        db_status = "healthy" if check_database_connection() else "unhealthy"
        qdrant_status = "healthy" if check_qdrant_connection() else "unhealthy"

        return HealthResponse(
            status="healthy",
            version="1.0.0",
            services={
                "database": db_status,
                "qdrant": qdrant_status,
                "openai": "unknown"  # OpenAI connection checked on first query
            }
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


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "RAG Chatbot API",
        "version": "1.0.0",
        "description": "Retrieval-Augmented Generation chatbot for 'Physical AI & Humanoid Robotics' textbook",
        "endpoints": {
            "health": "/health",
            "rag_query": "/rag/query",
            "selection_query": "/rag/from-selection",
            "embed_book": "/embed-book",
            "docs": "/docs"
        }
    }


# Import and register route modules
from src.api.routes import rag, health, ingest

app.include_router(rag.router)
app.include_router(health.router)
app.include_router(ingest.router)


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting server on {settings.host}:{settings.port}")
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,  # Enable auto-reload for development
        log_config=None  # Use our custom logger
    )
