from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.models.complaint import Complaint, ComplaintMedia, ComplaintStatus, MediaType
from app.models.ticket import Ticket, TicketPriority, TicketStatus
from app.models.user import User, UserRole
from app.schemas.complaint import ComplaintCreate, ComplaintOut, ComplaintUpdate
from app.api.deps import get_current_user, require_role
from app.services.spatial_service import find_duplicate_ticket, get_or_create_cluster
from app.services.notification_service import create_notification

router = APIRouter()


@router.post("/", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a citizen grievance. Checks for nearby duplicates (within 12m)
    and links to existing tickets or spatial clusters automatically.
    """
    complaint = Complaint(
        citizen_id=current_user.id,
        title=payload.title,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address_text=payload.address_text,
        status=ComplaintStatus.SUBMITTED
    )

    # 1. Spatial Deduplication check
    dup_match = await find_duplicate_ticket(db, payload.latitude, payload.longitude, radius_meters=12.0)
    if dup_match:
        existing_ticket, dist = dup_match
        complaint.ticket_id = existing_ticket.id
        complaint.status = ComplaintStatus.TRIAGED

    db.add(complaint)
    await db.commit()
    await db.refresh(complaint)

    # 2. Add media if specified
    if payload.media_urls:
        for url in payload.media_urls:
            media = ComplaintMedia(
                complaint_id=complaint.id,
                media_url=url,
                media_type=MediaType.IMAGE
            )
            db.add(media)
        await db.commit()
        await db.refresh(complaint)

    # 3. Cluster association
    await get_or_create_cluster(db, payload.latitude, payload.longitude)

    # 4. Notify Citizen
    await create_notification(
        db,
        user_id=current_user.id,
        notif_type="COMPLAINT_SUBMITTED",
        title="Complaint Registered",
        message=f"Your complaint '{complaint.title}' has been successfully logged.",
        related_id=complaint.id,
        related_type="COMPLAINT"
    )

    return complaint


@router.get("/", response_model=List[ComplaintOut])
async def list_complaints(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[ComplaintStatus] = None,
    mine_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List complaints. Citizens can filter for their own reports; officers/admins view all.
    """
    stmt = select(Complaint).order_by(desc(Complaint.created_at))

    if mine_only or current_user.role == UserRole.CITIZEN:
        stmt = stmt.where(Complaint.citizen_id == current_user.id)

    if status_filter:
        stmt = stmt.where(Complaint.status == status_filter)

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{complaint_id}", response_model=ComplaintOut)
async def get_complaint(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve single complaint details.
    """
    stmt = select(Complaint).where(Complaint.id == complaint_id)
    result = await db.execute(stmt)
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.patch("/{complaint_id}", response_model=ComplaintOut)
async def update_complaint(
    complaint_id: str,
    payload: ComplaintUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))
):
    """
    Officers can triage complaints, link to tickets, or approve/reject.
    """
    stmt = select(Complaint).where(Complaint.id == complaint_id)
    result = await db.execute(stmt)
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if payload.status:
        complaint.status = payload.status
    if payload.ticket_id:
        complaint.ticket_id = payload.ticket_id

    await db.commit()
    await db.refresh(complaint)

    # Notify Citizen of Status Update
    await create_notification(
        db,
        user_id=complaint.citizen_id,
        notif_type="COMPLAINT_STATUS_UPDATE",
        title="Complaint Status Changed",
        message=f"Complaint '{complaint.title}' is now marked as {complaint.status.value}.",
        related_id=complaint.id,
        related_type="COMPLAINT"
    )

    return complaint


@router.put("/{complaint_id}/status", response_model=ComplaintOut)
async def update_complaint_status(
    complaint_id: str,
    payload: ComplaintUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))
):
    """
    Alias endpoint for updating complaint status.
    """
    return await update_complaint(complaint_id, payload, db, current_user)
