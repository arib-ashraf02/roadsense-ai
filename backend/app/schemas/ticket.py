from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TicketStatus(str, Enum):
    OPEN = "OPEN"
    ASSIGNED = "ASSIGNED"
    IN_REPAIR = "IN_REPAIR"
    AWAITING_VERIFICATION = "AWAITING_VERIFICATION"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"


class TicketPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TicketCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: Optional[str] = None
    priority: TicketPriority = TicketPriority.MEDIUM
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ward_identifier: Optional[str] = None
    assigned_team_lead_id: Optional[str] = None
    sla_deadline: Optional[datetime] = None


class TicketUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = None
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    assigned_team_lead_id: Optional[str] = None
    sla_deadline: Optional[datetime] = None


class TicketAssign(BaseModel):
    team_lead_id: str


class TicketOut(BaseModel):
    id: str
    ticket_number: str
    title: str
    description: Optional[str]
    priority: TicketPriority
    status: TicketStatus
    latitude: float
    longitude: float
    ward_identifier: Optional[str]
    assigned_officer_id: Optional[str]
    assigned_team_lead_id: Optional[str]
    sla_deadline: Optional[datetime]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TicketListOut(BaseModel):
    items: List[TicketOut]
    total: int
    skip: int
    limit: int


class AuditHistoryEntry(BaseModel):
    id: str
    action: str
    user_id: str
    details: Optional[dict]
    created_at: datetime

    model_config = {"from_attributes": True}
