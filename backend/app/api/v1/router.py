from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    auth,
    catalog,
    shopping,
    sizing,
    store_dashboard,
    stylist,
    tryon,
    users,
    wardrobe,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(wardrobe.router, prefix="/wardrobe", tags=["Smart Wardrobe"])
api_router.include_router(tryon.router, prefix="/tryon", tags=["Virtual Try-On"])
api_router.include_router(stylist.router, prefix="/stylist", tags=["AI Stylist"])
api_router.include_router(sizing.router, prefix="/sizing", tags=["Size Recommendation"])
api_router.include_router(shopping.router, prefix="/shopping", tags=["Shopping Assistant"])
api_router.include_router(store_dashboard.router, prefix="/store", tags=["Store Dashboard"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["Catalog"])
api_router.include_router(admin.router, prefix="/admin", tags=["Platform Admin"])
