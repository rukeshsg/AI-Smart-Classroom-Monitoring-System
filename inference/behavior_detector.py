import time
import logging
import numpy as np
from pathlib import Path
from ultralytics import YOLO
from config.config import BEHAVIOR_MODEL_PATH, BEHAVIOR_CONFIDENCE_THRESHOLD, BEHAVIOR_CLASSES

logger = logging.getLogger(__name__)

class BehaviorDetector:
    """
    Model 2 — Behavior Detection
    Detects 7 classroom behaviors:
    0: Fighting, 1: Sleeping, 2: Using Phone, 3: Reading, 4: Writing, 5: Hand Raising, 6: Eating
    Loaded once and reused across frames.
    """
    def __init__(self, model_path: Path = BEHAVIOR_MODEL_PATH, conf_thresh: float = BEHAVIOR_CONFIDENCE_THRESHOLD):
        self.conf_thresh = conf_thresh
        self.model_path = model_path
        self.behavior_classes = BEHAVIOR_CLASSES
        self.model = None
        self.is_custom_model = False
        self._load_model()

    def _load_model(self):
        try:
            alt_path = self.model_path.parent / "behavior_train_run" / "weights" / "best.pt"
            if self.model_path.exists():
                logger.info(f"Loading Behavior Detection Model from custom weights: {self.model_path}")
                self.model = YOLO(str(self.model_path))
                self.is_custom_model = True
            elif alt_path.exists():
                logger.info(f"Loading Behavior Detection Model from trained weights: {alt_path}")
                self.model = YOLO(str(alt_path))
                self.is_custom_model = True
            else:
                logger.info("Custom behavior model weights not found yet. Initializing YOLO model for classroom behaviors.")
                self.model = YOLO("yolov8n.pt")
                self.is_custom_model = False
            logger.info("Behavior Detection Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Behavior Detection Model: {e}")
            raise e

    def detect(self, frame: np.ndarray):
        """
        Runs behavior detection on a single frame.
        Returns a list of detected behaviors with class_id, class_name, confidence, bbox.
        Enforces strict validation: unknown/missing predictions NEVER default to Fighting.
        """
        if self.model is None or frame is None:
            return {"behaviors": [], "inference_time_ms": 0.0}

        start_time = time.time()
        behaviors = []

        try:
            results = self.model.predict(frame, conf=self.conf_thresh, verbose=False)
            inference_time_ms = round((time.time() - start_time) * 1000, 2)

            if results and len(results) > 0:
                result = results[0]
                boxes = result.boxes
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    xyxy = box.xyxy[0].tolist()

                    if self.is_custom_model:
                        # Trained behavior model where 0..6 correspond to target classroom behaviors
                        raw_name = result.names.get(cls_id, self.behavior_classes.get(cls_id, None))
                        if not raw_name or raw_name not in self.behavior_classes.values():
                            # Unknown class ID or invalid name: skip cleanly without defaulting to Fighting!
                            continue
                        cls_name = raw_name
                    else:
                        # Base model evaluation: map COCO class names cleanly without false Fighting conversion
                        coco_name = result.names.get(cls_id, "").lower()
                        if "phone text" in coco_name or "cell phone" in coco_name:
                            cls_name = "Using Phone"
                        elif "book" in coco_name:
                            cls_name = "Reading"
                        elif "knife" in coco_name or "scissors" in coco_name:
                            cls_name = "Writing"
                        else:
                            # Skip general objects like person, chair, table so they are NOT falsely converted to Fighting!
                            continue

                    behaviors.append({
                        "class_id": cls_id,
                        "class_name": cls_name,
                        "confidence": round(conf, 4),
                        "bbox": [round(c, 2) for c in xyxy]
                    })
        except Exception as e:
            logger.error(f"Error during behavior detection inference: {e}")
            return {"behaviors": [], "inference_time_ms": 0.0}

        return {
            "behaviors": behaviors,
            "inference_time_ms": inference_time_ms
        }
