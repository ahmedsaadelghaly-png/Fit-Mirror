from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SERVICE_NAME: str = "FitMirror AI Service"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "text"  # "text" | "json"

    # Which pipeline implementation to use for try-on generation.
    # This is the whole point of the abstraction: swap "placeholder" for
    # "diffusion_v1", "viton_hd", etc. later without changing calling code.
    TRYON_MODEL_NAME: str = "placeholder"

    # --- Object Storage (S3-compatible) — same bucket family as the backend ---
    S3_ENDPOINT_URL: str
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_BUCKET_NAME: str
    S3_REGION: str = "us-east-1"
    S3_USE_SSL: bool = True

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
