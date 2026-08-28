import os
from pathlib import Path

# Base Directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Paths
DATASETS_DIR = BASE_DIR / "datasets"
OBJECT_DATASET_DIR = DATASETS_DIR / "object_detection"
BEHAVIOR_DATASET_DIR = DATASETS_DIR / "behavior_detection"

MODELS_DIR = BASE_DIR / "models"
OBJECT_MODEL_PATH = MODELS_DIR / "yolov8n.pt"  # Pretrained YOLOv8 for COCO 80 classes
BEHAVIOR_MODEL_PATH = MODELS_DIR / "behavior_yolo.pt"  # Fine-tuned classroom behavior model

SCREENSHOTS_DIR = BASE_DIR / "screenshots"
RECORDINGS_DIR = BASE_DIR / "recordings"
REPORTS_DIR = BASE_DIR / "reports"
LOGS_DIR = BASE_DIR / "logs"
DB_PATH = BASE_DIR / "backend" / "storage" / "classroom_monitoring.db"

# Ensure required directories exist
for folder in [MODELS_DIR, SCREENSHOTS_DIR, RECORDINGS_DIR, REPORTS_DIR, LOGS_DIR, DB_PATH.parent]:
    folder.mkdir(parents=True, exist_ok=True)

# Configurable Parameters
CONFIDENCE_THRESHOLD = 0.35
BEHAVIOR_CONFIDENCE_THRESHOLD = 0.25
IMG_SIZE = 640

# Classroom Object Detection Allowlist (COCO Class -> Display Name)
# Only exposed classroom objects are retained and shown. Irrelevant COCO detections (e.g. donut, clock mistakes) are filtered.
CLASSROOM_OBJECT_ALLOWLIST = {
    "person": "Person",
    "chair": "Chair",
    "dining table": "Table",
    "table": "Table",
    "laptop": "Laptop",
    "tv": "Monitor",
    "tvmonitor": "Monitor",
    "keyboard": "Keyboard",
    "mouse": "Mouse",
    "cell phone": "Cell Phone",
    "phone": "Cell Phone",
    "book": "Book",
    "backpack": "Backpack",
    "bottle": "Bottle",
    "cup": "Cup",
    "clock": "Clock",
    "scissors": "Scissors",
    "handbag": "Handbag",
}

# Supported Classrooms
CLASSROOMS = [
    {"id": "H305", "name": "Main Lecture Hall H305", "building": "Building H", "status": "online"},
    {"id": "H003", "name": "Auditorium H003", "building": "Building H", "status": "online"},
    {"id": "B202", "name": "Classroom B202", "building": "Building B", "status": "online"},
    {"id": "C104", "name": "Seminar Room C104", "building": "Building C", "status": "online"},
    {"id": "G202", "name": "Classroom G202", "building": "Building G", "status": "offline"},
    {"id": "J301", "name": "Lecture Room J301", "building": "Building J", "status": "online"},
    {"id": "L204", "name": "Computer Science Lab L204", "building": "Laboratory L", "status": "online"},
]

# Behavior Classes
BEHAVIOR_CLASSES = {
    0: "Fighting",
    1: "Sleeping",
    2: "Using Phone",
    3: "Reading",
    4: "Writing",
    5: "Hand Raising",
    6: "Eating"
}

