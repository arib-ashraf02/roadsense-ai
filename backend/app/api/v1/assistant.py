from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.exc import SQLAlchemyError, OperationalError

from app.core.database import get_db
from app.models.detection import PotholeDetection, SeverityEnum
from app.models.complaint import Complaint, ComplaintStatus
from app.models.ticket import Ticket, TicketPriority, TicketStatus
from app.models.spatial import SpatialCluster
from app.models.user import User
from app.api.deps import get_current_user_optional

router = APIRouter()


class ChatQuery(BaseModel):
    query: Optional[str] = None
    message: Optional[str] = None


@router.get("/status")
async def assistant_status(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Health check and connectivity probe for the AI Municipal Assistant.
    Verifies that the database and telemetry services are operational.
    """
    try:
        potholes_count = await db.scalar(select(func.count(PotholeDetection.id))) or 0
        complaints_count = await db.scalar(select(func.count(Complaint.id))) or 0
        tickets_count = await db.scalar(select(func.count(Ticket.id))) or 0
        return {
            "status": "online",
            "service": "RoadSense AI Municipal Assistant",
            "database_connected": True,
            "telemetry_available": True,
            "records": {
                "potholes": potholes_count,
                "complaints": complaints_count,
                "tickets": tickets_count,
            },
        }
    except OperationalError as oe:
        return {
            "status": "degraded",
            "service": "RoadSense AI Municipal Assistant",
            "database_connected": False,
            "error_type": "DATABASE_CONNECTION_ERROR",
            "detail": str(oe),
        }
    except Exception as e:
        return {
            "status": "error",
            "service": "RoadSense AI Municipal Assistant",
            "database_connected": False,
            "error_type": "SERVICE_ERROR",
            "detail": str(e),
        }


@router.post("/chat")
async def assistant_chat(
    payload: ChatQuery,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> Dict[str, Any]:
    """
    AI Municipal Assistant for natural language querying of live road telemetry,
    defect risk prioritization, SLA compliance tracking, and complaint backlogs.
    Uses real database records and provides specific domain knowledge.
    """
    query = (payload.query or payload.message or "").strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query string cannot be empty.",
        )

    query_lower = query.lower()

    # Step 1: Query live telemetry with specific error categorization
    try:
        # Pothole counts by severity
        total_potholes = await db.scalar(select(func.count(PotholeDetection.id))) or 0
        critical_potholes = await db.scalar(
            select(func.count(PotholeDetection.id)).where(PotholeDetection.severity == SeverityEnum.CRITICAL)
        ) or 0
        high_potholes = await db.scalar(
            select(func.count(PotholeDetection.id)).where(PotholeDetection.severity == SeverityEnum.HIGH)
        ) or 0
        medium_potholes = await db.scalar(
            select(func.count(PotholeDetection.id)).where(PotholeDetection.severity == SeverityEnum.MEDIUM)
        ) or 0
        low_potholes = await db.scalar(
            select(func.count(PotholeDetection.id)).where(PotholeDetection.severity == SeverityEnum.LOW)
        ) or 0

        # Recent critical detections for rich inspection
        crit_res = await db.execute(
            select(PotholeDetection)
            .where(PotholeDetection.severity.in_([SeverityEnum.CRITICAL, SeverityEnum.HIGH]))
            .order_by(desc(PotholeDetection.detected_at))
            .limit(4)
        )
        recent_critical = crit_res.scalars().all()

        # Complaints breakdown
        total_complaints = await db.scalar(select(func.count(Complaint.id))) or 0
        complaints_submitted = await db.scalar(
            select(func.count(Complaint.id)).where(Complaint.status == ComplaintStatus.SUBMITTED)
        ) or 0
        complaints_triaged = await db.scalar(
            select(func.count(Complaint.id)).where(Complaint.status == ComplaintStatus.TRIAGED)
        ) or 0
        complaints_in_progress = await db.scalar(
            select(func.count(Complaint.id)).where(Complaint.status == ComplaintStatus.IN_PROGRESS)
        ) or 0
        complaints_resolved = await db.scalar(
            select(func.count(Complaint.id)).where(Complaint.status == ComplaintStatus.RESOLVED)
        ) or 0
        complaints_backlog = complaints_submitted + complaints_triaged + complaints_in_progress

        # Tickets breakdown
        total_tickets = await db.scalar(select(func.count(Ticket.id))) or 0
        open_tickets = await db.scalar(
            select(func.count(Ticket.id)).where(Ticket.status.in_([TicketStatus.OPEN, TicketStatus.ASSIGNED]))
        ) or 0
        in_repair_tickets = await db.scalar(
            select(func.count(Ticket.id)).where(Ticket.status == TicketStatus.IN_REPAIR)
        ) or 0
        critical_tickets = await db.scalar(
            select(func.count(Ticket.id)).where(Ticket.priority == TicketPriority.CRITICAL)
        ) or 0
        high_tickets = await db.scalar(
            select(func.count(Ticket.id)).where(Ticket.priority == TicketPriority.HIGH)
        ) or 0

        # Spatial clusters
        clusters_count = await db.scalar(select(func.count(SpatialCluster.id))) or 0

    except OperationalError as oe:
        return {
            "reply": (
                "⚠️ **Database Connection Failure**: Unable to communicate with the municipal storage engine. "
                "The database server may be temporarily offline or restarting. Please verify the backend service connection."
            ),
            "recommendations": ["Verify PostgreSQL / SQLite connection", "Retry query in a few moments"],
            "telemetry_snapshot": None,
            "status": "error",
            "error_type": "DATABASE_CONNECTION_ERROR",
        }
    except SQLAlchemyError as se:
        return {
            "reply": (
                f"⚠️ **SQL Query Execution Error**: A database telemetry query failed to execute ({str(se.__class__.__name__)}). "
                "Please check the database schema and query integrity."
            ),
            "recommendations": ["Check server logs", "Retry query"],
            "telemetry_snapshot": None,
            "status": "error",
            "error_type": "SQL_QUERY_ERROR",
        }

    # Step 2: Check for empty telemetry
    if total_potholes == 0 and total_complaints == 0 and total_tickets == 0:
        return {
            "reply": (
                "ℹ️ **No Telemetry Records Available**: The municipal database currently has no recorded road defects, "
                "citizen complaints, or maintenance tickets. You can upload road images or videos via the citizen/officer portals "
                "to trigger AI detection and populate telemetry."
            ),
            "recommendations": ["Submit a defect report", "Upload road inspection video"],
            "telemetry_snapshot": {
                "total_potholes": 0,
                "critical_potholes": 0,
                "total_complaints": 0,
                "open_tickets": 0,
                "is_estimate": False,
            },
            "status": "empty",
            "error_type": "EMPTY_TELEMETRY",
        }

    # Step 3: Intent Analysis and Telemetry-Backed RAG Response Construction

    # 1. Critical Potholes
    if any(k in query_lower for k in ["critical", "how many critical", "danger", "hazard", "severity"]):
        loc_details = ""
        if recent_critical:
            loc_list = []
            for d in recent_critical:
                coord = f"({d.latitude:.4f}, {d.longitude:.4f})" if d.latitude and d.longitude else "Pending GPS"
                conf = f"{int(d.confidence * 100)}%" if d.confidence else "N/A"
                loc_list.append(f"• Defect `{d.id[:8]}` at {coord} — Confidence: {conf} ({d.severity.value})")
            loc_details = "\n\n**Recent High/Critical Defect Locations:**\n" + "\n".join(loc_list)

        reply = (
            f"Based on real-time computer vision telemetry, there are currently **{critical_potholes} critical-grade potholes** "
            f"and **{high_potholes} high-severity defects** detected across the municipal jurisdiction out of **{total_potholes} total detections**.\n\n"
            f"**Severity Breakdown:**\n"
            f"• 🔴 Critical: **{critical_potholes}** (Immediate safety hazard)\n"
            f"• 🟠 High: **{high_potholes}** (Rapid road surface deterioration)\n"
            f"• 🟡 Medium: **{medium_potholes}** (Scheduled intervention required)\n"
            f"• 🟢 Low: **{low_potholes}** (Surface monitoring phase)"
            f"{loc_details}\n\n"
            f"**Action Required**: In accordance with municipal guidelines, critical-grade defects on arterial corridors must be addressed under our **24-hour emergency SLA** to prevent vehicular damage and accidents."
        )
        recommendations = [
            "Which road defects require immediate attention?",
            "What is our active maintenance SLA?",
            "Summarize citizen complaint backlog",
        ]

    # 2. Citizen Complaint Backlog
    elif any(k in query_lower for k in ["complaint", "backlog", "grievance", "citizen"]):
        resolution_rate = int((complaints_resolved / total_complaints) * 100) if total_complaints > 0 else 0
        reply = (
            f"Citizens have submitted **{total_complaints} total road grievances**.\n\n"
            f"**Backlog & Resolution Status:**\n"
            f"• 📥 Awaiting Officer Triage: **{complaints_submitted}**\n"
            f"• 📋 Triaged & Validated: **{complaints_triaged}**\n"
            f"• 🛠️ Under Active Repair: **{complaints_in_progress}**\n"
            f"• ✅ Successfully Resolved: **{complaints_resolved}** ({resolution_rate}% resolution rate)\n\n"
            f"The active complaint backlog stands at **{complaints_backlog} grievances**. "
            f"Our automated **15-meter DBSCAN spatial clustering** has grouped duplicate reports across identical road coordinates into **{clusters_count} distinct hot-spot clusters**, avoiding duplicate crew dispatches."
        )
        recommendations = [
            "How many critical potholes are detected?",
            "What is our active maintenance SLA?",
            "Give me a summary of current road conditions",
        ]

    # 3. Maintenance SLA
    elif any(k in query_lower for k in ["sla", "turnaround", "deadline", "maintenance sla", "dispatch"]):
        reply = (
            f"The RoadSense AI Municipal Operations SLA framework defines strict turnaround targets by defect priority:\n\n"
            f"• 🔴 **CRITICAL Severity**: **24 hours** turnaround (Immediate hazard to two-wheelers and high-speed traffic)\n"
            f"• 🟠 **HIGH Severity**: **48 hours** turnaround (Structural pavement failure)\n"
            f"• 🟡 **MEDIUM Severity**: **7 calendar days** (Standard asphalt patch repair)\n"
            f"• 🟢 **LOW Severity**: **14 calendar days** (Preventative crack sealing and monitoring)\n\n"
            f"**Current Operational Workload:**\n"
            f"• Active Work Orders: **{open_tickets}** awaiting dispatch or assignment\n"
            f"• Crews In Field: **{in_repair_tickets}** jobs in progress\n"
            f"• High/Critical Priority Tickets: **{critical_tickets + high_tickets}**\n\n"
            f"Teams must upload mandatory **'after-repair' photo evidence** to trigger AI verification before any work order can be officially closed."
        )
        recommendations = [
            "Which road defects require immediate attention?",
            "Summarize citizen complaint backlog",
            "Give me a summary of current road conditions",
        ]

    # 4. Immediate Attention / Road Defects
    elif any(k in query_lower for k in ["immediate", "attention", "urgent", "priority", "defect"]):
        urgent_list = []
        if recent_critical:
            for d in recent_critical:
                coord = f"({d.latitude:.4f}, {d.longitude:.4f})" if d.latitude and d.longitude else "Pending GPS"
                urgent_list.append(f"• **Defect ID `{d.id[:8]}`** — Severity: **{d.severity.value}** at {coord}")
        urgent_text = "\n".join(urgent_list) if urgent_list else f"• {critical_potholes} critical defects flagged in database."

        reply = (
            f"**Priority Escalation**: The following road defects require immediate municipal dispatch:\n\n"
            f"{urgent_text}\n\n"
            f"**Key Findings**:\n"
            f"• **{critical_potholes} Critical Defects** and **{high_potholes} High Severity Defects** detected.\n"
            f"• **{critical_tickets} Critical Work Orders** currently open in the maintenance queue.\n"
            f"• **{clusters_count} Spatial Clusters** have been formed by DBSCAN clustering to bundle nearby repairs.\n\n"
            f"**Recommendation**: Dispatch maintenance teams to the highest-density spatial cluster and issue temporary warning beacons for night-time safety."
        )
        recommendations = [
            "How many critical potholes are detected?",
            "What is our active maintenance SLA?",
            "Summarize citizen complaint backlog",
        ]

    # 5. Summary of Current Road Conditions
    elif any(k in query_lower for k in ["summary", "road condition", "overview", "condition", "status", "health"]):
        score = max(30, min(95, 100 - (critical_potholes * 8 + high_potholes * 4 + medium_potholes * 2)))
        reply = (
            f"### RoadSense AI — Municipal Road Infrastructure Assessment\n\n"
            f"• **Overall Municipal Road Health Score**: **{score}/100**\n"
            f"• **Total Potholes Detected**: **{total_potholes}**\n"
            f"• **Critical Hazards**: **{critical_potholes}** (🔴 Urgent 24h SLA)\n"
            f"• **High/Medium Severity**: **{high_potholes + medium_potholes}**\n"
            f"• **Spatial Hot-Spot Clusters**: **{clusters_count}**\n"
            f"• **Citizen Grievance Volume**: **{total_complaints}** ({complaints_resolved} resolved)\n"
            f"• **Active Maintenance Work Orders**: **{open_tickets}** open, **{in_repair_tickets}** undergoing repair\n\n"
            f"**Infrastructure Summary**: Pothole density is concentrated in clustered zones. Municipal officers should prioritize dispatching hot-mix repair teams to the top spatial clusters to maximize repair efficiency per kilometer."
        )
        recommendations = [
            "How many critical potholes are detected?",
            "Summarize citizen complaint backlog",
            "What is our active maintenance SLA?",
            "Which road defects require immediate attention?",
        ]

    # 6. Greetings and Capability Overview
    elif any(k in query_lower for k in ["hello", "hi", "who are you", "help", "what can you do"]):
        reply = (
            f"Hello! I am the **RoadSense AI Municipal Co-Pilot**. I am connected directly to your municipal PostgreSQL/SQLite "
            f"telemetry database.\n\n"
            f"**Current City Snapshot:**\n"
            f"• Detected Defects: **{total_potholes}** ({critical_potholes} critical)\n"
            f"• Citizen Complaints: **{total_complaints}** ({complaints_backlog} active)\n"
            f"• Work Orders: **{open_tickets}** open tickets across **{clusters_count}** clusters\n\n"
            f"Ask me any question regarding defect counts, citizen grievances, maintenance SLAs, or road conditions."
        )
        recommendations = [
            "How many critical potholes are detected?",
            "Summarize citizen complaint backlog",
            "What is our active maintenance SLA?",
            "Which road defects require immediate attention?",
            "Give me a summary of current road conditions.",
        ]

    # 7. Default Fallback with Comprehensive Context
    else:
        reply = (
            f"RoadSense AI status: **{total_potholes} potholes detected** ({critical_potholes} critical, {high_potholes} high), "
            f"**{total_complaints} citizen grievances logged** ({complaints_backlog} unresolved backlog), "
            f"and **{open_tickets} active municipal work orders** across **{clusters_count} spatial clusters**.\n\n"
            f"I can analyze real database telemetry for any of the following queries:"
        )
        recommendations = [
            "How many critical potholes are detected?",
            "Summarize citizen complaint backlog",
            "What is our active maintenance SLA?",
            "Which road defects require immediate attention?",
            "Give me a summary of current road conditions.",
        ]

    return {
        "reply": reply,
        "response": reply,
        "recommendations": recommendations,
        "telemetry_snapshot": {
            "total_potholes": total_potholes,
            "critical_potholes": critical_potholes,
            "high_potholes": high_potholes,
            "medium_potholes": medium_potholes,
            "low_potholes": low_potholes,
            "total_complaints": total_complaints,
            "complaints_backlog": complaints_backlog,
            "complaints_resolved": complaints_resolved,
            "open_tickets": open_tickets,
            "in_repair_tickets": in_repair_tickets,
            "critical_tickets": critical_tickets,
            "spatial_clusters": clusters_count,
            "is_estimate": False,
        },
        "status": "connected",
        "error_type": None,
    }
