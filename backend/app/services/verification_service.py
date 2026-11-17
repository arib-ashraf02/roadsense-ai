import logging
from typing import Dict, Any, Optional
from pathlib import Path
from app.services.yolo_service import yolo_service

logger = logging.getLogger(__name__)


def verify_repair_evidence(before_image_path: Optional[str], after_image_path: str) -> Dict[str, Any]:
    """
    Analyzes before-and-after repair photographs using computer vision.
    Provides an objective AI verification recommendation for municipal officers.
    NOTE: The municipal officer MUST make the final sign-off. AI provides an advisory verdict.
    """
    try:
        import cv2
        import numpy as np
    except ImportError:
        return {
            "ai_verification_score": 0.5,
            "patch_detected": False,
            "pothole_absent": True,
            "verdict": "MANUAL_REVIEW_REQUIRED",
            "notes": "Computer vision libraries unavailable. Manual officer review required."
        }

    if not Path(after_image_path).exists():
        return {
            "ai_verification_score": 0.0,
            "patch_detected": False,
            "pothole_absent": False,
            "verdict": "FAILED",
            "notes": "After-repair photograph could not be found."
        }

    # 1. Run YOLO inference on after-repair image
    after_detections = yolo_service.detect(after_image_path)
    potholes_found_after = len(after_detections.get("detections", []))

    pothole_absent = (potholes_found_after == 0)

    # 2. Analyze surface texture for asphalt patch characteristics
    patch_detected = False
    try:
        img = cv2.imread(after_image_path)
        if img is not None:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Edge detection to check surface smoothness / roughness transition
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])

            # Asphalt patches typically have low high-frequency edge density in repaired areas
            # and dark grayscale mean
            mean_intensity = np.mean(gray)
            if mean_intensity < 180 and edge_density < 0.25:
                patch_detected = True
    except Exception as e:
        logger.warning(f"Error computing texture metrics: {e}")

    # 3. Calculate score & verdict
    if not pothole_absent:
        # A pothole was still detected in after image
        score = 0.20
        verdict = "FAILED"
        notes = f"AI detected {potholes_found_after} residual pothole contour(s) in the after-repair photo."
    elif pothole_absent and patch_detected:
        score = 0.92
        verdict = "PASSED"
        notes = "No potholes detected. Asphalt patch characteristics identified. Recommended for officer approval."
    else:
        score = 0.65
        verdict = "MANUAL_REVIEW_REQUIRED"
        notes = "No potholes detected, but asphalt patch characteristics are inconclusive. Recommended for visual officer check."

    return {
        "ai_verification_score": round(score, 2),
        "patch_detected": patch_detected,
        "pothole_absent": pothole_absent,
        "verdict": verdict,
        "notes": notes
    }
