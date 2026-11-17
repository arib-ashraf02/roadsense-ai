"""
EXIF extraction service for RoadSense AI.
Extracts GPS coordinates and other metadata from uploaded images using Pillow.
"""
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

logger = logging.getLogger(__name__)


def _dms_to_decimal(dms, ref: str) -> float:
    """Convert degrees/minutes/seconds tuple to decimal degrees."""
    try:
        degrees = float(dms[0])
        minutes = float(dms[1])
        seconds = float(dms[2])
        decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
        if ref in ("S", "W"):
            decimal = -decimal
        return decimal
    except (TypeError, IndexError, ZeroDivisionError) as e:
        logger.debug(f"DMS conversion error: {e}")
        return 0.0


def extract_gps(image_path: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Extract GPS latitude/longitude from image EXIF data.

    Args:
        image_path: Path to the image file.

    Returns:
        Tuple of (latitude, longitude) as floats, or (None, None) if unavailable.
    """
    try:
        from PIL import Image
        from PIL.ExifTags import TAGS, GPSTAGS

        img = Image.open(image_path)
        exif_data = img._getexif()  # type: ignore[attr-defined]
        if not exif_data:
            return None, None

        # Map numeric tags to names
        labeled: Dict[str, Any] = {}
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            labeled[tag] = value

        gps_info_raw = labeled.get("GPSInfo")
        if not gps_info_raw:
            return None, None

        # Map GPS sub-tags
        gps: Dict[str, Any] = {}
        for key, val in gps_info_raw.items():
            gps_tag = GPSTAGS.get(key, key)
            gps[gps_tag] = val

        lat_dms = gps.get("GPSLatitude")
        lat_ref = gps.get("GPSLatitudeRef", "N")
        lon_dms = gps.get("GPSLongitude")
        lon_ref = gps.get("GPSLongitudeRef", "E")

        if lat_dms and lon_dms:
            lat = _dms_to_decimal(lat_dms, lat_ref)
            lon = _dms_to_decimal(lon_dms, lon_ref)
            return lat, lon

        return None, None

    except Exception as e:
        logger.warning(f"EXIF extraction failed for {image_path}: {e}")
        return None, None


def extract_all_exif(image_path: str) -> Dict[str, Any]:
    """
    Extract all readable EXIF metadata from an image.

    Args:
        image_path: Path to the image file.

    Returns:
        Dictionary of EXIF tag name → value (serialisable types only).
    """
    result: Dict[str, Any] = {}
    try:
        from PIL import Image
        from PIL.ExifTags import TAGS

        img = Image.open(image_path)
        exif_data = img._getexif()  # type: ignore[attr-defined]
        if not exif_data:
            return result

        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, str(tag_id))
            # Skip non-serialisable binary blobs
            if isinstance(value, bytes):
                continue
            try:
                # Convert IFDRational / tuples to plain types
                if hasattr(value, "numerator"):
                    value = float(value)
                elif isinstance(value, tuple):
                    value = [float(v) if hasattr(v, "numerator") else v for v in value]
                result[tag] = value
            except Exception:
                pass

    except Exception as e:
        logger.warning(f"Full EXIF extraction failed for {image_path}: {e}")

    return result
