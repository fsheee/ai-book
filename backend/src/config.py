"""
Configuration management for RAG Chatbot Backend.
Loads and validates environment variables.
"""
import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # OpenAI API
    openai_api_key: str = Field(..., alias="OPENAI_API_KEY")

    # Qdrant Cloud
    qdrant_url: str = Field(..., alias="QDRANT_URL")
    qdrant_api_key: str = Field(..., alias="QDRANT_API_KEY")

    # Neon Postgres
    database_url: str = Field(..., alias="DATABASE_URL")

    # API Security
    api_key: str = Field(..., alias="API_KEY")

    # CORS
    cors_origins: str = Field(
        default="http://localhost:3000",
        alias="CORS_ORIGINS"
    )

    # Configuration
    embedding_model: str = Field(
        default="text-embedding-3-small",
        alias="EMBEDDING_MODEL"
    )
    llm_model: str = Field(
        default="gpt-4-turbo-preview",
        alias="LLM_MODEL"
    )
    vector_collection: str = Field(
        default="ai_book",
        alias="VECTOR_COLLECTION"
    )
    top_k: int = Field(default=5, alias="TOP_K")
    similarity_threshold: float = Field(default=0.70, alias="SIMILARITY_THRESHOLD")
    chunk_size: int = Field(default=1200, alias="CHUNK_SIZE")
    chunk_overlap: int = Field(default=200, alias="CHUNK_OVERLAP")

    # Rate Limiting
    rate_limit_per_minute: int = Field(default=10, alias="RATE_LIMIT_PER_MINUTE")
    rate_limit_per_hour: int = Field(default=100, alias="RATE_LIMIT_PER_HOUR")

    # Server
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string into list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    def validate_required_settings(self) -> None:
        """Validate that all required settings are present and valid."""
        required_fields = [
            "openai_api_key",
            "qdrant_url",
            "qdrant_api_key",
            "database_url",
            "api_key"
        ]

        missing_fields = []
        for field in required_fields:
            value = getattr(self, field, None)
            if not value or value == "":
                missing_fields.append(field.upper())

        if missing_fields:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing_fields)}"
            )

        # Validate numeric ranges
        if self.top_k < 1 or self.top_k > 20:
            raise ValueError("TOP_K must be between 1 and 20")

        if self.similarity_threshold < 0.0 or self.similarity_threshold > 1.0:
            raise ValueError("SIMILARITY_THRESHOLD must be between 0.0 and 1.0")

        if self.chunk_size < 100 or self.chunk_size > 5000:
            raise ValueError("CHUNK_SIZE must be between 100 and 5000")

        if self.chunk_overlap >= self.chunk_size:
            raise ValueError("CHUNK_OVERLAP must be less than CHUNK_SIZE")


# Global settings instance
settings = Settings()

# Validate on import
settings.validate_required_settings()
