"""
FastAPI application entrypoint.

Wires together: logging, CORS, the v1 API router, and global exception
handlers that translate domain exceptions (app.core.exceptions) into
consistent JSON error responses.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import AppError
from app.core.logging_config import configure_logging, get_logger
from app.core.middleware import RateLimitMiddleware, RequestIDMiddleware, SecurityHeadersMiddleware

configure_logging()
logger = get_logger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    debug=settings.DEBUG,
    description="Backend API for FitMirror AI — Virtual Try-On, AI Stylist, "
    "Smart Wardrobe, Size Recommendation, Shopping Assistant, and Store Dashboard.",
)

# Order matters: middleware runs outside-in on the way in, inside-out on the
# way out. Request ID is added first so it's available to every later
# middleware and to all application logging for this request.
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    logger.warning("Handled AppError: %s - %s", exc.error_code, exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error_code": exc.error_code, "message": exc.message},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception while processing request: %s", request.url)
    return JSONResponse(
        status_code=500,
        content={"error_code": "internal_error", "message": "An unexpected error occurred."},
    )


@app.get("/health", tags=["Health"])
def health_check() -> dict:
    return {"status": "ok", "service": settings.PROJECT_NAME}


app.include_router(api_router, prefix=settings.API_V1_PREFIX)
