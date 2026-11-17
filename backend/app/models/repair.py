import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base


class AIVerdict(str, enum.Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    MANUAL_REVIEW_REQUIRED = "MANUAL_REVIEW_REQUIRED"


class Repair(Base):
    __tablename__ = "repairs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    before_media_url = Column(Text, nullable=True)
    after_media_url = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    ai_verification_score = Column(Float, nullable=True)
    ai_verdict = Column(SAEnum(AIVerdict, name="ai_verdict_enum"), nullable=True)
    officer_approved = Column(Boolean, nullable=True)
    officer_approved_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    officer_approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    ticket = relationship("Ticket", back_populates="repairs")
