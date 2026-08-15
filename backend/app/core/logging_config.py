"""
Centralized logging configuration.

Supports two formats, controlled by LOG_FORMAT:
  - "text": human-readable, for local development
  - "json": one JSON object per line, for production log aggregation
    (CloudWatch, Datadog, ELK, etc.)

Every log line includes: service name, environment, and (when available)
the current request's ID, via a contextvar populated by RequestIDMiddleware
(app/core/middleware.py). This makes it possible to grep/filter all log
lines belonging to a single HTTP request across the whole call stack.
"""

import json
import logging
import sys
from contextvars import ContextVar

from app.core.config import settings

_request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


def get_request_id() -> str:
    return _request_id_ctx.get()


def set_request_id(request_id: str) -> None:
    _request_id_ctx.set(request_id)


class ContextFilter(logging.Filter):
    """Injects request_id, service, and environment onto every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id()
        record.service = settings.PROJECT_NAME
        record.environment = settings.ENVIRONMENT
        return True


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "service": getattr(record, "service", settings.PROJECT_NAME),
            "environment": getattr(record, "environment", settings.ENVIRONMENT),
            "request_id": getattr(record, "request_id", "-"),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def configure_logging() -> None:
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    formatter: logging.Formatter
    if settings.LOG_FORMAT.lower() == "json":
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(service)s | %(environment)s "
            "| req=%(request_id)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S%z",
        )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    handler.addFilter(ContextFilter())

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers = [handler]

    # Quiet down noisy third-party loggers unless we're in debug mode.
    for noisy_logger in ("uvicorn.access", "sqlalchemy.engine"):
        logging.getLogger(noisy_logger).setLevel(
            logging.DEBUG if settings.DEBUG else logging.WARNING
        )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
