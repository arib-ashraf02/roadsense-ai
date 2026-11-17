from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter()


@router.get("", summary="System Health Check")
def health_check():
    """
    Returns the operational status and service telemetry of the RoadSense AI Backend.
    """
    return {
        "status": "healthy",
        "service": "RoadSense AI Backend",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {
            "api_gateway": "operational",
            "vision_engine": "ready",
            "spatial_engine": "standby",
            "database": "standby"
        }
    }
