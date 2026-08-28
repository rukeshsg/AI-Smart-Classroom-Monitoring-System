from pydantic import BaseModel
from typing import List, Optional

class ClassroomSchema(BaseModel):
    id: str
    name: str
    building: str
    status: str

class CameraSchema(BaseModel):
    id: str
    classroom_id: str
    camera_name: str
    source: str
    status: str

class EventSchema(BaseModel):
    id: str
    classroom_id: str
    event_type: str
    date: str
    time: str
    timestamp: str
    confidence: float
    is_critical: bool = False
    details: Optional[str] = None

class AlertSchema(BaseModel):
    id: str
    event_id: Optional[str] = None
    classroom_id: str
    alert_type: str
    title: str
    severity: str
    message: str
    date: str
    time: str
    timestamp: str
    confidence: float
    image_path: Optional[str] = None
    resolved: bool = False

class EvidenceSchema(BaseModel):
    id: str
    event_id: Optional[str] = None
    classroom_id: str
    event_type: str
    date: str
    time: str
    timestamp: str
    confidence: float
    image_path: str

class SessionSchema(BaseModel):
    id: str
    classroom_id: str
    start_time: str
    end_time: Optional[str] = None
    peak_occupancy: int = 0
    total_events: int = 0
    critical_alerts: int = 0
    evidence_count: int = 0
    status: str = "ACTIVE"

class AnalyticsSchema(BaseModel):
    classroom_id: str
    date: str
    current_occupancy: int
    peak_occupancy: int
    behavior_counts: dict
    total_alerts: int

class ReportRequestSchema(BaseModel):
    classroom_id: str
    date: Optional[str] = None
