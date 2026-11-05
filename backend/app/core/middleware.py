"""
Cross-cutting HTTP middleware.

Each middleware is intentionally small and independently toggleable via
settings, so behavior can change per-environment (dev/test/prod) without
code changes. Security headers are still a Phase-1.5 PLACEHOLDER, until a
finalized security-header policy lands in a later phase.
"""

import time
import uuid
from functools import lru_cache

from redis.asyncio import Redis
from redis.exceptions import RedisError
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings
from app.core.logging_config import get_logger, set_request_id

logger = get_logger(__name__)

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


@lru_cache
def get_rate_limit_redis() -> Redis:
    # Short timeouts: a struggling Redis must not hold up every request.
    return Redis.from_url(settings.REDIS_URL, socket_timeout=0.25, socket_connect_timeout=0.25)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Fixed one-minute windows counted in Redis, so the limit holds across
    every API process. Off unless RATE_LIMIT_ENABLED=true.

    Sign-in routes get their own stricter budget, to slow password guessing.
    If Redis is unavailable requests are let through: an outage of the
    limiter shouldn't become an outage of the API.

    Clients are told apart by request.client, which behind a proxy is only
    the real client if uvicorn trusts that proxy (FORWARDED_ALLOW_IPS).
    Otherwise all traffic looks like one client and shares one budget.
    """

    WINDOW_SECONDS = 60
    EXEMPT_PATHS = frozenset({"/health"})
    AUTH_PATH_SUFFIXES = (
        "/auth/login",
        "/auth/register",
        "/auth/forgot-password",
        "/auth/reset-password",
    )

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if not settings.RATE_LIMIT_ENABLED or request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        is_auth = request.url.path.endswith(self.AUTH_PATH_SUFFIXES)
        limit = (
            settings.RATE_LIMIT_AUTH_REQUESTS_PER_MINUTE
            if is_auth
            else settings.RATE_LIMIT_REQUESTS_PER_MINUTE
        )
        client = request.client.host if request.client else "unknown"
        now = int(time.time())
        window = now // self.WINDOW_SECONDS
        key = f"ratelimit:{'auth' if is_auth else 'api'}:{client}:{window}"

        try:
            count = await self._count_request(key)
        except RedisError:
            logger.warning("Rate limiter unavailable; letting the request through.")
            return await call_next(request)

        if count > limit:
            retry_after = (window + 1) * self.WINDOW_SECONDS - now
            return Response(
                content='{"error_code":"rate_limited","message":"Too many requests."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": str(max(retry_after, 1))},
            )

        return await call_next(request)

    async def _count_request(self, key: str) -> int:
        async with get_rate_limit_redis().pipeline(transaction=True) as pipeline:
            pipeline.incr(key)
            pipeline.expire(key, self.WINDOW_SECONDS * 2)
            count, _ = await pipeline.execute()
        return count


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
