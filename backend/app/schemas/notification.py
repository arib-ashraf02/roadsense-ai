from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
    related_id: Optional[str] = None
    related_type: Optional[str] = None


class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    is_read: bool
    related_id: Optional[str]
    related_type: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListOut(BaseModel):
    items: List[NotificationOut]
    total: int
    unread_count: int
    skip: int
    limit: int
