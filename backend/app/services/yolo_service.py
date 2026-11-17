# YOLO detection service with graceful degradation when weights unavailable
import os
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class YOLOService:
    def __init__(self):
        self.model = None
        self.model_path = Path(os.getenv("YOLO_MODEL_PATH", "app/weights/best_pothole_yolo.pt"))
        self._load_model()

    def _load_model(self):
        # Try to load ultralytics YOLO if available
        try:
            from ultralytics import YOLO
            if self.model_path.exists():
                self.model = YOLO(str(self.model_path))
                logger.info(f"YOLO model loaded from {self.model_path}")
            else:
                logger.warning(
                    f"YOLO weights not found at {self.model_path}. "
                    "Detection will return 'model_unavailable'."
                )
        except ImportError:
            logger.warning(
                "Ultralytics not installed. Run: pip install ultralytics. "
                "Detection will return 'model_unavailable'."
            )

    @property
    def is_available(self) -> bool:
        return self.model is not None

    def detect(self, image_path: str, conf_threshold: float = 0.25) -> dict:
        """Run YOLO inference. Returns structured result always — never fakes detections."""
        if not self.is_available:
            return {
                "model_status": "unavailable",
                "message": (
                    "YOLO model weights not loaded. "
                    "Place model at app/weights/best_pothole_yolo.pt "
                    "or set YOLO_MODEL_PATH env var."
                ),
                "detections": [],
                "detection_count": 0,
                "severity": None,
                "annotated_image_path": None,
            }
        try:
            import cv2
            resolved_p = Path(image_path)
            if not resolved_p.exists():
                from app.core.config import settings
                cand = Path(settings.UPLOAD_DIR) / "images" / resolved_p.name
                if cand.exists():
                    resolved_p = cand
                else:
                    cand = Path(settings.UPLOAD_DIR) / resolved_p.name
                    if cand.exists():
                        resolved_p = cand

            img = cv2.imread(str(resolved_p))
            if img is None:
                raise ValueError(f"Cannot read image at {image_path}")
            results = self.model(img, conf=conf_threshold, verbose=False)
            detections = []
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    cls = int(box.cls[0]) if box.cls is not None else 0
                    class_name = (
                        self.model.names.get(cls, "pothole")
                        if hasattr(self.model, "names")
                        else "pothole"
                    )
                    bbox_area = (x2 - x1) * (y2 - y1)
                    img_area = img.shape[0] * img.shape[1]
                    area_ratio = bbox_area / img_area if img_area > 0 else 0
                    detections.append(
                        {
                            "bbox": [x1, y1, x2, y2],
                            "confidence": conf,
                            "class_name": class_name,
                            "area_ratio": area_ratio,
                            "severity": self._classify_severity(conf, area_ratio),
                        }
                    )

            # Draw annotations
            annotated_path = None
            if detections:
                annotated_path = self._draw_annotations(img, detections, image_path)

            overall_severity = self._overall_severity(detections)
            return {
                "model_status": "active",
                "detections": detections,
                "detection_count": len(detections),
                "severity": overall_severity,
                "annotated_image_path": annotated_path,
            }
        except Exception as e:
            logger.error(f"Detection failed: {e}")
            return {
                "model_status": "error",
                "message": str(e),
                "detections": [],
                "detection_count": 0,
                "severity": None,
                "annotated_image_path": None,
            }

    def _classify_severity(self, confidence: float, area_ratio: float) -> str:
        score = (confidence * 0.5) + (min(area_ratio / 0.12, 1.0) * 0.5)
        if score < 0.3:
            return "LOW"
        if score < 0.55:
            return "MEDIUM"
        if score < 0.75:
            return "HIGH"
        return "CRITICAL"

    def _overall_severity(self, detections: list) -> Optional[str]:
        if not detections:
            return None
        order = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
        for sev in order:
            if any(d["severity"] == sev for d in detections):
                return sev
        return None

    def _draw_annotations(self, img, detections: list, original_path: str) -> str:
        import cv2
        from pathlib import Path as _Path

        colors = {
            "LOW": (0, 255, 0),
            "MEDIUM": (0, 165, 255),
            "HIGH": (0, 0, 255),
            "CRITICAL": (128, 0, 128),
        }
        annotated = img.copy()
        for det in detections:
            x1, y1, x2, y2 = [int(v) for v in det["bbox"]]
            color = colors.get(det["severity"], (0, 255, 0))
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            label = f"{det['class_name']} {det['confidence']:.2f} [{det['severity']}]"
            cv2.putText(
                annotated,
                label,
                (x1, max(y1 - 5, 15)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                2,
            )
        p = _Path(original_path)
        # Save annotated images to annotated/ subdir alongside original
        annotated_dir = p.parent.parent / "annotated"
        annotated_dir.mkdir(parents=True, exist_ok=True)
        out_path = str(annotated_dir / f"annotated_{p.name}")
        cv2.imwrite(out_path, annotated)
        return out_path


yolo_service = YOLOService()
