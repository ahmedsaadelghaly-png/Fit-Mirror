from fastapi import APIRouter

from app.api.v1.endpoints import health, tryon

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(tryon.router, prefix="/tryon", tags=["Virtual Try-On"])
