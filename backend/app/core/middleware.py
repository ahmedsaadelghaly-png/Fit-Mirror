"""
Cross-cutting HTTP middleware.

Each middleware is intentionally small and independently toggleable via
settings, so behavior can change per-environment (dev/test/prod) without
code changes. Rate limiting and security headers are Phase-1.5 PLACEHOLDERS:
they establish the wiring and interface but use conservative/no-op defaults
until a real backing store (e.g. Redis-based token bucket) and a finalized
security-header policy are implemented in a later phase.
"""

import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings
from app.core.logging_config import set_request_id

REQUEST_ID_HEADER = "X-Request-ID"


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Assigns a unique ID to every request (or reuses an inbound X-Request-ID
    header, e.g. from an upstream load balancer), stores it in a contextvar
    so all log lines for this request are tagged with it, and echoes it back
    in the response headers for client-side correlation.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER, str(uuid.uuid4()))
        set_request_id(request_id)
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers[REQUEST_ID_HEADER] = request_id
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    PLACEHOLDER rate limiter.

    Currently a no-op unless RATE_LIMIT_ENABLED=true, in which case it
    applies a naive in-process counter — NOT suitable for multi-instance
    production use (it doesn't share state across processes/pods). This
    exists to establish the middleware slot and response contract
    (429 + Retry-After) ahead of a real implementation (e.g. a Redis-backed
    sliding-window limiter) in a later phase.
    """

    def __init__(self, app):
        super().__init__(app)
        self._request_counts: dict[str, int] = {}

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        client_key = request.client.host if request.client else "unknown"
        self._request_counts[client_key] = self._request_counts.get(client_key, 0) + 1

        if self._request_counts[client_key] > settings.RATE_LIMIT_REQUESTS_PER_MINUTE:
            return Response(
                content='{"error_code":"rate_limited","message":"Too many requests."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": "60"},
            )

        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    PLACEHOLDER security headers.

    No-op unless SECURE_HEADERS_ENABLED=true. When enabled, applies a
    conservative baseline (HSTS, nosniff, frame-deny, referrer policy).
    Revisit CSP and per-route overrides once the frontend's asset/CDN
    strategy is finalized in a later phase.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        if settings.SECURE_HEADERS_ENABLED:
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"

        return response
