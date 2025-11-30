"""Middleware components for API."""
from .cors import setup_cors
from .auth import api_key_auth
from .rate_limit import setup_rate_limiting

__all__ = ["setup_cors", "api_key_auth", "setup_rate_limiting"]
