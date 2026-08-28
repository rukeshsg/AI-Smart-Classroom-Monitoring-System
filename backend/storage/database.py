import os
import sqlite3
import logging
from datetime import datetime, timedelta
from pathlib import Path
from config.config import DB_PATH, CLASSROOMS, SCREENSHOTS_DIR, RECORDINGS_DIR

logger = logging.getLogger(__name__)

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    logger.info(f"Initializing SQLite Database at: {DB_PATH}")
    conn = get_db_connection()
    cursor = conn.cursor()

    # Classrooms Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS classrooms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            building TEXT,
            status TEXT DEFAULT 'online',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Cameras Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cameras (
            id TEXT PRIMARY KEY,
            classroom_id TEXT NOT NULL,
            camera_name TEXT NOT NULL,
            source TEXT NOT NULL,
            status TEXT DEFAULT 'online',
            FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
        )
    """)

    # Sessions Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            classroom_id TEXT NOT NULL,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP,
            peak_occupancy INTEGER DEFAULT 0,
            avg_occupancy REAL DEFAULT 0,
            total_events INTEGER DEFAULT 0,
            critical_alerts INTEGER DEFAULT 0,
            evidence_count INTEGER DEFAULT 0,
            recording_duration INTEGER DEFAULT 0,
            status TEXT DEFAULT 'ACTIVE',
            FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
        )
    """)

    # Events Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            classroom_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            end_timestamp TEXT,
            duration_seconds INTEGER DEFAULT 0,
            confidence REAL NOT NULL,
            is_critical INTEGER DEFAULT 0,
            details TEXT,
            FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
        )
    """)

    # Alerts Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY,
            event_id TEXT,
            classroom_id TEXT NOT NULL,
            alert_type TEXT NOT NULL,
            title TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            confidence REAL NOT NULL,
            image_path TEXT,
            resolved INTEGER DEFAULT 0,
            FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
        )
    """)

    # Evidence Table with 60-Day Permanent Protection Flag
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS evidence (
            id TEXT PRIMARY KEY,
            event_id TEXT,
            classroom_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            confidence REAL NOT NULL,
            image_path TEXT NOT NULL,
            is_permanent INTEGER DEFAULT 0,
            FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
        )
    """)

    # Recordings Table with 60-Day Permanent Protection Flag & Recording Type Metadata
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recordings (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            classroom_id TEXT NOT NULL,
            file_path TEXT NOT NULL,
            recording_type TEXT DEFAULT 'Single Camera',
            duration_seconds INTEGER DEFAULT 0,
            is_permanent INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
        )
    """)

    # Alter tables safely if columns don't exist yet
    for col_def in [
        ("events", "end_timestamp TEXT"),
        ("events", "duration_seconds INTEGER DEFAULT 0"),
        ("events", "session_id TEXT"),
        ("evidence", "is_permanent INTEGER DEFAULT 0"),
        ("evidence", "session_id TEXT"),
        ("recordings", "is_permanent INTEGER DEFAULT 0"),
        ("recordings", "recording_type TEXT DEFAULT 'Single Camera'"),
        ("recordings", "duration_seconds INTEGER DEFAULT 0"),
        ("sessions", "avg_occupancy REAL DEFAULT 0"),
        ("sessions", "recording_duration INTEGER DEFAULT 0"),
    ]:
        table_name, col_info = col_def
        try:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_info}")
        except Exception:
            pass

    # Populate Default Configured Classrooms
    for room in CLASSROOMS:
        cursor.execute("""
            INSERT OR IGNORE INTO classrooms (id, name, building, status)
            VALUES (?, ?, ?, ?)
        """, (room["id"], room["name"], room["building"], room["status"]))

        cursor.execute("""
            INSERT OR IGNORE INTO cameras (id, classroom_id, camera_name, source, status)
            VALUES (?, ?, ?, ?, ?)
        """, (f"CAM-{room['id']}", room["id"], f"Camera {room['id']}", "0", room["status"]))

    conn.commit()
    conn.close()
    logger.info("SQLite Database initialized successfully.")

# Helper Database Operations
def insert_event(event: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO events (id, classroom_id, event_type, date, time, timestamp, end_timestamp, duration_seconds, confidence, is_critical, details, session_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event["id"], event["classroom_id"], event["event_type"],
        event["date"], event["time"], event["timestamp"],
        event.get("end_timestamp"), event.get("duration_seconds", 0),
        event["confidence"], 1 if event.get("is_critical") else 0,
        event.get("details", ""), event.get("session_id")
    ))
    conn.commit()
    conn.close()

def update_event_end(event_id: str, end_timestamp: str, duration_seconds: int, peak_confidence: float):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE events
        SET end_timestamp = ?, duration_seconds = ?, confidence = MAX(confidence, ?)
        WHERE id = ?
    """, (end_timestamp, duration_seconds, peak_confidence, event_id))
    conn.commit()
    conn.close()

def insert_alert(alert: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO alerts (id, event_id, classroom_id, alert_type, title, severity, message, date, time, timestamp, confidence, image_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        alert["id"], alert.get("event_id"), alert["classroom_id"],
        alert["alert_type"], alert["title"], alert["severity"],
        alert["message"], alert["date"], alert["time"], alert["timestamp"],
        alert["confidence"], alert.get("image_path", "")
    ))
    conn.commit()
    conn.close()

def insert_evidence(ev: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO evidence (id, event_id, classroom_id, event_type, date, time, timestamp, confidence, image_path, is_permanent, session_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ev["id"], ev.get("event_id"), ev["classroom_id"],
        ev["event_type"], ev["date"], ev["time"], ev["timestamp"],
        ev["confidence"], ev["image_path"], 1 if ev.get("is_permanent") else 0,
        ev.get("session_id")
    ))
    conn.commit()
    conn.close()

def insert_session(session: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO sessions
        (id, classroom_id, start_time, end_time, peak_occupancy, avg_occupancy,
         total_events, critical_alerts, evidence_count, recording_duration, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        session["id"], session["classroom_id"],
        session["start_time"], session.get("end_time"),
        session.get("peak_occupancy", 0), session.get("avg_occupancy", 0),
        session.get("total_events", 0), session.get("critical_alerts", 0),
        session.get("evidence_count", 0), session.get("recording_duration", 0),
        session.get("status", "ACTIVE")
    ))
    conn.commit()
    conn.close()

def update_session_db(session_id: str, updates: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    set_parts = ", ".join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values()) + [session_id]
    cursor.execute(f"UPDATE sessions SET {set_parts} WHERE id = ?", values)
    conn.commit()
    conn.close()

def delete_evidence_db(evidence_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute("SELECT image_path FROM evidence WHERE id = ?", (evidence_id,)).fetchone()
    if row:
        img_rel_path = row["image_path"]
        filename = img_rel_path.split("/")[-1]
        file_path = SCREENSHOTS_DIR / filename
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                logger.error(f"Error unlinking screenshot file: {e}")
        cursor.execute("DELETE FROM evidence WHERE id = ?", (evidence_id,))
        conn.commit()
        conn.close()
        return True
    conn.close()
    return False

def toggle_permanent_evidence_db(evidence_id: str, is_permanent: bool) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE evidence SET is_permanent = ? WHERE id = ?", (1 if is_permanent else 0, evidence_id))
    affected = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return affected

def insert_recording(rec: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO recordings (id, session_id, classroom_id, file_path, recording_type, duration_seconds, is_permanent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        rec.get("id"), rec.get("session_id"), rec["classroom_id"],
        rec["file_path"], rec.get("recording_type", "Single Camera"),
        rec.get("duration_seconds", 0), 1 if rec.get("is_permanent") else 0
    ))
    conn.commit()
    conn.close()

def delete_recording_db(recording_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute("SELECT file_path FROM recordings WHERE id = ?", (recording_id,)).fetchone()
    if row:
        file_rel_path = row["file_path"]
        filename = file_rel_path.split("/")[-1]
        file_path = RECORDINGS_DIR / filename
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                logger.error(f"Error unlinking recording file: {e}")
        cursor.execute("DELETE FROM recordings WHERE id = ?", (recording_id,))
        conn.commit()
        conn.close()
        return True
    conn.close()
    return False

def toggle_permanent_recording_db(recording_id: str, is_permanent: bool) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE recordings SET is_permanent = ? WHERE id = ?", (1 if is_permanent else 0, recording_id))
    affected = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return affected

def get_classrooms_db():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM classrooms").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_events_db(classroom_id: str = None, date_filter: str = None, event_type_filter: str = None):
    conn = get_db_connection()
    query = "SELECT * FROM events WHERE 1=1"
    params = []
    if classroom_id:
        query += " AND classroom_id = ?"
        params.append(classroom_id)
    if date_filter:
        query += " AND date = ?"
        params.append(date_filter)
    if event_type_filter:
        query += " AND event_type = ?"
        params.append(event_type_filter)
    query += " ORDER BY timestamp DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_alerts_db(classroom_id: str = None):
    conn = get_db_connection()
    query = "SELECT * FROM alerts WHERE 1=1"
    params = []
    if classroom_id:
        query += " AND classroom_id = ?"
        params.append(classroom_id)
    query += " ORDER BY timestamp DESC LIMIT 50"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_evidence_db(classroom_id: str = None, date_filter: str = None, session_id: str = None):
    conn = get_db_connection()
    query = "SELECT * FROM evidence WHERE 1=1"
    params = []
    if classroom_id:
        query += " AND classroom_id = ?"
        params.append(classroom_id)
    if date_filter:
        query += " AND date = ?"
        params.append(date_filter)
    if session_id:
        query += " AND session_id = ?"
        params.append(session_id)
    query += " ORDER BY timestamp DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_sessions_db(classroom_id: str = None, date_filter: str = None):
    """List sessions for a classroom, optionally filtered by date."""
    conn = get_db_connection()
    query = "SELECT * FROM sessions WHERE 1=1"
    params = []
    if classroom_id:
        query += " AND classroom_id = ?"
        params.append(classroom_id)
    if date_filter:
        query += " AND date(start_time) = ?"
        params.append(date_filter)
    query += " ORDER BY start_time DESC LIMIT 30"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_session_detail_db(session_id: str):
    """Get a single session with its joined events, evidence, and recording."""
    conn = get_db_connection()

    session_row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
    if not session_row:
        conn.close()
        return None

    session = dict(session_row)

    events = conn.execute(
        "SELECT * FROM events WHERE session_id = ? ORDER BY timestamp ASC",
        (session_id,)
    ).fetchall()
    session["events"] = [dict(e) for e in events]

    evidence = conn.execute(
        "SELECT * FROM evidence WHERE session_id = ? ORDER BY timestamp ASC",
        (session_id,)
    ).fetchall()
    session["evidence"] = [dict(e) for e in evidence]

    recordings = conn.execute(
        "SELECT * FROM recordings WHERE session_id = ? ORDER BY created_at DESC",
        (session_id,)
    ).fetchall()
    session["recordings"] = [dict(r) for r in recordings]

    conn.close()
    return session

def get_events_by_date_range_db(classroom_id: str, start_date: str, end_date: str):
    """Fetch events across a date range for long-term analytics."""
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT * FROM events WHERE classroom_id = ? AND date >= ? AND date <= ? ORDER BY timestamp ASC",
        (classroom_id, start_date, end_date)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_recordings_db(classroom_id: str = None):
    conn = get_db_connection()
    query = "SELECT * FROM recordings WHERE 1=1"
    params = []
    if classroom_id:
        query += " AND classroom_id = ?"
        params.append(classroom_id)
    query += " ORDER BY created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def purge_expired_data_db(days: int = 60):
    """
    60-Day Automatic Data Retention Rule:
    Deletes evidence screenshots and recordings older than `days` (default 60 days)
    where `is_permanent` == 0.
    Items with `is_permanent` == 1 are strictly protected from deletion.
    """
    cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Expired Evidence
    expired_evidence = cursor.execute(
        "SELECT id, image_path FROM evidence WHERE is_permanent = 0 AND timestamp < ?", (cutoff_date,)
    ).fetchall()
    for ev in expired_evidence:
        filename = ev["image_path"].split("/")[-1]
        file_path = SCREENSHOTS_DIR / filename
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                logger.error(f"Error unlinking expired evidence: {e}")
        cursor.execute("DELETE FROM evidence WHERE id = ?", (ev["id"],))
    logger.info(f"Purged {len(expired_evidence)} expired evidence items (age >= {days} days).")

    # 2. Expired Recordings
    expired_recordings = cursor.execute(
        "SELECT id, file_path FROM recordings WHERE is_permanent = 0 AND created_at < ?", (cutoff_date,)
    ).fetchall()
    for rec in expired_recordings:
        filename = rec["file_path"].split("/")[-1]
        file_path = RECORDINGS_DIR / filename
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                logger.error(f"Error unlinking expired recording: {e}")
        cursor.execute("DELETE FROM recordings WHERE id = ?", (rec["id"],))
    logger.info(f"Purged {len(expired_recordings)} expired recording items (age >= {days} days).")

    conn.commit()
    conn.close()


def delete_alert_db(alert_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute("SELECT id FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    if row:
        cursor.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
        conn.commit()
        conn.close()
        return True
    conn.close()
    return False


def check_classroom_exists_db(classroom_id: str) -> bool:
    conn = get_db_connection()
    row = conn.execute("SELECT id FROM classrooms WHERE id = ?", (classroom_id,)).fetchone()
    conn.close()
    return row is not None


def insert_classroom_db(classroom: dict, camera: dict = None):
    """Insert a new classroom and its associated camera into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO classrooms (id, name, building, status)
        VALUES (?, ?, ?, ?)
    """, (
        classroom["id"],
        classroom.get("name", f"Classroom {classroom['id']}"),
        classroom.get("building", "Unknown"),
        classroom.get("status", "online")
    ))
    if camera:
        cursor.execute("""
            INSERT OR IGNORE INTO cameras (id, classroom_id, camera_name, source, status)
            VALUES (?, ?, ?, ?, ?)
        """, (
            camera.get("id", f"CAM-{classroom['id']}"),
            classroom["id"],
            camera.get("camera_name", f"Camera {classroom['id']}"),
            camera.get("source", "0"),
            camera.get("status", "online")
        ))
    conn.commit()
    conn.close()
