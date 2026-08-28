import time
import logging
import numpy as np
from pathlib import Path
from ultralytics import YOLO
from config.config import OBJECT_MODEL_PATH, CONFIDENCE_THRESHOLD, CLASSROOM_OBJECT_ALLOWLIST

logger = logging.getLogger(__name__)

class ObjectDetector:
    """
    Model 1 — Object Detection
    YOLO-based object detector filtered by CLASSROOM_OBJECT_ALLOWLIST.
    Loaded once and reused across frames.
    """
    def __init__(self, model_path: Path = OBJECT_MODEL_PATH, conf_thresh: float = CONFIDENCE_THRESHOLD):
        self.conf_thresh = conf_thresh
        self.model_path = model_path
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            logger.info(f"Loading Object Detection Model from: {self.model_path}")
            # If specified model path does not exist, Ultralytics downloads yolov8n.pt automatically
            self.model = YOLO(str(self.model_path) if self.model_path.exists() else "yolov8n.pt")
            logger.info("Object Detection Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Object Detection Model: {e}")
            raise e

    def detect(self, frame: np.ndarray):
        """
        Runs object detection on a single frame (numpy BGR image).
        Returns a dictionary containing detections list, occupancy count, and latency.
        Only objects in CLASSROOM_OBJECT_ALLOWLIST are retained and displayed.
        """
        if self.model is None or frame is None:
            return {"detections": [], "occupancy": 0, "inference_time_ms": 0.0}

        start_time = time.time()
        results = self.model.predict(frame, conf=self.conf_thresh, verbose=False)
        inference_time_ms = round((time.time() - start_time) * 1000, 2)

        detections = []
        person_count = 0

        if results and len(results) > 0:
            result = results[0]
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0].item())
                raw_cls_name = result.names.get(cls_id, str(cls_id)).lower()
                conf = float(box.conf[0].item())
                xyxy = box.xyxy[0].tolist()

                # Filter out objects outside the classroom allowlist
                if raw_cls_name not in CLASSROOM_OBJECT_ALLOWLIST:
                    continue

                display_name = CLASSROOM_OBJECT_ALLOWLIST[raw_cls_name]

                if raw_cls_name == "person":
                    person_count += 1

                detections.append({
                    "class_id": cls_id,
                    "class_name": display_name,
                    "confidence": round(conf, 4),
                    "bbox": [round(c, 2) for c in xyxy]
                })

        return {
            "detections": detections,
            "occupancy": person_count,
            "inference_time_ms": inference_time_ms
        }
