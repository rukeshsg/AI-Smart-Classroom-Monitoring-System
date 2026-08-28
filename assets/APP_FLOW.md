# Application Flow

# AI-Based Smart Classroom Monitoring System

## 1. High-Level Flow

```text
User Opens Command Center
          │
          ▼
Live Surveillance Feed
          │
          ▼
Select Classroom / Multi-Camera View
          │
          ▼
Live Video Stream
          │
          ├───────────────┐
          ▼               ▼
   Object Model     Behavior Model
          │               │
          └───────┬───────┘
                  ▼
          Monitoring Engine
                  │
       ┌──────────┼───────────┐
       ▼          ▼           ▼
   Detection    Event        Alert
    State      Logging      Handling
       │          │           │
       └──────────┼───────────┘
                  ▼
            Command Center
```

---

# 2. Navigation Structure

```text
Command Center
│
├── Live Surveillance Feed        ← DEFAULT
│
├── Active Alerts
│
├── Event Timeline
│
├── Detection Analytics
│
├── Detection History
│
├── Evidence Gallery
│
├── Daily Summary
│
├── Session Summary
│
├── Reports
│
└── Camera Status / Classroom View
```

Object Search and Behavior Search are intentionally excluded.

---

# 3. Default Page Flow — Live Surveillance Feed

```text
Open Application
      │
      ▼
Command Center
      │
      ▼
Live Surveillance Feed
      │
      ├── Current Classroom ID
      ├── Live Video
      ├── AI Bounding Boxes
      ├── Behavior Labels
      ├── Occupancy
      ├── Active Alerts
      ├── Camera Status
      └── Recording Status
```

The user should not have to navigate through analytics before seeing the live camera.

---

# 4. Classroom Selection Flow

## Single Classroom

```text
Command Center
      │
      ▼
Classroom Selector
      │
      ├── H305
      ├── H003
      ├── B202
      ├── G104
      ├── J301
      └── L204
      │
      ▼
Select H305
      │
      ▼
H305 Live Feed
```

## Multi-Classroom View

```text
Command Center
      │
      ▼
Multi-Camera View
      │
      ├── H305 — Online
      ├── H003 — Online
      ├── L204 — Online
      └── G202 — Offline
```

Selecting a camera opens its detailed live view.

---

# 5. Real-Time AI Flow

Each incoming frame follows this logical path:

```text
Camera Frame
     │
     ├───────────────┐
     ▼               ▼
Object Model    Behavior Model
     │               │
     ▼               ▼
Objects         Behaviors
     │               │
     └───────┬───────┘
             ▼
       Monitoring Engine
```

### Example object output

```text
Person — 0.98
Cell Phone — 0.91
Laptop — 0.96
```

### Example behavior output

```text
Using Phone — 0.93
```

---

# 6. Phone Usage Event Flow

```text
Person Detected
      │
      ▼
Cell Phone Detected
      │
      ▼
Behavior Model → Using Phone
      │
      ▼
Monitoring Engine
      │
      ├── Create Event
      ├── Capture Evidence
      ├── Store Timestamp
      └── Generate Notification
               │
               ▼
       Lower-Right Notification
               │
               ▼
        Event History / Timeline
```

Notification example:

```text
┌──────────────────────────────┐
│ 📱 PHONE USAGE DETECTED      │
│ Classroom: H305              │
│ 10:42:18 AM                  │
└──────────────────────────────┘
```

---

# 7. Fighting Event Flow

```text
Video Frame
    │
    ▼
Behavior Model
    │
    ▼
Fighting Detected
    │
    ▼
Monitoring Engine
    │
    ├── High-Priority Event
    ├── Screenshot Capture
    ├── Event Logging
    └── Red Alert
            │
            ▼
     Command Center Alert
```

Notification example:

```text
┌──────────────────────────────┐
│ 🚨 FIGHTING DETECTED         │
│ Classroom: H305              │
│ Immediate Attention Required │
│ 10:42:18 AM                  │
└──────────────────────────────┘
```

---

# 8. Occupancy Flow

```text
Live Frame
    │
    ▼
Object Model
    │
    ▼
Person Detections
    │
    ▼
Count People
    │
    ▼
Current Occupancy
    │
    ├── Live Feed Card
    ├── Classroom Analytics
    └── Session Statistics
```

Example:

```text
Current Occupancy: 24
Peak Occupancy: 31
```

---

# 9. Evidence Capture Flow

```text
Important Event
      │
      ▼
Capture Current Frame
      │
      ▼
Save Screenshot
      │
      ▼
Create Evidence Record
      │
      ├── Classroom ID
      ├── Event Type
      ├── Date
      ├── Time
      └── File Reference
      │
      ▼
Evidence Gallery
      │
      ▼
Event History / Report
```

---

# 10. Active Alerts Flow

```text
Event Created
     │
     ▼
Alert Generated
     │
     ▼
Active Alerts Panel
     │
     ├── Severity
     ├── Event
     ├── Classroom
     ├── Time
     └── Confidence
     │
     ▼
User Reviews Alert
```

---

# 11. Event Timeline Flow

All significant events are inserted chronologically.

```text
10:21 — H305 — Phone Usage
10:25 — H305 — Sleeping
10:31 — H305 — Hand Raising
10:42 — H305 — Fighting
```

Selecting an event should open its available details and evidence.

---

# 12. Detection History Flow

```text
History Page
    │
    ▼
Select Date / Date Range
    │
    ▼
Apply Detection Filter
    │
    ▼
Display Events
    │
    ├── Classroom
    ├── Event
    ├── Date
    ├── Time
    ├── Confidence
    └── Evidence
```

---

# 13. Analytics Flow

```text
Stored Events
     │
     ▼
Analytics Processor
     │
     ├── Occupancy
     ├── Phone Usage
     ├── Fighting
     ├── Sleeping
     ├── Reading
     ├── Writing
     ├── Hand Raising
     └── Eating
     │
     ▼
Analytics Dashboard
```

---

# 14. Daily Summary Flow

```text
Select Classroom + Date
          │
          ▼
Aggregate Events
          │
          ▼
Daily Summary
```

Example:

```text
Today's Summary — H305

Occupancy: 32
Phone Alerts: 7
Fighting Alerts: 1
Sleeping Events: 4
```

---

# 15. Session Flow

```text
Start Monitoring Session
          │
          ▼
Live Monitoring
          │
          ├── Events
          ├── Alerts
          ├── Occupancy
          └── Evidence
          │
          ▼
Stop Session
          │
          ▼
Session Summary
```

Session summary contains:

- Session duration
- Peak occupancy
- Total events
- Critical alerts
- Evidence count

---

# 16. Recording Flow

```text
Live Feed
   │
   ▼
Start Recording
   │
   ▼
Record Monitoring Session
   │
   ▼
Stop Recording
   │
   ▼
Save Recording Reference
```

---

# 17. Camera Status Flow

```text
Camera Manager
     │
     ▼
Health Check
     │
     ├── Online
     ├── Offline
     └── Error
     │
     ▼
Command Center
```

A failed classroom camera should affect that classroom rather than crash the entire dashboard.

---

# 18. Report Flow

```text
User Selects Classroom / Session / Date
                  │
                  ▼
           Collect Records
                  │
                  ▼
            Build Report
                  │
                  ▼
              PDF Output
```

Report may include:

- Classroom ID
- Date
- Session duration
- Occupancy statistics
- Behavior statistics
- Alerts
- Timeline
- Evidence/screenshots

---

# 19. System Error Flow

```text
Model / Camera / Backend Error
             │
             ▼
        Error Handler
             │
             ├── Log error
             ├── Preserve application state
             └── Show readable status
```

The UI must never silently appear frozen when an underlying component is unavailable.
