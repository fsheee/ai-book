"""
Structured logging configuration for RAG Chatbot Backend.
Provides JSON-formatted logs with PII filtering.
"""
import logging
import json
import sys
import re
from datetime import datetime
from typing import Any, Dict


class PIIFilter(logging.Filter):
    """Filter to redact potentially sensitive information from logs."""

    # Patterns for PII detection
    PATTERNS = [
        (r'sk-[a-zA-Z0-9]{48}', '[OPENAI_KEY_REDACTED]'),  # OpenAI API keys
        (r'Bearer [a-zA-Z0-9\-_\.]+', 'Bearer [TOKEN_REDACTED]'),  # Bearer tokens
        (r'api[_-]?key["\']?\s*[:=]\s*["\']?([a-zA-Z0-9\-_]+)', 'api_key=[KEY_REDACTED]'),  # Generic API keys
        (r'password["\']?\s*[:=]\s*["\']?([^\s"\']+)', 'password=[REDACTED]'),  # Passwords
        (r'postgresql://[^:]+:([^@]+)@', 'postgresql://user:[REDACTED]@'),  # Postgres passwords
    ]

    def filter(self, record: logging.LogRecord) -> bool:
        """Redact PII from log record message."""
        if isinstance(record.msg, str):
            for pattern, replacement in self.PATTERNS:
                record.msg = re.sub(pattern, replacement, record.msg, flags=re.IGNORECASE)

        # Also filter args if present
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: self._redact_value(v) for k, v in record.args.items()}
            elif isinstance(record.args, (list, tuple)):
                record.args = tuple(self._redact_value(arg) for arg in record.args)

        return True

    def _redact_value(self, value: Any) -> Any:
        """Redact PII from individual values."""
        if isinstance(value, str):
            for pattern, replacement in self.PATTERNS:
                value = re.sub(pattern, replacement, value, flags=re.IGNORECASE)
        return value


class JSONFormatter(logging.Formatter):
    """Format log records as JSON for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON string."""
        log_data: Dict[str, Any] = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        # Add extra fields if present
        if hasattr(record, 'extra_fields'):
            log_data.update(record.extra_fields)

        return json.dumps(log_data)


def setup_logger(
    name: str = "rag_chatbot",
    level: str = "INFO",
    json_format: bool = True
) -> logging.Logger:
    """
    Configure and return a logger instance.

    Args:
        name: Logger name
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_format: Use JSON formatting if True, else use simple text format

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)

    # Avoid duplicate handlers if logger already configured
    if logger.handlers:
        return logger

    logger.setLevel(getattr(logging, level.upper()))

    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, level.upper()))

    # Add formatter
    if json_format:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

    handler.setFormatter(formatter)

    # Add PII filter
    pii_filter = PIIFilter()
    handler.addFilter(pii_filter)

    logger.addHandler(handler)

    return logger


# Default logger instance
logger = setup_logger()


def log_with_context(logger_instance: logging.Logger, level: str, message: str, **context: Any) -> None:
    """
    Log a message with additional context fields.

    Args:
        logger_instance: Logger to use
        level: Log level (debug, info, warning, error, critical)
        message: Log message
        **context: Additional context fields to include
    """
    log_record = logger_instance.makeRecord(
        logger_instance.name,
        getattr(logging, level.upper()),
        "(unknown file)",
        0,
        message,
        (),
        None
    )
    log_record.extra_fields = context
    logger_instance.handle(log_record)
