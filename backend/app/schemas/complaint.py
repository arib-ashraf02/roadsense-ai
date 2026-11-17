from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ComplaintStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    TRIAGED = "TRIAGED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address_text: Optional[str] = None


class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    ticket_id: Optional[str] = None
    description: Optional[str] = None


class ComplaintOut(BaseModel):
    id: str
    citizen_id: str
    title: str
    description: Optional[str]
    latitude: float
    longitude: float
    address_text: Optional[str]
    status: ComplaintStatus
    ticket_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ComplaintListOut(BaseModel):
    items: List[ComplaintOut]
    total: int
    skip: int
    limit: int
