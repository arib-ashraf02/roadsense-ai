"""
Detection API router — RoadSense AI.

Endpoints:
  POST /detection/image   — upload image, run YOLO, return result
  POST /detection/video   — upload video, start background job, return job_id
  GET  /detection/job/{job_id} — poll video job status
  GET  /detection/history — list user's detections (paginated)
  GET  /detection/{detection_id} — single detection details
"""
from __future__ import annotations

import os
import uuid
import shutil
import logging
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import JSONResponse

from app.core.job_store import create_job, get_job
from app.schemas.detection import DetectionOut, DetectionResult, VideoJobStatus, VideoJobStatusEnum
from app.services.yolo_service import yolo_service
from app.services.severity_service import generate_summary, enrich_detections

from app.core.config import settings
from app.core.database import get_db
from app.models.detection import PotholeDetection
from app.services.exif_service import extract_gps
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Upload directory setup
# ---------------------------------------------------------------------------
UPLOADS_BASE = Path(settings.UPLOAD_DIR)
IMAGES_DIR = UPLOADS_BASE / "images"
VIDEOS_DIR = UPLOADS_BASE / "videos"
FRAMES_DIR = UPLOADS_BASE / "frames"
ANNOTATED_DIR = UPLOADS_BASE / "annotated"

try:
    for _d in [IMAGES_DIR, VIDEOS_DIR, FRAMES_DIR, ANNOTATED_DIR]:
        _d.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/webm"}
MAX_IMAGE_SIZE = 20 * 1024 * 1024   # 20 MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500 MB


def _save_upload(file: UploadFile, dest_dir: Path) -> tuple[str, str, int]:
    """Save uploaded file to dest_dir. Returns (stored_filename, file_path, file_size)."""
    ext = Path(file.filename or "upload").suffix or ".bin"
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = dest_dir / stored_name
    total = 0
    with open(file_path, "wb") as f:
        for chunk in iter(lambda: file.file.read(1024 * 64), b""):
            f.write(chunk)
            total += len(chunk)
    return stored_name, str(file_path), total


# ---------------------------------------------------------------------------
# POST /detection/image
# ---------------------------------------------------------------------------

@router.post("/image", response_model=None, status_code=status.HTTP_200_OK)
async def detect_image(
    file: UploadFile = File(..., description="Image file (JPEG/PNG/WEBP/BMP)"),
    conf_threshold: float = Query(0.25, ge=0.01, le=1.0, description="YOLO confidence threshold"),
):
    """
    Upload an image, run YOLO pothole detection, return structured result.
    When model weights are unavailable, returns model_status='unavailable' (never fake data).
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image type: {content_type}. Allowed: {ALLOWED_IMAGE_TYPES}",
        )

    try:
        stored_name, file_path, file_size = _save_upload(file, IMAGES_DIR)
    except Exception as e:
        logger.error(f"Failed to save image upload: {e}")
        raise HTTPException(status_code=500, detail="Failed to save uploaded file.")

    if file_size > MAX_IMAGE_SIZE:
        Path(file_path).unlink(missing_ok=True)
        raise HTTPException(status_code=413, detail="Image exceeds 20 MB limit.")

    # Run detection (synchronous — YOLO is CPU/GPU bound, not I/O)
    result = yolo_service.detect(file_path, conf_threshold=conf_threshold)

    # Enrich detections with descriptions
    result["detections"] = enrich_detections(result.get("detections", []))
    result["summary"] = generate_summary(result.get("detections", []))

    # Extract EXIF GPS if present in image
    exif_lat, exif_lon = extract_gps(file_path)

    media_url = f"/uploads/images/{stored_name}"
    annotated_url = None
    if result.get("annotated_image_path"):
        annotated_url = f"/uploads/annotated/{Path(result['annotated_image_path']).name}"

    result["upload"] = {
        "stored_filename": stored_name,
        "file_path": file_path,
        "file_size": file_size,
        "original_filename": file.filename,
        "media_url": media_url,
    }
    result["annotated_image_url"] = annotated_url
    result["gps"] = {
        "latitude": exif_lat,
        "longitude": exif_lon,
        "has_gps": (exif_lat is not None and exif_lon is not None),
    }

    return result


# ---------------------------------------------------------------------------
# POST /detection/video
# ---------------------------------------------------------------------------

@router.post("/video", status_code=status.HTTP_202_ACCEPTED)
async def detect_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Video file (MP4/MOV/AVI/WEBM)"),
):
    """
    Upload a video. Frames are extracted and analysed in a background task.
    Returns a job_id — poll GET /detection/job/{job_id} for status.
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported video type: {content_type}. Allowed: {ALLOWED_VIDEO_TYPES}",
        )

    try:
        stored_name, file_path, file_size = _save_upload(file, VIDEOS_DIR)
    except Exception as e:
        logger.error(f"Failed to save video upload: {e}")
        raise HTTPException(status_code=500, detail="Failed to save uploaded file.")

    if file_size > MAX_VIDEO_SIZE:
        Path(file_path).unlink(missing_ok=True)
        raise HTTPException(status_code=413, detail="Video exceeds 500 MB limit.")

    job_id = str(uuid.uuid4())
    create_job(
        job_id,
        {
            "original_filename": file.filename,
            "stored_filename": stored_name,
            "file_path": file_path,
            "file_size": file_size,
        },
    )

    # Import here to avoid circular imports at module load
    from app.services.video_service import process_video_job

    background_tasks.add_task(process_video_job, job_id, file_path, None)

    return {
        "job_id": job_id,
        "status": "PENDING",
        "message": "Video accepted. Poll /detection/job/{job_id} for progress.",
        "original_filename": file.filename,
    }


# ---------------------------------------------------------------------------
# GET /detection/job/{job_id}
# ---------------------------------------------------------------------------

@router.get("/job/{job_id}")
async def get_job_status(job_id: str):
    """Poll the status of a video processing job."""
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return job


# ---------------------------------------------------------------------------
# GET /detection/history
# ---------------------------------------------------------------------------

@router.get("/history")
async def detection_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    List past pothole detections from database (paginated).
    """
    offset = (page - 1) * page_size
    total = await db.scalar(select(func.count(PotholeDetection.id))) or 0
    stmt = (
        select(PotholeDetection)
        .order_by(desc(PotholeDetection.detected_at))
        .offset(offset)
        .limit(page_size)
    )
    res = await db.execute(stmt)
    items = res.scalars().all()
    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "items": [
            {
                "id": d.id,
                "confidence": d.confidence,
                "severity": d.severity.value if hasattr(d.severity, "value") else str(d.severity),
                "latitude": d.latitude,
                "longitude": d.longitude,
                "estimated_area_sqm": d.estimated_area_sqm,
                "annotated_image_url": d.annotated_image_url,
                "raw_image_url": d.raw_image_url,
                "detected_at": d.detected_at.isoformat() if d.detected_at else None,
            }
            for d in items
        ],
    }


# ---------------------------------------------------------------------------
# GET /detection/{detection_id}
# ---------------------------------------------------------------------------

@router.get("/{detection_id}")
async def get_detection(detection_id: str, db: AsyncSession = Depends(get_db)):
    """
    Fetch a single detection record by ID.
    """
    stmt = select(PotholeDetection).where(PotholeDetection.id == detection_id)
    res = await db.execute(stmt)
    d = res.scalar_one_or_none()
    if not d:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Detection with ID '{detection_id}' not found.",
        )
    return {
        "id": d.id,
        "confidence": d.confidence,
        "severity": d.severity.value if hasattr(d.severity, "value") else str(d.severity),
        "latitude": d.latitude,
        "longitude": d.longitude,
        "estimated_area_sqm": d.estimated_area_sqm,
        "bounding_boxes": d.bounding_boxes,
        "annotated_image_url": d.annotated_image_url,
        "raw_image_url": d.raw_image_url,
        "is_duplicate": d.is_duplicate,
        "cluster_id": d.cluster_id,
        "ticket_id": d.ticket_id,
        "detected_at": d.detected_at.isoformat() if d.detected_at else None,
    }
