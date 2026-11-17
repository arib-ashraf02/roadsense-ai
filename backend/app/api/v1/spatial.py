from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.detection import PotholeDetection
from app.models.spatial import SpatialCluster, RoadSegment
from app.models.ticket import Ticket, TicketStatus
from app.services.spatial_service import find_duplicate_ticket, haversine_distance_meters

router = APIRouter()


@router.get("/potholes")
async def get_geotagged_potholes(
    min_lat: Optional[float] = Query(None),
    max_lat: Optional[float] = Query(None),
    min_lon: Optional[float] = Query(None),
    max_lon: Optional[float] = Query(None),
    severity: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns actual geotagged pothole detections for rendering on GIS/Leaflet maps.
    Only returns points with valid coordinates (never invented).
    """
    stmt = select(PotholeDetection).where(
        PotholeDetection.latitude.isnot(None),
        PotholeDetection.longitude.isnot(None)
    )

    if severity:
        stmt = stmt.where(PotholeDetection.severity == severity.upper())

    if min_lat is not None and max_lat is not None:
        stmt = stmt.where(PotholeDetection.latitude.between(min_lat, max_lat))
    if min_lon is not None and max_lon is not None:
        stmt = stmt.where(PotholeDetection.longitude.between(min_lon, max_lon))

    stmt = stmt.order_by(desc(PotholeDetection.detected_at)).limit(limit)
    result = await db.execute(stmt)
    detections = result.scalars().all()

    return [
        {
            "id": d.id,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "severity": d.severity.value if hasattr(d.severity, "value") else str(d.severity),
            "confidence": d.confidence,
            "estimated_area_sqm": d.estimated_area_sqm,
            "is_duplicate": d.is_duplicate,
            "cluster_id": d.cluster_id,
            "ticket_id": d.ticket_id,
            "annotated_image_url": d.annotated_image_url,
            "raw_image_url": d.raw_image_url,
            "detected_at": d.detected_at.isoformat() if d.detected_at else None
        }
        for d in detections
    ]


@router.get("/clusters")
async def get_spatial_clusters(
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns spatial clusters for map heatmaps and ward road quality aggregation.
    """
    stmt = select(SpatialCluster).order_by(desc(SpatialCluster.detection_count)).limit(limit)
    result = await db.execute(stmt)
    clusters = result.scalars().all()

    return [
        {
            "id": c.id,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "radius_meters": c.radius_meters,
            "detection_count": c.detection_count,
            "ward_identifier": c.ward_identifier,
            "last_seen_at": c.last_seen_at.isoformat() if c.last_seen_at else None
        }
        for c in clusters
    ]


@router.post("/check-duplicate")
async def check_spatial_duplicate(
    latitude: float,
    longitude: float,
    radius_meters: float = Query(12.0, ge=1.0, le=50.0),
    db: AsyncSession = Depends(get_db)
):
    """
    Checks if a defect coordinate is within radial proximity of an existing active ticket.
    """
    dup = await find_duplicate_ticket(db, latitude, longitude, radius_meters)
    if dup:
        ticket, distance = dup
        return {
            "is_duplicate": True,
            "distance_meters": distance,
            "matched_ticket": {
                "id": ticket.id,
                "ticket_number": ticket.ticket_number,
                "title": ticket.title,
                "priority": ticket.priority.value if hasattr(ticket.priority, "value") else str(ticket.priority),
                "status": ticket.status.value if hasattr(ticket.status, "value") else str(ticket.status)
            }
        }
    return {
        "is_duplicate": False,
        "distance_meters": None,
        "matched_ticket": None
    }
