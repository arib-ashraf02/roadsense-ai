from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.detection import router as detection_router
from app.api.v1.uploads import router as uploads_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.tickets import router as tickets_router
from app.api.v1.repairs import router as repairs_router
from app.api.v1.spatial import router as spatial_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.assistant import router as assistant_router
from app.api.v1.users import router as users_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(detection_router, prefix="/detection", tags=["AI Detection"])
api_router.include_router(uploads_router, prefix="/uploads", tags=["Uploads & Ingestion"])
api_router.include_router(complaints_router, prefix="/complaints", tags=["Complaints"])
api_router.include_router(tickets_router, prefix="/tickets", tags=["Maintenance Tickets"])
api_router.include_router(repairs_router, prefix="/repairs", tags=["Repair Verification"])
api_router.include_router(spatial_router, prefix="/spatial", tags=["Spatial & GIS"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(assistant_router, prefix="/assistant", tags=["AI Municipal Assistant"])
api_router.include_router(users_router, prefix="/users", tags=["Users & Wards"])
