from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging_config import configure_logging, get_logger
from app.core.middleware import RequestIDMiddleware

configure_logging()
logger = get_logger(__name__)

app = FastAPI(
    title=settings.SERVICE_NAME,
    version="0.1.0",
    debug=settings.DEBUG,
    description="FitMirror AI microservice — replaceable model abstraction for "
    "virtual try-on and (in later phases) other AI-driven features.",
)

app.add_middleware(RequestIDMiddleware)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception while processing request: %s", request.url)
    return JSONResponse(
        status_code=500, content={"error_code": "internal_error", "message": str(exc)}
    )


@app.get("/", tags=["Health"])
def root():
    return {"service": settings.SERVICE_NAME, "status": "ok"}


app.include_router(api_router, prefix="/api/v1")
