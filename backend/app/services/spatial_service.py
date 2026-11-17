import math
from typing import Optional, List, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ticket import Ticket, TicketStatus
from app.models.spatial import SpatialCluster


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in meters between two points 
    on the earth (specified in decimal degrees).
    """
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


async def find_duplicate_ticket(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    radius_meters: float = 12.0
) -> Optional[Tuple[Ticket, float]]:
    """
    Finds if an active ticket exists within radial threshold (e.g., 12m) of given coordinates.
    Returns (Ticket, distance_meters) or None.
    """
    # Query non-closed, non-rejected tickets
    stmt = select(Ticket).where(
        Ticket.status.notin_([TicketStatus.CLOSED, TicketStatus.REJECTED])
    )
    result = await db.execute(stmt)
    active_tickets = result.scalars().all()

    closest_ticket = None
    min_dist = float("inf")

    for ticket in active_tickets:
        if ticket.latitude is not None and ticket.longitude is not None:
            dist = haversine_distance_meters(latitude, longitude, ticket.latitude, ticket.longitude)
            if dist <= radius_meters and dist < min_dist:
                min_dist = dist
                closest_ticket = ticket

    if closest_ticket:
        return closest_ticket, round(min_dist, 2)
    return None


async def get_or_create_cluster(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    ward_identifier: Optional[str] = None,
    cluster_radius: float = 15.0
) -> SpatialCluster:
    """
    Finds nearest spatial cluster or initializes a new cluster.
    """
    stmt = select(SpatialCluster)
    res = await db.execute(stmt)
    clusters = res.scalars().all()

    for cluster in clusters:
        dist = haversine_distance_meters(latitude, longitude, cluster.latitude, cluster.longitude)
        if dist <= cluster_radius:
            cluster.detection_count += 1
            await db.commit()
            await db.refresh(cluster)
            return cluster

    # Create new cluster
    new_cluster = SpatialCluster(
        latitude=latitude,
        longitude=longitude,
        radius_meters=cluster_radius,
        detection_count=1,
        ward_identifier=ward_identifier
    )
    db.add(new_cluster)
    await db.commit()
    await db.refresh(new_cluster)
    return new_cluster
