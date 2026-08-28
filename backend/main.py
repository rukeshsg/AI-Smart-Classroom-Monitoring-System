import os
import cv2
import time
import asyncio
import logging
import threading
from datetime import datetime
from typing import Optional, List
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel

from config.config import SCREENSHOTS_DIR, RECORDINGS_DIR, REPORTS_DIR
from backend.storage.database import (
    init_db, get_classrooms_db, get_events_db, get_alerts_db, get_evidence_db,
    get_recordings_db, get_sessions_db, get_session_detail_db,
    get_events_by_date_range_db,
    delete_evidence_db, toggle_permanent_evidence_db,
    delete_recording_db, toggle_permanent_recording_db, purge_expired_data_db,
    delete_alert_db, insert_classroom_db, check_classroom_exists_db
)
from backend.monitoring.monitoring_engine import MonitoringEngine
from inference.unified_pipeline import UnifiedPipeline
from backend.services.report_generator import generate_pdf_report
from backend.storage.cleanup_dev_data import reset_dev_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SmartClassroomBackend")

app = FastAPI(
    title="AI-Based Smart Classroom Monitoring System Backend",
    description="Command Center Real-time Surveillance & AI Analytics API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/screenshots", StaticFiles(directory=str(SCREENSHOTS_DIR)), name="screenshots")
app.mount("/recordings", StaticFiles(directory=str(RECORDINGS_DIR)), name="recordings")
app.mount("/reports", StaticFiles(directory=str(REPORTS_DIR)), name="reports")

monitoring_engine = MonitoringEngine()
ai_pipeline = UnifiedPipeline()

class ActiveConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        if self._loop is None:
            self._loop = asyncio.get_event_loop()

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending WebSocket message: {e}")
                self.disconnect(connection)

    def broadcast_from_thread(self, message: dict):
        """Thread-safe broadcast: schedules onto the asyncio event loop."""
        if self._loop and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(self.broadcast(message), self._loop)

ws_manager = ActiveConnectionManager()

@app.on_event("startup")
def startup_event():
    init_db()
    # Run 60-day automatic retention check on startup
    purge_expired_data_db(days=60)
    logger.info("Command Center Backend Initialized Successfully.")

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "system": "AI-Based Smart Classroom Monitoring System",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/classrooms")
def get_classrooms():
    return get_classrooms_db()


class AddClassroomSchema(BaseModel):
    id: str
    name: str
    building: str
    floor: Optional[str] = None
    description: Optional[str] = None
    camera_name: Optional[str] = None
    camera_source: Optional[str] = "0"
    feed_type: Optional[str] = "webcam"


@app.post("/api/classrooms")
def add_classroom(req: AddClassroomSchema):
    classroom_id = req.id.strip().upper()
    if not classroom_id:
        raise HTTPException(status_code=400, detail="Classroom ID is required.")
    if check_classroom_exists_db(classroom_id):
        raise HTTPException(status_code=409, detail=f"Classroom ID '{classroom_id}' already exists.")

    classroom_data = {
        "id": classroom_id,
        "name": req.name or f"Classroom {classroom_id}",
        "building": req.building or "Unknown Building",
        "status": "online",
    }
    camera_data = {
        "id": f"CAM-{classroom_id}",
        "classroom_id": classroom_id,
        "camera_name": req.camera_name or f"Camera {classroom_id}",
        "source": req.camera_source or "0",
        "status": "online",
    }
    insert_classroom_db(classroom_data, camera_data)
    return {
        "status": "SUCCESS",
        "message": f"Classroom {classroom_id} added successfully.",
        "classroom": classroom_data
    }

@app.get("/api/events")
def get_events(
    classroom_id: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None)
):
    return get_events_db(classroom_id, date, event_type)

@app.get("/api/alerts")
def get_alerts(classroom_id: Optional[str] = Query(None)):
    return get_alerts_db(classroom_id)

@app.delete("/api/alerts/{alert_id}")
def delete_alert(alert_id: str):
    success = delete_alert_db(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert record not found")
    return {"status": "SUCCESS", "message": f"Deleted alert {alert_id}"}

@app.get("/api/evidence")
def get_evidence(
    classroom_id: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    session_id: Optional[str] = Query(None)
):
    return get_evidence_db(classroom_id, date, session_id)

@app.delete("/api/evidence/{evidence_id}")
def delete_evidence(evidence_id: str):
    success = delete_evidence_db(evidence_id)
    if not success:
        raise HTTPException(status_code=404, detail="Evidence record not found")
    return {"status": "SUCCESS", "message": f"Deleted evidence {evidence_id}"}

@app.post("/api/evidence/{evidence_id}/permanent")
def toggle_permanent_evidence(evidence_id: str, is_permanent: bool = Query(...)):
    success = toggle_permanent_evidence_db(evidence_id, is_permanent)
    if not success:
        raise HTTPException(status_code=404, detail="Evidence record not found")
    return {"status": "SUCCESS", "is_permanent": is_permanent}

@app.get("/api/recordings")
def get_recordings(classroom_id: Optional[str] = Query(None)):
    return get_recordings_db(classroom_id)

@app.get("/api/recordings/download/{filename}")
def download_recording(filename: str):
    file_path = RECORDINGS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Recording file not found")
    return FileResponse(
        path=str(file_path),
        media_type="video/mp4",
        filename=filename
    )

@app.delete("/api/recordings/{recording_id}")
def delete_recording(recording_id: str):
    success = delete_recording_db(recording_id)
    if not success:
        raise HTTPException(status_code=404, detail="Recording record not found")
    return {"status": "SUCCESS", "message": f"Deleted recording {recording_id}"}

@app.post("/api/recordings/{recording_id}/permanent")
def toggle_permanent_recording(recording_id: str, is_permanent: bool = Query(...)):
    success = toggle_permanent_recording_db(recording_id, is_permanent)
    if not success:
        raise HTTPException(status_code=404, detail="Recording record not found")
    return {"status": "SUCCESS", "is_permanent": is_permanent}

@app.post("/api/cleanup/retention")
def trigger_retention_purge(days: int = Query(60)):
    purge_expired_data_db(days=days)
    return {"status": "SUCCESS", "message": f"Ran 60-day automatic data retention purge (age >= {days} days)."}

@app.post("/api/cleanup/reset_dev_data")
def trigger_reset_dev_data():
    reset_dev_data()
    return {"status": "SUCCESS", "message": "Development data reset successfully."}

@app.get("/api/analytics")
def get_analytics(classroom_id: Optional[str] = Query("H305"), date: Optional[str] = Query(None)):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    events = get_events_db(classroom_id, target_date)
    alerts = get_alerts_db(classroom_id)

    behavior_counts = {
        "Fighting": 0, "Sleeping": 0, "Using Phone": 0,
        "Reading": 0, "Writing": 0, "Hand Raising": 0, "Eating": 0
    }
    for e in events:
        etype = e["event_type"]
        if etype in behavior_counts:
            behavior_counts[etype] += 1

    return {
        "classroom_id": classroom_id,
        "date": target_date,
        "current_occupancy": monitoring_engine.current_occupancy.get(classroom_id, 0),
        "peak_occupancy": monitoring_engine.peak_occupancy.get(classroom_id, 0),
        "total_events": len(events),
        "total_alerts": len(alerts),
        "behavior_counts": behavior_counts
    }

@app.get("/api/analytics/classroom")
def get_classroom_analytics(
    classroom_id: str = Query("H305"),
    range_days: int = Query(7)
):
    """Multi-day analytics for long-term Classroom Analytics view."""
    from datetime import timedelta
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=range_days - 1)).strftime("%Y-%m-%d")
    events = get_events_by_date_range_db(classroom_id, start_date, end_date)
    alerts = get_alerts_db(classroom_id)
    sessions = get_sessions_db(classroom_id)

    # Aggregate behavior counts over the range
    behavior_counts = {
        "Fighting": 0, "Sleeping": 0, "Using Phone": 0,
        "Reading": 0, "Writing": 0, "Hand Raising": 0, "Eating": 0
    }
    # Daily event totals for trend chart
    from datetime import timedelta
    daily_totals: dict = {}
    for i in range(range_days):
        d = (datetime.now() - timedelta(days=range_days - 1 - i)).strftime("%Y-%m-%d")
        daily_totals[d] = {"events": 0, "fighting": 0, "phone": 0}

    for e in events:
        etype = e["event_type"]
        if etype in behavior_counts:
            behavior_counts[etype] += 1
        day = e.get("date", "")[:10]
        if day in daily_totals:
            daily_totals[day]["events"] += 1
            if etype == "Fighting":
                daily_totals[day]["fighting"] += 1
            elif etype == "Using Phone":
                daily_totals[day]["phone"] += 1

    # Alert breakdown
    fighting_alerts = len([a for a in alerts if a["alert_type"] == "FIGHTING_ALERT"])
    phone_alerts = len([a for a in alerts if a["alert_type"] == "PHONE_USAGE_ALERT"])
    other_alerts = len(alerts) - fighting_alerts - phone_alerts

    return {
        "classroom_id": classroom_id,
        "start_date": start_date,
        "end_date": end_date,
        "range_days": range_days,
        "total_events": len(events),
        "total_sessions": len(sessions),
        "total_alerts": len(alerts),
        "fighting_alerts": fighting_alerts,
        "phone_alerts": phone_alerts,
        "other_alerts": other_alerts,
        "peak_occupancy": monitoring_engine.peak_occupancy.get(classroom_id, 0),
        "current_occupancy": monitoring_engine.current_occupancy.get(classroom_id, 0),
        "behavior_counts": behavior_counts,
        "daily_totals": [
            {"date": d, "short_date": d[5:], **v}
            for d, v in daily_totals.items()
        ]
    }

@app.get("/api/sessions")
def list_sessions(
    classroom_id: Optional[str] = Query(None),
    date: Optional[str] = Query(None)
):
    """List sessions for a classroom, filtered by date."""
    return get_sessions_db(classroom_id, date)

@app.get("/api/sessions/{session_id}")
def get_session_detail(session_id: str):
    """Get full session details including events, evidence, and recordings."""
    result = get_session_detail_db(session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return result

@app.get("/api/daily_summary")
def get_daily_summary(classroom_id: str = Query("H305"), date: Optional[str] = Query(None)):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    events = get_events_db(classroom_id, target_date)
    alerts = get_alerts_db(classroom_id)

    phone_alerts = len([a for a in alerts if a["alert_type"] == "PHONE_USAGE_ALERT"])
    fighting_alerts = len([a for a in alerts if a["alert_type"] == "FIGHTING_ALERT"])
    sleeping_events = len([e for e in events if e["event_type"].lower() == "sleeping"])

    return {
        "classroom_id": classroom_id,
        "date": target_date,
        "occupancy": monitoring_engine.current_occupancy.get(classroom_id, 0),
        "peak_occupancy": monitoring_engine.peak_occupancy.get(classroom_id, 0),
        "phone_alerts": phone_alerts,
        "fighting_alerts": fighting_alerts,
        "sleeping_events": sleeping_events,
        "total_events": len(events)
    }

@app.post("/api/sessions/start")
def start_session(classroom_id: str = Query("H305"), recording_type: str = Query("Single Camera")):
    rec_info = monitoring_engine.start_recording(classroom_id, recording_type)
    return {"status": "SUCCESS", "message": f"Started recording session ({recording_type}) for {classroom_id}", "recording": rec_info}

@app.post("/api/sessions/stop")
def stop_session(classroom_id: str = Query("H305")):
    rec_info = monitoring_engine.stop_recording(classroom_id)
    return {"status": "SUCCESS", "message": f"Stopped recording session for {classroom_id}", "recording": rec_info}

class ReportRequestSchema(BaseModel):
    classroom_id: str
    date: Optional[str] = None

@app.post("/api/reports/generate")
def generate_report(req: ReportRequestSchema):
    date_str = req.date or datetime.now().strftime("%Y-%m-%d")
    events = get_events_db(req.classroom_id, date_str)
    alerts = get_alerts_db(req.classroom_id)
    evidence = get_evidence_db(req.classroom_id)
    peak_occ = monitoring_engine.peak_occupancy.get(req.classroom_id, 0)

    pdf_rel_path = generate_pdf_report(req.classroom_id, date_str, events, alerts, evidence, peak_occ)
    filename = pdf_rel_path.split("/")[-1]
    file_path = REPORTS_DIR / filename

    # Verify file actually exists and is non-empty
    if not file_path.exists() or file_path.stat().st_size == 0:
        raise HTTPException(status_code=500, detail="Failed to generate valid PDF report file.")

    return {"status": "SUCCESS", "report_url": pdf_rel_path, "filename": filename}

@app.get("/api/reports/download/{filename}")
def download_report(filename: str):
    file_path = REPORTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Real-Time MJPEG Stream with WebSocket broadcast of detection results
def generate_video_stream(classroom_id: str):
    cap = cv2.VideoCapture(0)
    while True:
        success, frame = cap.read()
        if not success:
            frame = ai_pipeline.create_mock_classroom_frame(classroom_id)

        output = ai_pipeline.process_frame(frame, classroom_id)
        processed = monitoring_engine.process_detection_output(output)

        # Broadcast real-time updates to WebSocket clients (thread-safe)
        if processed:
            # Occupancy update
            ws_manager.broadcast_from_thread({
                "type": "occupancy_update",
                "classroom_id": classroom_id,
                "occupancy": processed.get("occupancy", 0),
                "peak_occupancy": processed.get("peak_occupancy", 0),
                "active_fighting": processed.get("active_fighting"),
            })
            # New events
            for ev in processed.get("events", []):
                ws_manager.broadcast_from_thread({"type": "new_detection", "data": ev})
            # New alerts
            for alt in processed.get("alerts", []):
                ws_manager.broadcast_from_thread({"type": "new_alert", "data": alt})
            # New evidence
            for evid in processed.get("evidence", []):
                ws_manager.broadcast_from_thread({"type": "new_evidence", "data": evid})

        annotated_frame = output.get("annotated_frame", frame)
        ret, jpeg = cv2.imencode(".jpg", annotated_frame)
        if not ret:
            continue

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
        time.sleep(0.06)


@app.get("/api/video_feed/{classroom_id}")
def video_feed(classroom_id: str):
    return StreamingResponse(
        generate_video_stream(classroom_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.websocket("/ws/live/{classroom_id}")
async def websocket_live_endpoint(websocket: WebSocket, classroom_id: str):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep alive — client may send heartbeat pings
            await asyncio.sleep(30)
    except (WebSocketDisconnect, Exception):
        ws_manager.disconnect(websocket)
