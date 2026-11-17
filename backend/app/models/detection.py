"""
SQLAlchemy models for Upload and PotholeDetection — RoadSense AI.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

# Import Base from database module; uses a lazy import pattern to avoid circular deps
from app.core.database import Base


# ---------------------------------------------------------------------------
# Enums (string-backed so they survive DB round-trips cleanly)
# ---------------------------------------------------------------------------

import enum


class MediaTypeEnum(str, enum.Enum):
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"


class UploadStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class SeverityEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ---------------------------------------------------------------------------
# Upload model
# ---------------------------------------------------------------------------

class Upload(Base):
    __tablename__ = "uploads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    original_filename = Column(String(512), nullable=False)
    stored_filename = Column(String(512), nullable=False)
    media_type = Column(SAEnum(MediaTypeEnum, name="media_type_enum"), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(Integer, nullable=False, default=0)

    status = Column(
        SAEnum(UploadStatusEnum, name="upload_status_enum"),
        nullable=False,
        default=UploadStatusEnum.PENDING,
        index=True,
    )
    error_message = Column(Text, nullable=True)

    # GPS coordinates (extracted from EXIF or supplied by client)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    has_gps = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    detections = relationship(
        "PotholeDetection",
        back_populates="upload",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Upload id={self.id} file={self.original_filename} status={self.status}>"


# ---------------------------------------------------------------------------
# PotholeDetection model
# ---------------------------------------------------------------------------

class PotholeDetection(Base):
    __tablename__ = "pothole_detections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Nullable FK — detection can exist independent of a ticket or upload temporarily
    upload_id = Column(
        String(36),
        ForeignKey("uploads.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    ticket_id = Column(
        String(36),
        # FK added when tickets table exists; kept as plain string for now
        nullable=True,
        index=True,
    )

    # Detection data
    confidence = Column(Float, nullable=False)
    severity = Column(SAEnum(SeverityEnum, name="severity_enum"), nullable=False, index=True)
    estimated_area_sqm = Column(Float, nullable=True)
    bounding_boxes = Column(JSON, nullable=False, default=list)

    # Image URLs
    annotated_image_url = Column(Text, nullable=True)
    raw_image_url = Column(Text, nullable=True)

    # Geo-coordinates (nullable — image may not have GPS)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Deduplication
    is_duplicate = Column(Boolean, nullable=False, default=False)
    cluster_id = Column(String(36), nullable=True)

    detected_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationships
    upload = relationship("Upload", back_populates="detections")

    def __repr__(self) -> str:
        return (
            f"<PotholeDetection id={self.id} severity={self.severity} "
            f"confidence={self.confidence:.2f}>"
        )
