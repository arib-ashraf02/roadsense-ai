"""
Pydantic schemas for detection and upload endpoints — RoadSense AI.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum

from pydantic import BaseModel, Field, UUID4


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class MediaType(str, Enum):
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"


class UploadStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class VideoJobStatusEnum(str, Enum):
    PENDING = "PENDING"
    EXTRACTING_FRAMES = "EXTRACTING_FRAMES"
    DETECTING = "DETECTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# ---------------------------------------------------------------------------
# Detection schemas
# ---------------------------------------------------------------------------

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class SingleDetection(BaseModel):
    bbox: List[float] = Field(..., description="[x1, y1, x2, y2] in pixel coordinates")
    confidence: float = Field(..., ge=0.0, le=1.0)
    class_name: str = Field(default="pothole")
    area_ratio: float = Field(..., description="Fraction of image area occupied by bounding box")
    severity: SeverityLevel
    severity_description: Optional[str] = None


class DetectionResult(BaseModel):
    """Raw result returned by the YOLO service."""
    model_status: str = Field(..., description="active | unavailable | error")
    message: Optional[str] = None
    detections: List[SingleDetection] = []
    detection_count: int = 0
    severity: Optional[SeverityLevel] = None
    annotated_image_path: Optional[str] = None


class DetectionCreate(BaseModel):
    upload_id: Optional[str] = None
    confidence: float
    severity: SeverityLevel
    bounding_boxes: List[Dict[str, Any]] = []
    annotated_image_url: Optional[str] = None
    raw_image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_duplicate: bool = False
    cluster_id: Optional[str] = None


class DetectionOut(BaseModel):
    id: str
    upload_id: Optional[str] = None
    confidence: float
    severity: SeverityLevel
    bounding_boxes: List[Dict[str, Any]] = []
    annotated_image_url: Optional[str] = None
    raw_image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_duplicate: bool = False
    cluster_id: Optional[str] = None
    detected_at: datetime
    detection_count: Optional[int] = None
    model_status: Optional[str] = None
    summary: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Upload schemas
# ---------------------------------------------------------------------------

class UploadCreate(BaseModel):
    original_filename: str
    media_type: MediaType
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_gps: bool = False


class UploadOut(BaseModel):
    id: str
    user_id: str
    original_filename: str
    stored_filename: str
    media_type: MediaType
    file_path: str
    file_size: int
    status: UploadStatus
    error_message: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_gps: bool
    created_at: datetime
    updated_at: datetime
    detections: List[DetectionOut] = []

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Video job schemas
# ---------------------------------------------------------------------------

class VideoJobStatus(BaseModel):
    job_id: str
    status: VideoJobStatusEnum
    progress: int = Field(..., ge=0, le=100, description="Completion percentage")
    total_frames: Optional[int] = None
    total_detections: Optional[int] = None
    overall_severity: Optional[SeverityLevel] = None
    summary: Optional[str] = None
    error: Optional[str] = None
    created_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
