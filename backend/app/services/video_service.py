"""
Video processing service for RoadSense AI.
Extracts frames from video at ~1 frame per 1.5 seconds and runs YOLO detection on each frame.
"""
import os
import logging
import uuid
from pathlib import Path
from typing import List, Optional

import cv2

from app.core.job_store import create_job, update_job, get_job

logger = logging.getLogger(__name__)

from app.core.config import settings

UPLOADS_BASE = Path(settings.UPLOAD_DIR)
FRAMES_DIR = UPLOADS_BASE / "frames"



def extract_frames(video_path: str, output_dir: str, fps: float = 0.67) -> List[str]:
    """
    Extract frames from a video at the given frame-rate (default 0.67 fps = 1 frame / 1.5 s).

    Args:
        video_path: Absolute or relative path to the input video file.
        output_dir:  Directory where extracted frame images are saved.
        fps:         Frames per second to extract (0.67 ≈ 1 frame every 1.5 s).

    Returns:
        List of absolute paths to the extracted frame images.
    """
    output_dir_path = Path(output_dir)
    output_dir_path.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {video_path}")

    video_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_interval = max(1, int(video_fps / fps))  # e.g. 30fps / 0.67 ≈ every 45 frames

    frame_paths: List[str] = []
    frame_idx = 0
    saved_idx = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % frame_interval == 0:
                frame_filename = f"frame_{saved_idx:05d}.jpg"
                frame_path = output_dir_path / frame_filename
                success = cv2.imwrite(str(frame_path), frame)
                if success:
                    frame_paths.append(str(frame_path))
                    saved_idx += 1
                else:
                    logger.warning(f"Failed to write frame {frame_idx} to {frame_path}")
            frame_idx += 1
    finally:
        cap.release()

    logger.info(f"Extracted {len(frame_paths)} frames from {video_path}")
    return frame_paths


extract_video_frames = extract_frames


def process_video_job(job_id: str, video_path: str, upload_id: Optional[str] = None) -> None:
    """
    Background task: extract frames, run YOLO detection on each, aggregate results.
    Updates the job store throughout.

    Args:
        job_id:    Unique job identifier (pre-created in job store).
        video_path: Path to the uploaded video.
        upload_id: Optional DB upload record ID for correlation.
    """
    from app.services.yolo_service import yolo_service

    update_job(job_id, status="PROCESSING", progress=0)

    try:
        # Determine output directory for frames
        job_frames_dir = FRAMES_DIR / job_id
        job_frames_dir.mkdir(parents=True, exist_ok=True)

        # Step 1: Extract frames
        update_job(job_id, status="EXTRACTING_FRAMES", progress=5)
        frame_paths = extract_frames(video_path, str(job_frames_dir))

        if not frame_paths:
            update_job(
                job_id,
                status="FAILED",
                progress=0,
                error="No frames could be extracted from the video.",
            )
            return

        total_frames = len(frame_paths)
        update_job(job_id, status="DETECTING", progress=10, total_frames=total_frames)

        # Step 2: Run detection on each frame
        all_detections = []
        frame_results = []

        for i, frame_path in enumerate(frame_paths):
            result = yolo_service.detect(frame_path)
            frame_results.append(
                {
                    "frame_index": i,
                    "frame_path": frame_path,
                    "detection_result": result,
                }
            )
            if result.get("detections"):
                all_detections.extend(result["detections"])

            # Update progress (10% → 95% spread across frames)
            progress = int(10 + ((i + 1) / total_frames) * 85)
            update_job(job_id, progress=progress)

        # Step 3: Aggregate severity
        from app.services.severity_service import compute_overall_severity, generate_summary

        overall_severity = compute_overall_severity(all_detections)
        summary = generate_summary(all_detections, total_frames)

        update_job(
            job_id,
            status="COMPLETED",
            progress=100,
            result={
                "upload_id": upload_id,
                "total_frames_processed": total_frames,
                "total_detections": len(all_detections),
                "overall_severity": overall_severity,
                "summary": summary,
                "frame_results": frame_results,
                "model_status": (
                    "active" if yolo_service.is_available else "unavailable"
                ),
            },
        )
        logger.info(
            f"Video job {job_id} complete: {len(all_detections)} detections "
            f"across {total_frames} frames. Severity: {overall_severity}"
        )

    except Exception as e:
        logger.error(f"Video job {job_id} failed: {e}", exc_info=True)
        update_job(job_id, status="FAILED", error=str(e), progress=0)
