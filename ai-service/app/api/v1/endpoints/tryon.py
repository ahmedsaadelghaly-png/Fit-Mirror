from fastapi import APIRouter, HTTPException

from app.core.logging_config import get_logger
from app.models.model_registry import get_tryon_pipeline
from app.pipelines.base_pipeline import TryOnInput
from app.schemas.tryon import TryOnGenerateRequest, TryOnGenerateResponse

router = APIRouter()
logger = get_logger(__name__)


@router.post("/generate", response_model=TryOnGenerateResponse)
def generate_tryon(payload: TryOnGenerateRequest):
    """
    Synchronous try-on generation call, invoked by the backend's Celery
    worker (not directly by end users). The backend owns job lifecycle and
    retries; this endpoint just does one unit of AI work and returns.
    """
    pipeline = get_tryon_pipeline()

    try:
        result = pipeline.run(
            TryOnInput(
                job_id=payload.job_id,
                user_image_key=payload.user_image_key,
                garment_image_key=payload.garment_image_key,
            )
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Try-on pipeline failed for job=%s", payload.job_id)
        raise HTTPException(status_code=500, detail=f"Try-on generation failed: {exc}") from exc

    return TryOnGenerateResponse(
        job_id=payload.job_id,
        result_image_key=result.result_image_key,
        model_name=result.model_name,
    )
