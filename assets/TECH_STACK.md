# Technology Stack

# AI-Based Smart Classroom Monitoring System

## 1. Stack Overview

```text
┌─────────────────────────────────────────────────────────┐
│                    COMMAND CENTER                      │
│              Next.js + TypeScript + UI                │
└──────────────────────────┬──────────────────────────────┘
                           │
                  REST API / WebSocket
                           │
┌──────────────────────────▼──────────────────────────────┐
│                       BACKEND                           │
│                     FastAPI                            │
└──────────────────────────┬──────────────────────────────┘
                           │
                    Monitoring Engine
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      YOLO Object Model             Behavior Model
             │                           │
             └─────────────┬─────────────┘
                           ▼
                     OpenCV / Video
                           │
                           ▼
                     Camera / Video

                ┌─────────────────────┐
                │        SQLite       │
                │ Events / Sessions   │
                │ Classrooms / Alerts │
                └─────────────────────┘
```

---

# 2. AI / Machine Learning

## YOLO

YOLO is the core computer-vision technology used by the object/behavior detection components.

### Model 1 — Object Detection

Purpose:

- Detect general objects.
- Provide bounding boxes.
- Provide class labels and confidence scores.
- Provide real-time frame-level detections.

Dataset:

- COCO 2017
- Planned 28,000-image project split.

### Model 2 — Behavior Detection

Purpose:

- Detect classroom behaviors.

Final behavior classes:

- Fighting
- Sleeping
- Using Phone
- Reading
- Writing
- Hand Raising
- Eating

Dataset source folders:

```text
datasets/behavior_detection-fight/
datasets/behavior_detection-phone/
```

Merged output:

```text
datasets/behavior_detection/
```

---

# 3. Python Runtime

## Python

Python is responsible for:

- Model loading
- Training scripts
- Inference
- Video processing
- Monitoring logic
- Event generation
- Evidence capture
- Database operations
- Report generation

---

# 4. Deep Learning / Model Libraries

## PyTorch

Used as the deep-learning runtime underneath the model pipeline where required.

## Ultralytics

Used to load, train, validate, and run the YOLO model.

---

# 5. Computer Vision

## OpenCV

Used for:

- Webcam input
- Video files
- Frame processing
- Image resizing and conversion
- Drawing detection overlays
- Screenshot capture
- Recording support

---

# 6. Backend

## FastAPI

FastAPI provides the application backend and API layer.

Responsibilities:

- Camera/session management
- AI inference endpoints
- Event APIs
- Alert APIs
- Analytics APIs
- History APIs
- Evidence APIs
- Report generation endpoints
- Classroom configuration endpoints

---

# 7. Real-Time Communication

## WebSocket

WebSocket is used for real-time dashboard updates.

Typical messages:

```text
new_detection
occupancy_update
new_alert
camera_status
session_update
```

The goal is to avoid requiring the frontend to refresh the page to see new monitoring events.

---

# 8. Frontend

## Next.js

Next.js is the framework for the Command Center web application.

Responsibilities:

- Routing
- UI rendering
- Dashboard pages
- Classroom views
- Live surveillance UI
- Alert presentation
- Analytics presentation
- History pages
- Evidence gallery
- Report interface

## TypeScript

TypeScript is used for the frontend application to provide explicit data structures for:

- Detection objects
- Alerts
- Events
- Classrooms
- Sessions
- Camera states
- Analytics

---

# 9. UI Styling

## Tailwind CSS

Used for the Command Center interface.

The visual direction is a professional monitoring-console interface with emphasis on:

- Live surveillance
- Alert severity
- Camera status
- Clean information hierarchy
- Responsive layouts

---

# 10. Database

## SQLite

SQLite is the initial database for local development and internship demonstration.

Likely entities include:

```text
classrooms
cameras
sessions
events
alerts
evidence
recordings
```

The schema should remain simple and modular enough to move to a server database later if needed.

---

# 11. Storage

## Local File Storage

Used initially for:

- Evidence screenshots
- Recorded sessions
- Generated reports
- Logs
- Model weights

Relevant project folders:

```text
screenshots/
recordings/
reports/
logs/
models/
```

---

# 12. Reporting

## PDF Generation

Python will generate PDF monitoring reports.

Reports can contain:

- Classroom information
- Session details
- Occupancy metrics
- Event counts
- Alerts
- Timeline
- Evidence references

---

# 13. Project Data Flow

```text
Camera
  ↓
OpenCV
  ↓
AI Models
  ↓
Detection Objects
  ↓
Monitoring Engine
  ↓
Events / Alerts / Evidence
  ↓
FastAPI
  ↓
SQLite + File Storage
  ↓
WebSocket / REST
  ↓
Next.js Command Center
```

---

# 14. Development Environment

Expected local environment:

- Windows
- Python virtual environment
- NVIDIA GPU for model development/inference
- Node.js for frontend development
- VS Code
- Git / GitHub

Current project workspace:

```text
R:\project\Smart-Classroom-Monitoring
```

---

# 15. Model and Dataset Paths

Use configuration rather than hard-coding paths across modules.

Expected dataset paths:

```text
datasets/object_detection/
datasets/behavior_detection/
```

Expected model paths:

```text
models/
```

Training code should remain under:

```text
training/
```

Inference code should remain under:

```text
inference/
```

---

# 16. Architectural Separation

The codebase should keep these layers separate:

```text
AI Layer
    ↓
Inference Layer
    ↓
Monitoring / Business Logic Layer
    ↓
API Layer
    ↓
Persistence Layer
    ↓
Frontend
```

This separation is important because the dashboard should not contain model-specific logic.

---

# 17. Technology Selection Principles

- Prefer simple, stable libraries over unnecessary complexity.
- Reuse existing trained models and datasets where appropriate.
- Keep AI inference isolated from the frontend.
- Use real-time communication for live monitoring state.
- Keep classroom configuration data-driven.
- Avoid adding additional frameworks unless they solve a demonstrated requirement.
