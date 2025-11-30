"""
Rate limiting middleware using SlowAPI.
Implements per-IP rate limiting for API endpoints.
"""
from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from src.config import settings


# Initialize limiter with IP-based identification
limiter = Limiter(key_func=get_remote_address)


def setup_rate_limiting(app: FastAPI) -> Limiter:
    """
    Configure rate limiting for the FastAPI application.

    Args:
        app: FastAPI application instance

    Returns:
        Configured Limiter instance
    """
    # Add rate limiter to app state
    app.state.limiter = limiter

    # Register exception handler for rate limit exceeded
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    return limiter


def get_rate_limit_string() -> str:
    """
    Get rate limit configuration as string for SlowAPI.

    Returns:
        Rate limit string (e.g., "10/minute;100/hour")
    """
    return f"{settings.rate_limit_per_minute}/minute;{settings.rate_limit_per_hour}/hour"
