"""
Application configuration.

All configuration is sourced from environment variables (see .env.example).
Never hardcode secrets or environment-specific values in code.
"""

from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- General ---
    PROJECT_NAME: str = "FitMirror AI Backend"
    ENVIRONMENT: str = Field(default="development")
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    # --- Security / JWT ---
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # --- Database ---
    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # --- Redis / Celery ---
    REDIS_URL: str
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    # --- AI Service ---
    AI_SERVICE_BASE_URL: AnyHttpUrl
    # Hosted diffusion try-on takes 30-90s; the AI service gives up at 150s.
    AI_SERVICE_TIMEOUT_SECONDS: int = 180

    # --- Object Storage (S3-compatible) ---
    STORAGE_PROVIDER: str = "s3"
    S3_ENDPOINT_URL: str
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_BUCKET_NAME: str
    S3_REGION: str = "us-east-1"
    S3_USE_SSL: bool = True
    S3_PUBLIC_BASE_URL: str = ""
    # Optional. Presigned PUT URLs are signed against S3_ENDPOINT_URL's host —
    # fine for server-to-server calls, but in Docker Compose that host is the
    # internal service name ("minio"), which a real browser can't resolve.
    # Set this to the browser-reachable endpoint (e.g. http://localhost:9000)
    # so upload URLs are signed against a host the client can actually reach.
    # Leave unset to fall back to S3_ENDPOINT_URL (no behavior change).
    S3_PUBLIC_ENDPOINT_URL: str = ""

    # --- Email (password reset, contact form) ---
    # "log" writes each email to the application log instead of sending it
    # (local dev / CI); "smtp" delivers through the SMTP_* server below.
    EMAIL_BACKEND: str = "log"  # "log" | "smtp"
    EMAIL_FROM: str = "FitMirror AI <no-reply@fitmirror.ai>"
    SUPPORT_EMAIL: str = "support@fitmirror.ai"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    # Links in emails (e.g. /reset-password) point at the web app here.
    FRONTEND_BASE_URL: str = "http://localhost:3000"
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30

    # --- CORS ---
    CORS_ORIGINS: list[str] = ["*"]

    # --- Logging ---
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "text"  # "text" | "json"

    # --- Security hardening (Phase 1.5 placeholders — see DEVELOPMENT.md) ---
    RATE_LIMIT_ENABLED: bool = False
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 120
    SECURE_HEADERS_ENABLED: bool = False
    BCRYPT_ROUNDS: int = 12

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance. Import this everywhere instead of instantiating Settings directly."""
    return Settings()


settings = get_settings()
