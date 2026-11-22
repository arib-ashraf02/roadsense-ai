import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.models.ticket import Ticket, TicketPriority, TicketStatus
from app.models.user import User, UserRole
from app.schemas.ticket import TicketCreate, TicketOut, TicketUpdate
from app.api.deps import get_current_user, require_role
from app.services.notification_service import create_notification

router = APIRouter()


@router.post("/", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    payload: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))
):
    """
    Municipal Officer creates a maintenance work order.
    """
    # Auto-generate human-readable ticket number (e.g. TKT-202611-A1B2)
    tkt_num = f"TKT-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

    ticket = Ticket(
        ticket_number=tkt_num,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status=TicketStatus.OPEN,
        latitude=payload.latitude,
        longitude=payload.longitude,
        ward_identifier=payload.ward_identifier,
        assigned_officer_id=current_user.id,
        assigned_team_lead_id=payload.assigned_team_lead_id,
        sla_deadline=payload.sla_deadline
    )

    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    # Link to complaint if specified
    linked_comp_id = payload.complaint_id or payload.complaintId
    if linked_comp_id:
        from app.models.complaint import Complaint, ComplaintStatus
        comp_res = await db.execute(select(Complaint).where(Complaint.id == linked_comp_id))
        comp = comp_res.scalar_one_or_none()
        if comp:
            comp.ticket_id = ticket.id
            comp.status = ComplaintStatus.TRIAGED
            await db.commit()

    # If assigned to team lead on creation, notify team lead
    if ticket.assigned_team_lead_id:
        await create_notification(
            db,
            user_id=ticket.assigned_team_lead_id,
            notif_type="TICKET_ASSIGNED",
            title="New Maintenance Ticket Assigned",
            message=f"Work order {ticket.ticket_number} ({ticket.priority.value}) has been assigned to you.",
            related_id=ticket.id,
            related_type="TICKET"
        )

    return ticket


@router.get("/", response_model=List[TicketOut])
async def list_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[TicketStatus] = None,
    priority_filter: Optional[TicketPriority] = None,
    ward_filter: Optional[str] = None,
    assigned_to_me: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve tickets. Maintenance teams see assigned tasks; officers/admins see ward or citywide.
    """
    stmt = select(Ticket).order_by(desc(Ticket.created_at))

    if assigned_to_me or current_user.role == UserRole.MAINTENANCE:
        stmt = stmt.where(Ticket.assigned_team_lead_id == current_user.id)

    if status_filter:
        stmt = stmt.where(Ticket.status == status_filter)
    if priority_filter:
        stmt = stmt.where(Ticket.priority == priority_filter)
    if ward_filter:
        stmt = stmt.where(Ticket.ward_identifier == ward_filter)

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{ticket_id}", response_model=TicketOut)
async def get_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.patch("/{ticket_id}", response_model=TicketOut)
async def update_ticket(
    ticket_id: str,
    payload: TicketUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Maintenance workers can update status (e.g. IN_REPAIR, AWAITING_VERIFICATION)
    if payload.status:
        ticket.status = payload.status
        if payload.status == TicketStatus.CLOSED:
            ticket.resolved_at = datetime.now(timezone.utc)

    # Officers / Admins can update priority, assignment, deadline
    if current_user.role in [UserRole.OFFICER, UserRole.ADMIN]:
        if payload.priority:
            ticket.priority = payload.priority
        if payload.assigned_team_lead_id:
            ticket.assigned_team_lead_id = payload.assigned_team_lead_id
            await create_notification(
                db,
                user_id=ticket.assigned_team_lead_id,
                notif_type="TICKET_ASSIGNED",
                title="Ticket Assignment",
                message=f"Ticket {ticket.ticket_number} has been assigned to your queue.",
                related_id=ticket.id,
                related_type="TICKET"
            )
        if payload.sla_deadline:
            ticket.sla_deadline = payload.sla_deadline

    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.patch("/{ticket_id}/status", response_model=TicketOut)
@router.put("/{ticket_id}/status", response_model=TicketOut)
async def update_ticket_status_alias(
    ticket_id: str,
    payload: TicketUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Alias endpoint for updating ticket status.
    """
    return await update_ticket(ticket_id, payload, db, current_user)
