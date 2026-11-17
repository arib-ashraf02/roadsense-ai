import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification

logger = logging.getLogger(__name__)


async def create_notification(
    db: AsyncSession,
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
    related_id: Optional[str] = None,
    related_type: Optional[str] = None
) -> Notification:
    """
    Creates an in-app notification entry for a user.
    """
    notif = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        related_id=related_id,
        related_type=related_type
    )
    db.add(notif)
    try:
        await db.commit()
        await db.refresh(notif)
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
        await db.rollback()
    return notif
