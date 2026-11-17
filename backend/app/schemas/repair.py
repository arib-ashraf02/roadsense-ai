from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class AIVerdict(str, Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    MANUAL_REVIEW_REQUIRED = "MANUAL_REVIEW_REQUIRED"


class RepairCreate(BaseModel):
    ticket_id: str
    before_media_url: Optional[str] = None
    after_media_url: str
    notes: Optional[str] = None


class RepairVerifyRequest(BaseModel):
    approved: bool
    officer_notes: Optional[str] = None


class RepairVerify(BaseModel):
    officer_approved: bool
    notes: Optional[str] = None


class RepairOut(BaseModel):
    id: str
    ticket_id: str
    submitted_by_id: Optional[str] = None
    before_media_url: Optional[str] = None
    after_media_url: str
    notes: Optional[str] = None
    ai_verification_score: Optional[float] = None
    ai_verdict: Optional[AIVerdict] = None
    officer_approved: Optional[bool] = None
    officer_approved_by_id: Optional[str] = None
    officer_approved_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RepairListOut(BaseModel):
    items: List[RepairOut]
    total: int
