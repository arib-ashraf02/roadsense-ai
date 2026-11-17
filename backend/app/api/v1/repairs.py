from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.repair import Repair, AIVerdict
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User, UserRole
from app.schemas.repair import RepairCreate, RepairOut, RepairVerifyRequest
from app.api.deps import get_current_user, require_role
from app.services.verification_service import verify_repair_evidence
from app.services.notification_service import create_notification

router = APIRouter()


@router.post("/", response_model=RepairOut, status_code=status.HTTP_201_CREATED)
async def submit_repair_evidence(
    payload: RepairCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.MAINTENANCE, UserRole.OFFICER, UserRole.ADMIN))
):
    """
    Maintenance team uploads after-repair image.
    AI automatically runs verification comparison and provides an advisory recommendation.
    NOTE: Officer retains final approval authority.
    """
    stmt = select(Ticket).where(Ticket.id == payload.ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Associated ticket not found")

    # Run AI verification
    ai_result = verify_repair_evidence(payload.before_media_url, payload.after_media_url)

    repair = Repair(
        ticket_id=ticket.id,
        submitted_by_id=current_user.id,
        before_media_url=payload.before_media_url,
        after_media_url=payload.after_media_url,
        notes=payload.notes,
        ai_verification_score=ai_result.get("ai_verification_score"),
        ai_verdict=ai_result.get("verdict"),
        officer_approved=None  # Pending officer review
    )

    # Transition ticket to AWAITING_VERIFICATION
    ticket.status = TicketStatus.AWAITING_VERIFICATION

    db.add(repair)
    await db.commit()
    await db.refresh(repair)

    # Notify Assigned Officer
    if ticket.assigned_officer_id:
        await create_notification(
            db,
            user_id=ticket.assigned_officer_id,
            notif_type="REPAIR_VERIFICATION_PENDING",
            title="Repair Ready for Verification",
            message=f"Work order {ticket.ticket_number} submitted repair proof (AI Verdict: {repair.ai_verdict.value}). Review required.",
            related_id=repair.id,
            related_type="REPAIR"
        )

    return repair


@router.patch("/{repair_id}/verify", response_model=RepairOut)
async def officer_verify_repair(
    repair_id: str,
    payload: RepairVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))
):
    """
    Officer conducts final sign-off: approves or rejects repair based on evidence & AI advisory.
    """
    stmt = select(Repair).where(Repair.id == repair_id)
    result = await db.execute(stmt)
    repair = result.scalar_one_or_none()
    if not repair:
        raise HTTPException(status_code=404, detail="Repair record not found")

    ticket_stmt = select(Ticket).where(Ticket.id == repair.ticket_id)
    ticket_res = await db.execute(ticket_stmt)
    ticket = ticket_res.scalar_one_or_none()

    repair.officer_approved = payload.approved
    repair.officer_approved_by_id = current_user.id
    repair.officer_approved_at = datetime.now(timezone.utc)
    if payload.officer_notes:
        repair.notes = (repair.notes or "") + f" | Officer: {payload.officer_notes}"

    if ticket:
        if payload.approved:
            ticket.status = TicketStatus.CLOSED
            ticket.resolved_at = datetime.now(timezone.utc)
        else:
            ticket.status = TicketStatus.IN_REPAIR  # Needs rework

    await db.commit()
    await db.refresh(repair)

    # Notify Maintenance Team
    if repair.submitted_by_id:
        status_msg = "approved" if payload.approved else "rejected"
        await create_notification(
            db,
            user_id=repair.submitted_by_id,
            notif_type="REPAIR_OFFICER_SIGN_OFF",
            title=f"Repair {status_msg.capitalize()}",
            message=f"Your repair submission for {ticket.ticket_number if ticket else 'ticket'} has been {status_msg}.",
            related_id=repair.id,
            related_type="REPAIR"
        )

    return repair
