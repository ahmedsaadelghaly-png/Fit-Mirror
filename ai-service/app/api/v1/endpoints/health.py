from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("")
def health():
    return {
        "status": "ok",
        "service": settings.SERVICE_NAME,
        "active_model": settings.TRYON_MODEL_NAME,
    }
