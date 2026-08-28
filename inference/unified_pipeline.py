import time
import logging
import cv2
import numpy as np
from datetime import datetime
from inference.object_detector import ObjectDetector
from inference.behavior_detector import BehaviorDetector

logger = logging.getLogger(__name__)

class UnifiedPipeline:
    """
    Combines Model 1 (Object Detection) and Model 2 (Behavior Detection)
    into a single execution flow for input camera frames.
    Loaded ONCE and reused.
    """
    def __init__(self):
        logger.info("Initializing Unified AI Inference Pipeline...")
        self.object_detector = ObjectDetector()
        self.behavior_detector = BehaviorDetector()
        logger.info("Unified AI Inference Pipeline initialized.")

    def process_frame(self, frame: np.ndarray, classroom_id: str = "H305"):
        """
        Runs both object and behavior detection on the frame.
        Draws bounding box overlays on a copy of the frame.
        Returns a structured dictionary with objects, behaviors, occupancy, overlays, and metadata.
        """
        if frame is None:
            return None

        timestamp = datetime.now().isoformat()
        formatted_time = datetime.now().strftime("%I:%M:%S %p")
        formatted_date = datetime.now().strftime("%Y-%m-%d")

        # Step 1: Run Object Detector
        obj_res = self.object_detector.detect(frame)
        objects = obj_res["detections"]
        occupancy = obj_res["occupancy"]

        # Step 2: Run Behavior Detector
        beh_res = self.behavior_detector.detect(frame)
        behaviors = beh_res["behaviors"]

        total_inference_time = round(obj_res["inference_time_ms"] + beh_res["inference_time_ms"], 2)

        # Draw overlays on a copy of the frame
        annotated_frame = frame.copy()

        # Draw object bounding boxes (Green/Blue)
        for obj in objects:
            x1, y1, x2, y2 = [int(v) for v in obj["bbox"]]
            label = f"{obj['class_name']} {obj['confidence']:.2f}"
            color = (0, 255, 0) if obj["class_name"].lower() == "person" else (255, 165, 0)
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(annotated_frame, label, (x1, max(y1 - 8, 15)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # Draw behavior bounding boxes (Red for Fighting, Magenta for others)
        for beh in behaviors:
            x1, y1, x2, y2 = [int(v) for v in beh["bbox"]]
            label = f"BEH: {beh['class_name']} {beh['confidence']:.2f}"
            is_fighting = beh["class_name"].lower() == "fighting"
            color = (0, 0, 255) if is_fighting else (255, 0, 255)
            thickness = 3 if is_fighting else 2
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, thickness)
            cv2.putText(annotated_frame, label, (x1, max(y1 - 25, 25)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        # Add classroom ID & occupancy watermark overlay
        info_text = f"Classroom: {classroom_id} | Occupancy: {occupancy} | FPS latency: {total_inference_time}ms"
        cv2.putText(annotated_frame, info_text, (15, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2, cv2.LINE_AA)

        return {
            "classroom_id": classroom_id,
            "timestamp": timestamp,
            "date": formatted_date,
            "time": formatted_time,
            "objects": objects,
            "behaviors": behaviors,
            "occupancy": occupancy,
            "inference_time_ms": total_inference_time,
            "annotated_frame": annotated_frame,
            "raw_frame": frame
        }
