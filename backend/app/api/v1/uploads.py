"""
Uploads API router — RoadSense AI.

Endpoints:
  POST /uploads/      — save media file, extract EXIF, create Upload record, trigger detection
  GET  /uploads/      — list user's uploads (paginated)
  GET  /uploads/{id}  — single upload details
"""
from __future__ import annotations

import os
import uuid
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.config import settings
from app.core.database import get_db
from app.models.detection import Upload, MediaTypeEnum, UploadStatusEnum
from app.services.exif_service import extract_gps
from app.core.job_store import create_job

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Directory setup (mirrors detection.py)
# ---------------------------------------------------------------------------
UPLOADS_BASE = Path(settings.UPLOAD_DIR)
IMAGES_DIR = UPLOADS_BASE / "images"
VIDEOS_DIR = UPLOADS_BASE / "videos"
FRAMES_DIR = UPLOADS_BASE / "frames"
ANNOTATED_DIR = UPLOADS_BASE / "annotated"

for _d in [IMAGES_DIR, VIDEOS_DIR, FRAMES_DIR, ANNOTATED_DIR]:
    _d.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/webm"}
MAX_SIZE = 500 * 1024 * 1024  # 500 MB


def _save_file(file: UploadFile, dest_dir: Path) -> tuple[str, str, int]:
    ext = Path(file.filename or "file").suffix or ".bin"
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = dest_dir / stored_name
    total = 0
    with open(file_path, "wb") as f:
        for chunk in iter(lambda: file.file.read(1024 * 64), b""):
            f.write(chunk)
            total += len(chunk)
    return stored_name, str(file_path), total


# ---------------------------------------------------------------------------
# POST /uploads/
# ---------------------------------------------------------------------------

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    trigger_detection: bool = Query(True, description="Run YOLO detection as background task"),
):
    """
    Save a media file (image or video), extract EXIF GPS, and optionally trigger detection.
    Returns an upload record with job_id when detection is triggered.
    """
    content_type = file.content_type or ""
    is_image = content_type in ALLOWED_IMAGE_TYPES
    is_video = content_type in ALLOWED_VIDEO_TYPES

    if not (is_image or is_video):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported media type: {content_type}",
        )

    dest_dir = IMAGES_DIR if is_image else VIDEOS_DIR

    try:
        stored_name, file_path, file_size = _save_file(file, dest_dir)
    except Exception as e:
        logger.error(f"File save error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save file.")

    if file_size > MAX_SIZE:
        Path(file_path).unlink(missing_ok=True)
        raise HTTPException(status_code=413, detail="File too large (max 500 MB).")

    # Extract GPS from EXIF (images only)
    lat: Optional[float] = None
    lon: Optional[float] = None
    has_gps = False
    if is_image:
        lat, lon = extract_gps(file_path)
        has_gps = lat is not None and lon is not None

    upload_id = str(uuid.uuid4())
    media_type = "IMAGE" if is_image else "VIDEO"

    upload_record = {
        "id": upload_id,
        "original_filename": file.filename,
        "stored_filename": stored_name,
        "media_type": media_type,
        "file_path": file_path,
        "file_size": file_size,
        "status": "PENDING",
        "latitude": lat,
        "longitude": lon,
        "has_gps": has_gps,
    }

    job_id: Optional[str] = None

    if trigger_detection:
        job_id = str(uuid.uuid4())
        create_job(
            job_id,
            {
                "upload_id": upload_id,
                "original_filename": file.filename,
                "media_type": media_type,
                "file_path": file_path,
            },
        )

        if is_image:
            from app.services.yolo_service import yolo_service

            def _run_image_detection():
                result = yolo_service.detect(file_path)
                from app.core.job_store import update_job
                update_job(job_id, status="COMPLETED", progress=100, result=result)

            background_tasks.add_task(_run_image_detection)
        else:
            from app.services.video_service import process_video_job
            background_tasks.add_task(process_video_job, job_id, file_path, upload_id)

    return {
        **upload_record,
        "job_id": job_id,
        "message": (
            f"Upload saved. Detection job {job_id} started."
            if job_id
            else "Upload saved. Detection not triggered."
        ),
    }


# ---------------------------------------------------------------------------
# GET /uploads/
# ---------------------------------------------------------------------------

@router.get("/")
async def list_uploads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    List uploads from database (paginated).
    """
    offset = (page - 1) * page_size
    total = await db.scalar(select(func.count(Upload.id))) or 0
    stmt = select(Upload).order_by(desc(Upload.created_at)).offset(offset).limit(page_size)
    res = await db.execute(stmt)
    records = res.scalars().all()
    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "items": [
            {
                "id": u.id,
                "original_filename": u.original_filename,
                "stored_filename": u.stored_filename,
                "media_type": u.media_type.value if hasattr(u.media_type, "value") else str(u.media_type),
                "media_url": f"/uploads/{'images' if str(u.media_type) == 'IMAGE' else 'videos'}/{u.stored_filename}",
                "status": u.status.value if hasattr(u.status, "value") else str(u.status),
                "latitude": u.latitude,
                "longitude": u.longitude,
                "has_gps": u.has_gps,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in records
        ],
    }


# ---------------------------------------------------------------------------
# GET /uploads/{id}
# ---------------------------------------------------------------------------

@router.get("/{upload_id}")
async def get_upload(upload_id: str, db: AsyncSession = Depends(get_db)):
    """
    Fetch a single upload record by ID.
    """
    stmt = select(Upload).where(Upload.id == upload_id)
    res = await db.execute(stmt)
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload with ID '{upload_id}' not found.",
        )
    return {
        "id": u.id,
        "original_filename": u.original_filename,
        "stored_filename": u.stored_filename,
        "media_type": u.media_type.value if hasattr(u.media_type, "value") else str(u.media_type),
        "media_url": f"/uploads/{'images' if str(u.media_type) == 'IMAGE' else 'videos'}/{u.stored_filename}",
        "file_path": u.file_path,
        "file_size": u.file_size,
        "status": u.status.value if hasattr(u.status, "value") else str(u.status),
        "latitude": u.latitude,
        "longitude": u.longitude,
        "has_gps": u.has_gps,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }
