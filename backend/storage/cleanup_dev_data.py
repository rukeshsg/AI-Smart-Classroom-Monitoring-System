import sys
import os
import sqlite3
import logging
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from config.config import DB_PATH, SCREENSHOTS_DIR, RECORDINGS_DIR, REPORTS_DIR

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cleanup_dev_data")

def reset_dev_data():
    """
    ONE-TIME DEVELOPMENT RESET
    Clears test runtime monitoring records from SQLite and removes test screenshots/recordings/reports.
    Does NOT touch model weights, datasets, source code, or configuration files.
    """
    logger.info("Starting One-Time Development Data Reset...")

    # 1. Reset SQLite Database Tables
    if DB_PATH.exists():
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Truncate tables
            tables = ["events", "alerts", "evidence", "recordings", "sessions"]
            for table in tables:
                cursor.execute(f"DELETE FROM {table}")
                logger.info(f"Cleared table: {table}")
                
            conn.commit()
            conn.close()
            logger.info("SQLite database tables reset successfully.")
        except Exception as e:
            logger.error(f"Error resetting database tables: {e}")

    # 2. Clear screenshots directory
    if SCREENSHOTS_DIR.exists():
        for file in SCREENSHOTS_DIR.glob("*.jpg"):
            try:
                file.unlink()
                logger.info(f"Deleted old test screenshot: {file.name}")
            except Exception as e:
                logger.error(f"Failed to delete {file}: {e}")

    # 3. Clear recordings directory
    if RECORDINGS_DIR.exists():
        for file in RECORDINGS_DIR.glob("*.mp4"):
            try:
                file.unlink()
                logger.info(f"Deleted old test recording: {file.name}")
            except Exception as e:
                logger.error(f"Failed to delete {file}: {e}")

    # 4. Clear old test reports
    if REPORTS_DIR.exists():
        for file in REPORTS_DIR.glob("*.pdf"):
            try:
                file.unlink()
                logger.info(f"Deleted old test report: {file.name}")
            except Exception as e:
                logger.error(f"Failed to delete {file}: {e}")

    logger.info("One-Time Development Data Reset Completed Successfully.")

if __name__ == "__main__":
    reset_dev_data()
