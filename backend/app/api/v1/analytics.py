from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.models.detection import PotholeDetection, SeverityEnum
from app.models.complaint import Complaint, ComplaintStatus
from app.models.ticket import Ticket, TicketStatus, TicketPriority
from app.models.repair import Repair
from app.models.spatial import SpatialCluster

router = APIRouter()


@router.get("/overview")
async def get_analytics_overview(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns high-level platform telemetry computed directly from database tables.
    Never hardcoded.
    """
    # 1. Total detected potholes
    potholes_count = await db.scalar(select(func.count(PotholeDetection.id))) or 0

    # 2. Complaints by status
    total_complaints = await db.scalar(select(func.count(Complaint.id))) or 0
    resolved_complaints = await db.scalar(
        select(func.count(Complaint.id)).where(Complaint.status == ComplaintStatus.RESOLVED)
    ) or 0
    open_complaints = total_complaints - resolved_complaints

    # 3. Tickets by status
    total_tickets = await db.scalar(select(func.count(Ticket.id))) or 0
    pending_tickets = await db.scalar(
        select(func.count(Ticket.id)).where(
            Ticket.status.in_([TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_REPAIR])
        )
    ) or 0
    closed_tickets = await db.scalar(
        select(func.count(Ticket.id)).where(Ticket.status == TicketStatus.CLOSED)
    ) or 0

    # 4. Total completed repairs
    total_repairs = await db.scalar(select(func.count(Repair.id))) or 0

    # 5. Total clusters
    total_clusters = await db.scalar(select(func.count(SpatialCluster.id))) or 0

    return {
        "total_potholes": potholes_count,
        "complaints": {
            "total": total_complaints,
            "open": open_complaints,
            "resolved": resolved_complaints,
            "resolution_rate_pct": round((resolved_complaints / total_complaints * 100), 1) if total_complaints > 0 else 0.0
        },
        "tickets": {
            "total": total_tickets,
            "pending": pending_tickets,
            "closed": closed_tickets
        },
        "repairs_submitted": total_repairs,
        "spatial_clusters": total_clusters
    }


@router.get("/severity")
async def get_severity_distribution(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Returns actual counts per severity grade (LOW, MEDIUM, HIGH, CRITICAL).
    """
    stmt = select(
        PotholeDetection.severity,
        func.count(PotholeDetection.id)
    ).group_by(PotholeDetection.severity)

    result = await db.execute(stmt)
    rows = result.all()

    counts = {s.value: 0 for s in SeverityEnum}
    for sev, count in rows:
        key = sev.value if hasattr(sev, "value") else str(sev)
        counts[key] = count

    colors = {
        "LOW": "#10b981",
        "MEDIUM": "#f59e0b",
        "HIGH": "#f97316",
        "CRITICAL": "#ef4444"
    }

    return [
        {"severity": k.capitalize(), "count": counts[k], "color": colors[k]}
        for k in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    ]


@router.get("/trends")
async def get_monthly_trends(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Returns time-series defect detection and resolution trends.
    """
    # Group by date for recent 7 days / weekly windows
    # Since SQLite/Postgres date formatting varies, we compute past 7 days buckets
    today = datetime.now(timezone.utc).date()
    days = [(today - timedelta(days=i)) for i in range(6, -1, -1)]

    trend_data = []
    for d in days:
        start_dt = datetime.combine(d, datetime.min.time(), tzinfo=timezone.utc)
        end_dt = datetime.combine(d, datetime.max.time(), tzinfo=timezone.utc)

        detected = await db.scalar(
            select(func.count(PotholeDetection.id)).where(
                PotholeDetection.detected_at.between(start_dt, end_dt)
            )
        ) or 0

        complaints = await db.scalar(
            select(func.count(Complaint.id)).where(
                Complaint.created_at.between(start_dt, end_dt)
            )
        ) or 0

        resolved = await db.scalar(
            select(func.count(Ticket.id)).where(
                Ticket.resolved_at.between(start_dt, end_dt)
            )
        ) or 0

        trend_data.append({
            "date": d.strftime("%b %d"),
            "detections": detected,
            "complaints": complaints,
            "resolved": resolved
        })

    return trend_data


@router.get("/wards")
async def get_ward_risk_analysis(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Returns road condition metrics grouped by municipal ward.
    """
    stmt = select(
        Ticket.ward_identifier,
        func.count(Ticket.id),
        func.sum(case_critical := func.sum(1)) # placeholder for aggregation
    ).group_by(Ticket.ward_identifier)

    # Simplified ward metrics querying tickets directly
    tkt_stmt = select(Ticket)
    res = await db.execute(tkt_stmt)
    all_tickets = res.scalars().all()

    ward_map = {}
    for t in all_tickets:
        w = t.ward_identifier or "Unassigned Ward"
        if w not in ward_map:
            ward_map[w] = {"ward": w, "total_tickets": 0, "critical": 0, "open": 0}
        ward_map[w]["total_tickets"] += 1
        if t.priority == TicketPriority.CRITICAL:
            ward_map[w]["critical"] += 1
        if t.status in [TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_REPAIR]:
            ward_map[w]["open"] += 1

    return list(ward_map.values())
