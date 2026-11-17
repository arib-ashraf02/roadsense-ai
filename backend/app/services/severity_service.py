"""
Severity computation and human-readable summary service for RoadSense AI.
"""
from typing import List, Optional, Dict


SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

SEVERITY_DESCRIPTIONS = {
    "CRITICAL": "Immediate repair required — large pothole posing serious hazard.",
    "HIGH": "Urgent repair needed — significant pothole affecting road safety.",
    "MEDIUM": "Scheduled repair recommended — moderate pothole.",
    "LOW": "Monitor and plan repair — minor road surface defect.",
}


def compute_overall_severity(detections: List[dict]) -> Optional[str]:
    """
    Return the worst severity found across all detections.

    Args:
        detections: List of detection dicts, each with a 'severity' key.

    Returns:
        Worst severity string, or None if no detections.
    """
    if not detections:
        return None
    for sev in SEVERITY_ORDER:
        if any(d.get("severity") == sev for d in detections):
            return sev
    return None


def severity_counts(detections: List[dict]) -> Dict[str, int]:
    """Count detections by severity level."""
    counts: Dict[str, int] = {s: 0 for s in SEVERITY_ORDER}
    for d in detections:
        sev = d.get("severity")
        if sev in counts:
            counts[sev] += 1
    return counts


def generate_summary(detections: List[dict], total_frames: Optional[int] = None) -> str:
    """
    Generate a human-readable summary of detection results.

    Args:
        detections: Flat list of all detection dicts.
        total_frames: Optional count of video frames analysed (for video jobs).

    Returns:
        A plain-English summary string.
    """
    if not detections:
        if total_frames is not None:
            return (
                f"No potholes detected across {total_frames} analysed video frame(s). "
                "Road surface appears clear."
            )
        return "No potholes detected. Road surface appears clear."

    overall = compute_overall_severity(detections)
    counts = severity_counts(detections)
    total = len(detections)

    parts = []
    for sev in SEVERITY_ORDER:
        if counts[sev]:
            parts.append(f"{counts[sev]} {sev.capitalize()}")

    breakdown = ", ".join(parts) if parts else f"{total} detection(s)"

    base = (
        f"Detected {total} pothole(s) — {breakdown}. "
        f"Overall severity: {overall}. "
        f"{SEVERITY_DESCRIPTIONS.get(overall, '')}"
    )

    if total_frames is not None:
        base = f"Analysed {total_frames} frame(s). " + base

    return base


def enrich_detections(detections: List[dict]) -> List[dict]:
    """
    Add a 'severity_description' field to each detection for API responses.

    Args:
        detections: List of detection dicts.

    Returns:
        New list with 'severity_description' added.
    """
    enriched = []
    for d in detections:
        entry = dict(d)
        sev = entry.get("severity")
        entry["severity_description"] = SEVERITY_DESCRIPTIONS.get(sev, "")
        enriched.append(entry)
    return enriched
