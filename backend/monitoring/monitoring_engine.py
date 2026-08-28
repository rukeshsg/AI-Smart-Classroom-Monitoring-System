import os
import cv2
import uuid
import time
import logging
from datetime import datetime
from pathlib import Path
from config.config import SCREENSHOTS_DIR, RECORDINGS_DIR
from backend.storage.database import insert_event, update_event_end, insert_alert, insert_evidence, insert_recording

logger = logging.getLogger(__name__)

# 10-Minute Cooldown in seconds
POPUP_COOLDOWN_SECONDS = 600  # 10 minutes

class MonitoringEngine:
    """
    Core Monitoring Engine with:
    1. Ongoing Event Consolidation (continuous detections generate 1 event record)
    2. Real-Time Critical Fighting State Management (clears immediately when fighting stops)
    3. 10-Minute Popup Notification Cooldown Rule per (classroom_id, alert_type)
    4. Real Frame Evidence Capture (saves actual frame with AI overlays)
    5. Recording Feed Context & Metadata Tracking
    """
    def __init__(self):
        self.session_active = False
        self.session_id = None
        self.peak_occupancy = {}
        self.current_occupancy = {}
        self.video_writers = {}
        self.active_recordings = {}

        # Ongoing Events: (classroom_id, behavior_name) -> dict
        self.active_ongoing_events = {}

        # Active Fighting Live State: classroom_id -> dict
        self.active_fighting_state = {}

        # Cooldown state: (classroom_id, alert_type) -> epoch timestamp
        self.last_popup_timestamps = {}

    def process_detection_output(self, pipeline_output: dict):
        if not pipeline_output:
            return {"events": [], "alerts": [], "evidence": [], "occupancy": 0, "active_fighting": None}

        classroom_id = pipeline_output.get("classroom_id", "H305")
        timestamp = pipeline_output.get("timestamp", datetime.now().isoformat())
        date_str = pipeline_output.get("date", datetime.now().strftime("%Y-%m-%d"))
        time_str = pipeline_output.get("time", datetime.now().strftime("%I:%M:%S %p"))
        now_epoch = time.time()

        objects = pipeline_output.get("objects", [])
        behaviors = pipeline_output.get("behaviors", [])
        occupancy = pipeline_output.get("occupancy", 0)

        # Update occupancy tracking
        self.current_occupancy[classroom_id] = occupancy
        if classroom_id not in self.peak_occupancy or occupancy > self.peak_occupancy[classroom_id]:
            self.peak_occupancy[classroom_id] = occupancy

        detected_behavior_names = set(b["class_name"] for b in behaviors)

        # Critical Fighting Live State Tracking
        is_fighting_now = "Fighting" in detected_behavior_names
        fighting_conf = 0.0
        if is_fighting_now:
            for b in behaviors:
                if b["class_name"] == "Fighting":
                    fighting_conf = max(fighting_conf, b["confidence"])

            self.active_fighting_state[classroom_id] = {
                "is_active": True,
                "classroom_id": classroom_id,
                "confidence": fighting_conf,
                "timestamp": timestamp,
                "time": time_str
            }
        else:
            # Clear fighting active state immediately when fighting stops!
            self.active_fighting_state[classroom_id] = {
                "is_active": False,
                "classroom_id": classroom_id
            }

        events_output = []
        alerts_output = []
        evidence_output = []

        # Process Detected Behaviors with Ongoing Event Consolidation
        for beh in behaviors:
            beh_name = beh["class_name"]
            beh_conf = beh["confidence"]
            beh_lower = beh_name.lower()
            event_key = (classroom_id, beh_name)

            is_critical = beh_lower == "fighting"

            # Check if this is a NEW event starting
            if event_key not in self.active_ongoing_events:
                event_id = str(uuid.uuid4())
                event_obj = {
                    "id": event_id,
                    "classroom_id": classroom_id,
                    "event_type": beh_name,
                    "date": date_str,
                    "time": time_str,
                    "timestamp": timestamp,
                    "start_epoch": now_epoch,
                    "confidence": beh_conf,
                    "is_critical": is_critical,
                    "details": f"Detected behavior: {beh_name}"
                }
                self.active_ongoing_events[event_key] = event_obj

                # Log ONE event record to SQLite DB
                try:
                    insert_event(event_obj)
                except Exception as e:
                    logger.error(f"Error inserting event into DB: {e}")

                events_output.append(event_obj)

                # Capture Real Frame Evidence with AI overlays
                annotated_or_raw = pipeline_output.get("annotated_frame", pipeline_output.get("raw_frame"))
                img_path = self.capture_evidence(annotated_or_raw, classroom_id, beh_name, timestamp)

                if img_path:
                    ev_item = {
                        "id": str(uuid.uuid4()),
                        "event_id": event_id,
                        "classroom_id": classroom_id,
                        "event_type": beh_name,
                        "date": date_str,
                        "time": time_str,
                        "timestamp": timestamp,
                        "confidence": beh_conf,
                        "image_path": img_path,
                        "is_permanent": 0
                    }
                    try:
                        insert_evidence(ev_item)
                    except Exception as e:
                        logger.error(f"Error inserting evidence into DB: {e}")
                    evidence_output.append(ev_item)

                # Check Alert Requirements for Fighting & Using Phone
                alert_type = None
                if beh_lower == "fighting":
                    alert_type = "FIGHTING_ALERT"
                    title = "🚨 FIGHTING DETECTED"
                    severity = "HIGH"
                    msg = f"Fighting detected in classroom {classroom_id} at {time_str}"
                elif beh_lower == "using phone":
                    alert_type = "PHONE_USAGE_ALERT"
                    title = "📱 PHONE USAGE DETECTED"
                    severity = "MEDIUM"
                    msg = f"Phone usage detected in classroom {classroom_id} at {time_str}"

                if alert_type:
                    cooldown_key = (classroom_id, alert_type)
                    last_popup = self.last_popup_timestamps.get(cooldown_key, 0)
                    trigger_popup = (now_epoch - last_popup) >= POPUP_COOLDOWN_SECONDS

                    if trigger_popup:
                        self.last_popup_timestamps[cooldown_key] = now_epoch

                    alert_obj = {
                        "id": str(uuid.uuid4()),
                        "event_id": event_id,
                        "classroom_id": classroom_id,
                        "alert_type": alert_type,
                        "title": title,
                        "severity": severity,
                        "message": msg,
                        "date": date_str,
                        "time": time_str,
                        "timestamp": timestamp,
                        "confidence": beh_conf,
                        "image_path": img_path or "",
                        "trigger_popup": trigger_popup
                    }

                    try:
                        insert_alert(alert_obj)
                    except Exception as e:
                        logger.error(f"Error inserting alert into DB: {e}")

                    alerts_output.append(alert_obj)
            else:
                # Event is ONGOING: Update peak confidence in memory
                ongoing = self.active_ongoing_events[event_key]
                ongoing["confidence"] = max(ongoing["confidence"], beh_conf)

        # Finalize Events that HAVE STOPPED
        active_keys = list(self.active_ongoing_events.keys())
        for c_id, beh_name in active_keys:
            if c_id == classroom_id and beh_name not in detected_behavior_names:
                ended_event = self.active_ongoing_events.pop((c_id, beh_name))
                duration = int(now_epoch - ended_event["start_epoch"])
                end_ts = datetime.now().isoformat()
                try:
                    update_event_end(ended_event["id"], end_ts, duration, ended_event["confidence"])
                except Exception as e:
                    logger.error(f"Error updating event end: {e}")

        # Write frame to video recorder if active
        if classroom_id in self.active_recordings and self.active_recordings[classroom_id]:
            frame_to_write = pipeline_output.get("annotated_frame", pipeline_output.get("raw_frame"))
            self.write_recording_frame(classroom_id, frame_to_write)

        return {
            "classroom_id": classroom_id,
            "occupancy": occupancy,
            "peak_occupancy": self.peak_occupancy.get(classroom_id, occupancy),
            "events": events_output,
            "alerts": alerts_output,
            "evidence": evidence_output,
            "timestamp": timestamp,
            "active_fighting": self.active_fighting_state.get(classroom_id)
        }

    def capture_evidence(self, frame: cv2.typing.MatLike, classroom_id: str, event_type: str, timestamp: str) -> str:
        """
        Saves actual surveillance screenshot to screenshots/ directory.
        Returns relative file path /screenshots/filename.jpg.
        """
        if frame is None or not hasattr(frame, 'shape'):
            return ""
        try:
            safe_type = event_type.replace(' ', '_')
            filename = f"evidence_{classroom_id}_{safe_type}_{uuid.uuid4().hex[:8]}.jpg"
            file_path = SCREENSHOTS_DIR / filename
            cv2.imwrite(str(file_path), frame)
            logger.info(f"Captured evidence screenshot: {file_path}")
            return f"/screenshots/{filename}"
        except Exception as e:
            logger.error(f"Failed to capture evidence screenshot: {e}")
            return ""

    def start_recording(self, classroom_id: str, recording_type: str = "Single Camera", width: int = 640, height: int = 480):
        filename = f"recording_{classroom_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
        file_path = RECORDINGS_DIR / filename
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(str(file_path), fourcc, 15.0, (width, height))
        self.video_writers[classroom_id] = writer
        self.active_recordings[classroom_id] = {
            "id": str(uuid.uuid4()),
            "classroom_id": classroom_id,
            "filename": filename,
            "file_path": f"/recordings/{filename}",
            "recording_type": recording_type,
            "start_time": datetime.now().isoformat(),
            "start_epoch": time.time()
        }
        logger.info(f"Started session recording ({recording_type}) for {classroom_id} at {file_path}")
        return self.active_recordings[classroom_id]

    def write_recording_frame(self, classroom_id: str, frame: cv2.typing.MatLike):
        if classroom_id in self.video_writers and self.video_writers[classroom_id]:
            try:
                self.video_writers[classroom_id].write(frame)
            except Exception as e:
                logger.error(f"Error writing recording frame for {classroom_id}: {e}")

    def stop_recording(self, classroom_id: str):
        if classroom_id in self.video_writers and self.video_writers[classroom_id]:
            self.video_writers[classroom_id].release()
            del self.video_writers[classroom_id]
            rec_info = self.active_recordings.pop(classroom_id, None)
            if rec_info:
                rec_info["duration_seconds"] = int(time.time() - rec_info["start_epoch"])
                try:
                    insert_recording(rec_info)
                except Exception as e:
                    logger.error(f"Error saving recording metadata to DB: {e}")
            logger.info(f"Stopped session recording for {classroom_id}")
            return rec_info
        return None
