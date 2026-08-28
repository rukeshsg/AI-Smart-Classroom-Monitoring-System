# Product Requirements Document (PRD)

# AI-Based Smart Classroom Monitoring System

**Document:** PRD.md  
**Status:** Finalized Product Scope  
**Primary Goal:** Build a real-time AI-powered classroom monitoring platform that combines YOLO-based object detection and classroom behavior detection, exposes actionable events through a backend, and presents them through a multi-classroom Command Center.

---

## 1. Product Overview

The AI-Based Smart Classroom Monitoring System is a web-based monitoring platform designed to observe one or more classrooms or laboratories through live camera feeds. The system processes video in real time using two AI models:

1. **Object Detection Model** — detects objects and people using YOLO and produces bounding boxes, class names, and confidence scores.
2. **Behavior Detection Model** — detects selected classroom behaviors using a separate trained behavior model.

The outputs from both models are processed by a monitoring engine. The monitoring engine converts raw AI detections into meaningful classroom events, alerts, screenshots, timestamps, statistics, and historical records.

The final user-facing application is the **Command Center**, whose default page is the live surveillance feed.

---

## 2. Product Vision

Create a practical classroom monitoring platform in which an administrator can view multiple classrooms, understand what is happening in real time, receive high-priority alerts, review historical events, inspect captured evidence, and generate reports from a single Command Center.

The product should feel like a real monitoring application rather than a standalone machine-learning demo.

---

## 3. Core Objectives

### 3.1 AI Objectives

- Detect objects in classroom and general camera scenes in real time.
- Detect classroom-related student behaviors in real time.
- Produce usable confidence scores and bounding boxes for supported detections.
- Make model outputs available to the monitoring layer without requiring the frontend to understand model internals.

### 3.2 Monitoring Objectives

- Monitor multiple classrooms/labs.
- Associate every camera and event with a classroom identifier.
- Calculate current occupancy from person detections.
- Identify phone-usage events from object and behavior outputs.
- Detect fighting as a high-priority event.
- Capture evidence screenshots for important events.
- Maintain timestamped event records.
- Provide camera health/status information.

### 3.3 Dashboard Objectives

- Open directly to the **Live Surveillance Feed**.
- Allow an administrator to switch between classrooms.
- Support a multi-camera overview for multiple classrooms.
- Show active alerts prominently.
- Show classroom analytics, daily summaries, and session summaries.
- Provide event history, timeline, evidence gallery, and reports.
- Display classroom ID/name in every relevant event and alert.

---

## 4. Target Users

### 4.1 Primary User — Administrator / Faculty

Needs to:
- View live classroom feeds.
- Monitor several classrooms.
- Receive important alerts quickly.
- Check current occupancy.
- Review incidents and evidence.
- Understand classroom activity trends.
- Generate reports.

### 4.2 Secondary User — Project Demonstrator / Mentor

Needs to:
- See that the AI models work in real time.
- Verify object and behavior detections.
- Verify alert generation and classroom mapping.
- Review stored events and evidence.
- Understand the end-to-end architecture.

---

## 5. Supported Classroom / Lab Identification

The application must support identifiers similar to real college classroom and laboratory naming conventions.

Examples:

- `H305`
- `H003`
- `B202`
- `C104`
- `G202`
- `J301`
- `L204`

`L` may be used for laboratories. The system must treat these values as configurable identifiers rather than hard-coded assumptions about the building.

Every camera configuration and every generated event must retain its associated classroom/lab ID.

---

## 6. AI Model Requirements

## 6.1 Model 1 — Object Detection

The object detection model uses YOLO and is trained/fine-tuned using the COCO-based object-detection dataset prepared for this project.

The target model supports the full set of **80 COCO object classes**.

Object output must provide, at minimum:

- Class ID
- Class name
- Confidence score
- Bounding-box coordinates
- Frame timestamp

The object model is intended to be reusable as a standalone component and as the object-detection component of the Smart Classroom system.

## 6.2 Model 2 — Behavior Detection

The behavior model is trained using the project’s merged classroom behavior dataset.

Final behavior classes:

1. Fighting
2. Sleeping
3. Using Phone
4. Reading
5. Writing
6. Hand Raising
7. Eating

Behavior output must provide, at minimum:

- Behavior class
- Confidence score
- Bounding-box coordinates when available from the model
- Frame timestamp

---

## 7. Object-Detection Dataset

Planned dataset source: **COCO 2017**.

Current planned split:

| Split | Planned Image Count |
|---|---:|
| Train | 20,000 |
| Validation | 4,000 |
| Test | 4,000 |
| **Total** | **28,000** |

Project dataset location:

```text
 datasets/object_detection/
    train/
    val/
    test/
    data.yaml
```

The actual availability of files must be verified before training. The dataset preparation script is responsible for building the intended structure and preventing overlap between splits.

---

## 8. Behavior Dataset

Two classroom behavior datasets are being merged into one training dataset.

### Source dataset 1
`datasets/behavior_detection-fight/`

### Source dataset 2
`datasets/behavior_detection-phone/`

Merged target:

```text
datasets/behavior_detection/
├── train/
│   ├── images/
│   └── labels/
├── valid/
│   ├── images/
│   └── labels/
├── test/
│   ├── images/
│   └── labels/
└── data.yaml
```

The merge process must:

- Combine the source images and labels.
- Avoid filename collisions.
- Remap source class IDs into the final class map.
- Merge the duplicate `Sleeping` class into one class.
- Map `Hand Rising` to `Hand Raising`.
- Exclude `UOP`, `U`, and `Classroom-Students-Behavior` from the final model unless the project owner explicitly changes the class definition.

---

## 9. Monitoring Engine Requirements

The Monitoring Engine is responsible for converting AI outputs into application-level events.

### 9.1 Occupancy Counting

Count active `Person` detections for the selected classroom and show the current occupancy.

Required outputs:

- Current occupancy
- Peak occupancy for the session
- Timestamped occupancy observations where required for analytics

### 9.2 Phone Usage Detection

The monitoring engine must use object and behavior information to identify a phone-usage event.

A typical event may contain:

- Person detection
- Cell phone detection
- `Using Phone` behavior detection
- Confidence information
- Classroom ID
- Date/time

The event becomes a **Phone Usage Alert**.

### 9.3 Fighting Detection

When the behavior model detects `Fighting`, the monitoring engine must create a high-priority alert.

The alert must include:

- Event type
- Classroom/lab ID
- Detection time
- Confidence
- Evidence screenshot reference when captured

### 9.4 Other Behavior Events

The system must retain supported behavior observations such as:

- Sleeping
- Reading
- Writing
- Hand Raising
- Eating

These may be presented in analytics, history, and timelines.

### 9.5 Evidence Capture

Important incidents must trigger an automatic screenshot capture.

Evidence metadata should include:

- Classroom ID
- Event type
- Date
- Time
- Image path/reference

### 9.6 Event Logging

Events must be persisted with enough information for later review.

Minimum fields:

- Event ID
- Classroom ID
- Event type
- Date
- Time
- Confidence
- Screenshot/evidence path when available
- Relevant object/behavior information

---

## 10. Real-Time Notification Requirements

The system must provide visual notifications from the monitoring engine to the Command Center.

### 10.1 Phone Usage Notification

Use a desktop-style lower-right notification appearance inspired by common messaging/system notifications.

It should communicate:

- Phone usage detected
- Classroom/lab ID
- Time

### 10.2 Fighting Notification

Fighting is a higher-priority incident and must use a prominent red notification/popup.

It should clearly show:

> FIGHTING DETECTED
> Classroom: H305
> Time: 10:42:18 AM

The design must make the event distinguishable from normal notifications.

---

## 11. Command Center Requirements

The web dashboard is called **Command Center**.

### 11.1 Default Landing Screen — Live Surveillance Feed

This is the first screen shown after opening the application.

It must prioritize live surveillance over statistics.

The default screen should contain:

- Live camera feed
- Current classroom/lab ID
- AI overlays
- Current occupancy
- Active/high-priority alerts
- Camera status
- Recording state where applicable

### 11.2 Multi-Classroom Support

Users must be able to:

- Select a classroom/lab from a configured list.
- Open a selected classroom in full live view.
- View multiple classrooms in a multi-camera overview.
- See online/offline status for each camera.

Example IDs:

```text
H305
H003
B202
G104
J301
L204
```

### 11.3 Active Alerts

Show unresolved or recent alerts prominently.

Each alert must include:

- Alert type
- Classroom ID/name
- Date/time
- Confidence where applicable
- Severity
- Evidence reference where available

### 11.4 Classroom Analytics

For the selected classroom, provide:

- Total/current students
- Phone usage events
- Fighting events
- Sleeping events
- Reading events
- Writing events
- Hand-raising events
- Eating events

### 11.5 Daily Summary

Provide a summary for the selected classroom/date.

Example:

```text
Today's Summary — H305

Occupancy: 32
Phone Alerts: 7
Fighting Alerts: 1
Sleeping Events: 4
```

### 11.6 Session Summary

At the end of a monitoring session, provide:

- Session duration
- Peak occupancy
- Total events
- Critical alerts
- Number of screenshots/evidence items

### 11.7 Event Timeline

Show chronological events with classroom association.

Example:

```text
10:21 — H305 — Phone Usage
10:25 — H305 — Sleeping
10:31 — H305 — Hand Raising
10:42 — H305 — Fighting
```

### 11.8 Evidence Gallery

Provide captured incident screenshots grouped by event/classroom/time.

### 11.9 Detection History

Provide historical event records with timestamp and classroom information.

### 11.10 Date Filter

Allow users to restrict displayed history and analytics to a selected date or date range.

### 11.11 Detection Filters

Allow users to filter the displayed events/detections by supported object or behavior categories.

### 11.12 Camera Status

Display the status of configured cameras/classrooms.

Example:

```text
H305  ● Online
H003  ● Online
L204  ● Online
G202  ● Offline
```

### 11.13 Session Recording

Allow the user to start and stop recording for the active monitoring session.

### 11.14 Reports

Generate PDF reports containing relevant monitoring information, including:

- Classroom/lab ID
- Monitoring date
- Session duration
- Occupancy statistics
- Behavior statistics
- Alerts
- Event timeline
- Evidence references/screenshots where appropriate

---

## 12. Explicitly Excluded Dashboard Features

The following are intentionally **not** part of the finalized scope:

- Object Search
- Behavior Search

No implementation should add these features unless the project owner explicitly requests them.

---

## 13. User Experience Requirements

- The live feed must load as the primary experience.
- Important alerts must be visually obvious.
- Classroom IDs must be visible wherever the context could otherwise be ambiguous.
- Navigation must remain simple enough for a faculty/admin user.
- The interface should resemble a professional monitoring console rather than a generic analytics dashboard.
- The application must remain usable even when one classroom camera is offline.
- AI model errors or unavailable cameras must be surfaced as clear system states instead of causing the interface to silently fail.

---

## 14. Data and Persistence Requirements

At minimum, the system must persist:

- Classroom/camera configuration
- Event records
- Detection/behavior metadata needed for analytics
- Alert records
- Evidence screenshot references
- Session information
- Recording references when applicable

The initial implementation may use a local database suitable for development and demonstration.

---

## 15. Non-Functional Requirements

### Performance

- Live inference should be responsive enough for a real-time demonstration.
- The dashboard must receive alert/state changes without requiring manual page refreshes.

### Reliability

- Failure of one camera must not crash the entire Command Center.
- Failure of one model inference cycle should be handled gracefully.
- Events should not be silently discarded when persistence is available.

### Maintainability

- AI inference, monitoring logic, APIs, and UI should remain separated into understandable modules.
- Configuration such as classroom IDs should not be scattered through the codebase.
- Paths to datasets, models, screenshots, recordings, and logs should be configurable.

### Security / Privacy

- The system should keep captured classroom evidence local during development unless explicit external storage is configured.
- Access control can remain minimal for the internship/demo version.

---

## 16. Project Directory Context

The current project workspace follows this general structure:

```text
Smart-Classroom-Monitoring/
├── backend/
├── config/
├── datasets/
│   ├── behavior_detection-fight/
│   ├── behavior_detection-phone/
│   └── object_detection/
├── inference/
├── logs/
├── models/
├── recordings/
├── reports/
├── screenshots/
├── training/
├── venv/
├── merge_behavior_datasets.py
├── download_coco_yolov8.py
└── README.md
```

The final web application may introduce additional frontend-specific folders as implementation begins.

---

## 17. Success Criteria

The product is considered functionally successful when all of the following can be demonstrated:

1. A live camera feed is displayed in the Command Center.
2. Model 1 produces real-time object detections.
3. Model 2 produces the finalized behavior detections.
4. The system maps detections to a selected classroom/lab ID.
5. Occupancy is calculated from person detections.
6. Phone usage creates a visible alert.
7. Fighting creates a prominent red alert.
8. Important events create evidence screenshots.
9. Events are stored and shown in detection history/timeline.
10. Multiple classrooms can be configured and selected.
11. Classroom analytics and daily/session summaries are visible.
12. Camera status is visible.
13. A monitoring session can be recorded.
14. A PDF report can be generated.

---

## 18. Development Principle

The project should be built **end-to-end as early as possible** rather than waiting for every machine-learning phase to be perfected before integrating the application.

AI-assisted development may be used extensively for boilerplate and UI implementation. The project owner must still understand the core model-training, inference, monitoring, and integration code well enough to explain it during a review or viva.

---

## 19. Out of Scope for the Initial Final Build

Unless explicitly requested later, do not introduce additional AI models, new dashboard modules, or new monitoring features beyond this PRD.

The current scope is intentionally fixed around:

**2 AI models → real-time monitoring → classroom-aware events → alerts → evidence → history → Command Center → reports.**
