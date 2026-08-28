# Gemini / AI Coding Instructions

# AI-Based Smart Classroom Monitoring System

This file defines the project context and coding rules for AI-assisted development.

---

## 1. Project Identity

Project name:

**AI-Based Smart Classroom Monitoring System**

Primary application name:

**Command Center**

The Command Center is a real-time web interface for monitoring multiple classrooms/labs using AI detections.

---

## 2. Non-Negotiable Product Scope

The system contains exactly two AI model components in the current design:

### Model 1 — Object Detection

- YOLO-based
- COCO 2017 dataset
- Full 80 COCO classes

### Model 2 — Behavior Detection

Final classes:

```text
Fighting
Sleeping
Using Phone
Reading
Writing
Hand Raising
Eating
```

Do not introduce another AI model unless explicitly requested by the project owner.

---

## 3. Current Core Features

### Monitoring

- Real-time camera monitoring
- Multi-classroom support
- Classroom/lab IDs
- Occupancy counting
- Phone Usage Alert
- Fighting Alert
- Behavior detection
- Automatic evidence screenshot capture
- Event logging
- Session recording

### Command Center

- Live Surveillance Feed as the default page
- Multi-classroom selector
- Multi-camera overview
- Active Alerts
- Classroom Analytics
- Daily Summary
- Session Summary
- Event Timeline
- Detection Analytics
- Detection History
- Evidence Gallery
- Date Filter
- Detection Filters
- Camera Status
- PDF Reports

### Intentionally excluded

Do not add:

- Object Search
- Behavior Search

Unless the project owner explicitly requests them.

---

## 4. Classroom Identity

Classroom IDs are configurable strings.

Examples:

```text
H305
H003
B202
C104
G202
J301
L204
```

`L` may represent a laboratory.

Never hard-code the meaning of a specific building beyond configurable metadata.

Every alert/event/evidence item must retain the classroom ID.

---

## 5. Default UI Behavior

The Command Center must open directly to:

**Live Surveillance Feed**

Do not make analytics, charts, or object counts the landing page.

The live page should prioritize:

1. Live feed
2. Classroom identity
3. Current occupancy
4. Active alerts
5. AI overlays
6. Camera status

---

## 6. Alert Rules

### Phone Usage

Use the combined evidence of object and behavior detections where appropriate.

Conceptual flow:

```text
Person + Cell Phone + Using Phone
            ↓
      Phone Usage Event
            ↓
         Alert
```

The alert must include the classroom ID and timestamp.

### Fighting

`Fighting` is high priority.

Use a prominent red alert/popup and include classroom ID and timestamp.

Do not make phone usage visually identical to fighting alerts.

---

## 7. Evidence Rules

Important events should capture a screenshot automatically.

Recommended evidence metadata:

```text
id
classroom_id
event_type
date
time
confidence
image_path
```

Do not store screenshots with unclear or non-repeatable names. Use timestamp-based or UUID-safe filenames.

---

## 8. Backend Rules

Use FastAPI as the backend.

Keep model inference code separate from API routes.

Recommended conceptual structure:

```text
backend/
├── api/
├── services/
├── models/
├── monitoring/
├── storage/
└── main.py
```

Do not place large model-inference functions directly inside route handlers.

---

## 9. Frontend Rules

Use:

- Next.js
- TypeScript
- Tailwind CSS

The frontend should consume backend APIs and real-time WebSocket data.

Do not put Python or model inference logic into the frontend.

Use typed interfaces for:

- Classroom
- Camera
- Detection
- Behavior
- Event
- Alert
- Session
- Evidence
- Analytics

---

## 10. Real-Time Rules

Use WebSocket for live updates such as:

```text
new_detection
occupancy_update
new_alert
camera_status
session_status
```

REST APIs should be used for normal CRUD/query operations and report generation.

Do not repeatedly poll the backend for every frame.

---

## 11. Database Rules

Use SQLite initially.

Keep persistence modular so a future PostgreSQL migration is possible.

Important entities:

```text
classrooms
cameras
sessions
events
alerts
evidence
recordings
```

Do not store large image/video binaries directly in SQLite for the initial build. Store file references/paths instead.

---

## 12. AI Inference Rules

Models should be loaded once and reused rather than reloaded for every frame.

Keep configurable values such as:

- confidence threshold
- image size
- camera source
- model path
- classroom ID
- recording state

outside the core model code where practical.

Do not silently ignore model errors. Log them and expose a useful application status.

---

## 13. Dataset Context

### Object Dataset

```text
datasets/object_detection/
```

Planned structure:

```text
train/
val/
test/
data.yaml
```

Planned image counts:

```text
20,000 train
4,000 validation
4,000 test
```

The object model uses all 80 COCO classes.

### Behavior Datasets

Source folders:

```text
datasets/behavior_detection-fight/
datasets/behavior_detection-phone/
```

Merged target:

```text
datasets/behavior_detection/
```

Final behavior classes:

```text
0 Fighting
1 Sleeping
2 Using Phone
3 Reading
4 Writing
5 Hand Raising
6 Eating
```

Class remapping has to be explicit and deterministic.

---

## 14. File and Folder Rules

Use the existing project organization whenever possible:

```text
backend/
config/
datasets/
inference/
logs/
models/
recordings/
reports/
screenshots/
training/
```

Do not create unnecessary duplicate folders with alternate names.

Keep training-related code in `training/` and runtime inference in `inference/` unless a strong architectural reason requires otherwise.

---

## 15. Coding Style

### Python

- Use clear function names.
- Use type hints where useful.
- Prefer small, testable functions.
- Use `pathlib` for paths.
- Avoid hard-coded absolute Windows paths.
- Add comments for non-obvious logic.
- Handle errors explicitly.
- Log useful failures.

### TypeScript

- Use strict typing.
- Avoid `any` unless unavoidable.
- Keep API response types centralized.
- Use reusable UI components.
- Keep page components focused on composition rather than large business-logic blocks.

---

## 16. UX Design Rules

The Command Center should look like a real monitoring console.

Priorities:

- Live video first
- Alerts easy to notice
- Classroom identity always clear
- Offline cameras clearly indicated
- Important events visually distinguishable
- Information density should remain readable

Fighting alerts should be visually stronger than routine activity events.

---

## 17. AI-Assisted Development Rules

When generating code:

1. Respect the existing folder structure.
2. Do not replace working project files unnecessarily.
3. Explain important generated code when requested.
4. Prefer small incremental changes over a full rewrite.
5. Check existing data structures before inventing new ones.
6. Reuse existing model outputs instead of creating duplicate detection logic.
7. Keep UI, backend, and model responsibilities separated.
8. Do not add features outside the PRD without explicit approval.

---

## 18. Testing Rules

Every major component should have a simple test or verification step.

### AI

- Load model
- Run one image
- Run one video/frame sequence
- Run webcam/camera source

### Backend

- Health check
- Classroom retrieval
- Event creation
- Alert creation
- History retrieval
- WebSocket connection

### Frontend

- Live feed renders
- Classroom selector works
- Alert appears without refresh
- History loads
- Evidence opens
- Camera status changes are visible

---

## 19. Performance Principles

The goal is reliable real-time demonstration, not unnecessary infrastructure complexity.

- Reuse loaded models.
- Avoid duplicate frame processing.
- Avoid blocking the web server with long synchronous jobs where possible.
- Decouple recording/storage from the critical live-display path when practical.
- Do not send full-resolution frames through WebSocket when a lighter data channel is enough.

---

## 20. Security and Privacy Principles

- Keep evidence local by default during development.
- Validate file paths before writing files.
- Do not expose arbitrary filesystem paths through APIs.
- Sanitize user-controlled classroom IDs and filenames.
- Keep logs free of secrets.

---

## 21. Forbidden Changes Without Explicit Approval

Do not:

- Add a third AI model.
- Change the final seven behavior classes.
- Replace YOLO without approval.
- Add Object Search.
- Add Behavior Search.
- Change the default landing page away from Live Surveillance Feed.
- Remove multi-classroom support.
- Remove classroom IDs from alerts.
- Remove evidence capture from important events.

---

## 22. Build Philosophy

The application should be built end-to-end quickly with AI assistance. It is acceptable to use temporary mock data while model inference is being completed, provided that the final application clearly separates mock/test paths from real inference paths.

The final project must remain understandable to the project owner. Generated code should therefore favor clear architecture and readable implementations over clever abstractions.
