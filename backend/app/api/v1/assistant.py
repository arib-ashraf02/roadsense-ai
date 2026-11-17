from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.detection import PotholeDetection, SeverityEnum
from app.models.complaint import Complaint, ComplaintStatus
from app.models.ticket import Ticket, TicketPriority, TicketStatus
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()


class ChatQuery(BaseModel):
    query: str


@router.post("/chat")
async def assistant_chat(
    payload: ChatQuery,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    AI Municipal Assistant for natural language querying of road telemetry,
    complaint tracking, and risk-based maintenance prioritization.
    """
    query_lower = payload.query.lower()

    # Query real database aggregates
    total_potholes = await db.scalar(select(func.count(PotholeDetection.id))) or 0
    critical_potholes = await db.scalar(
        select(func.count(PotholeDetection.id)).where(PotholeDetection.severity == SeverityEnum.CRITICAL)
    ) or 0
    total_complaints = await db.scalar(select(func.count(Complaint.id))) or 0
    open_tickets = await db.scalar(
        select(func.count(Ticket.id)).where(Ticket.status.in_([TicketStatus.OPEN, TicketStatus.ASSIGNED]))
    ) or 0

    # Rule-based natural language intent resolver backed by real DB telemetry
    if "critical" in query_lower or "danger" in query_lower or "hazard" in query_lower:
        response_text = (
            f"Based on real-time computer vision telemetry, there are currently **{critical_potholes} critical-grade potholes** "
            f"recorded across the municipal jurisdiction out of {total_potholes} total detections. "
            f"These defects pose high risk to two-wheelers and high-speed traffic. Prioritize dispatching maintenance teams to tickets with CRITICAL status."
        )
        recommendations = [
            "Review Critical Maintenance Tickets immediately",
            "Enforce 24-hour repair SLA for arterial road corridors",
            "Deploy warning signage at cluster hotspots"
        ]

    elif "complaint" in query_lower or "grievance" in query_lower or "citizen" in query_lower:
        resolved_count = await db.scalar(
            select(func.count(Complaint.id)).where(Complaint.status == ComplaintStatus.RESOLVED)
        ) or 0
        response_text = (
            f"Citizens have submitted **{total_complaints} total complaints**. "
            f"Currently, **{resolved_count} have been resolved**, leaving **{total_complaints - resolved_count} open or undergoing review**. "
            f"Automated spatial deduplication has helped prevent duplicate ticketing by clustering adjacent reports within 12 meters."
        )
        recommendations = [
            "Triage submitted complaints in the Municipal Officer dashboard",
            "Convert validated citizen reports into maintenance tickets"
        ]

    elif "sla" in query_lower or "delay" in query_lower or "pending" in query_lower:
        response_text = (
            f"There are **{open_tickets} work orders** currently awaiting dispatch or actively in repair. "
            f"Recommended SLA targets: Critical (24h), High (48h), Medium (7 days), Low (14 days). "
            f"Ensure field teams submit 'after-repair' photo proof for AI verification upon completion."
        )
        recommendations = [
            "Check maintenance team workload distribution",
            "Review overdue work orders in Tickets section"
        ]

    else:
        response_text = (
            f"RoadSense AI status: **{total_potholes} potholes detected**, **{total_complaints} citizen grievances logged**, "
            f"and **{open_tickets} active municipal maintenance tickets**. "
            f"You can ask me about critical potholes, citizen complaints, SLA deadlines, or ward-specific risk analysis."
        )
        recommendations = [
            "Show critical potholes",
            "Summarize citizen complaints",
            "What is our active maintenance backlog?"
        ]

    return {
        "reply": response_text,
        "recommendations": recommendations,
        "telemetry_snapshot": {
            "total_potholes": total_potholes,
            "critical_potholes": critical_potholes,
            "total_complaints": total_complaints,
            "open_tickets": open_tickets,
            "is_estimate": False
        }
    }
