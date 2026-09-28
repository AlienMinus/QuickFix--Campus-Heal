# 🔄 Data Flow & Interaction Architecture (DFD)
## Smart Campus QuickFix — Data Flow Diagrams, Sequences & API Contracts
**Event:** BPUT Tech Carnival 2026 • **Venue:** GIFT Autonomous, Bhubaneswar  
**Date:** September 2026 • **Version:** 1.0.0 • **Document Status:** Final Production Specification

---

## 1. System Data Flow Architecture (DFD Level 1)

The following diagram illustrates how data flows between users (Students, Staff, Administrators), application processes, and persistent data stores.

```mermaid
flowchart TD
    %% External Entities
    Student(["🎓 Student / Reporter"])
    Staff(["🛠️ Maintenance Staff"])
    Admin(["🛡️ Campus Administrator"])
    Cloudinary[("☁️ Cloudinary Media CDN")]
    GoogleAuth["🔑 Google OAuth 2.0 Provider"]

    %% Processes
    P1["1.0 Auth & Session Engine
    (JWT 7-Day Signing)"]
    P2["2.0 Multi-Modal Issue Filing
    (Photo, QR, Voice, GPS)"]
    P3["3.0 Duplicate & Priority Engine
    (Haversine Distance + Scoring)"]
    P4["4.0 1-Sec Telemetry Streamer
    (Continuous GPS Logging)"]
    P5["5.0 Dispatch & Work Orders
    (Task Assignment & SLA)"]
    P6["6.0 Proof of Resolution
    (Before/After Verification)"]
    P7["7.0 Executive Analytics & CSV
    (Aggregation & Reporting)"]

    %% Data Stores
    D1[("D1: Users & Institutes")]
    D2[("D2: Issues & Audit History")]
    D3[("D3: LocationLogs (TTL 7d)")]
    D4[("D4: Notifications Queue")]

    %% Flows for P1: Authentication
    Student & Staff & Admin -->|Credentials / 1-Click Fast Login| P1
    P1 <-->|Verify Google Token| GoogleAuth
    P1 <-->|Validate & Query User| D1
    P1 -->|Issue 7d JWT Token| Student & Staff & Admin

    %% Flows for P2: Reporting
    Student -->|Snap Evidence Photo| Cloudinary
    Cloudinary -->|Secure HTTPS URL| P2
    Student -->|Submit Title, QR Tag, Voice Text, GPS| P2
    P2 <-->|Check Proximity & Room| P3
    P3 <-->|Query Open Issues| D2
    P3 -->|Write New Ticket Record| D2
    P2 -->|Publish Alert Notification| D4
    D4 -.->|Real-time Alert| Staff

    %% Flows for P4: 1-Sec Telematics
    Staff & Student -->|1000ms Coordinates, Speed, Accuracy| P4
    P4 -->|Detect Zone & Log Entry| D3
    D3 -.->|Live Feeds to Campus Map| Admin & Student

    %% Flows for P5: Dispatching
    Admin -->|Assign Ticket to Technician| P5
    P5 -->|Update Assigned Staff & Status| D2
    P5 -->|Send Assignment Notification| D4
    D4 -.->|Push Alert| Staff

    %% Flows for P6: Resolution Proof
    Staff -->|Upload Completion Photo| Cloudinary
    Cloudinary -->|Proof URL| P6
    Staff -->|Submit Resolution Remarks| P6
    P6 -->|Update Status: Resolved + Timestamp| D2
    P6 -->|Send Status Resolved Notification| D4
    D4 -.->|Push Notification| Student

    %% Flows for P7: Admin Analytics
    Admin -->|Request Executive KPIs & CSV Download| P7
    P7 <-->|Aggregate Pipelines| D2 & D3 & D1
    P7 -->|Generate CSV File Stream & KPIs| Admin
```

---

## 2. Key Interaction Sequence Diagrams

### 2.1 Flow 1: 1-Click Fast Evaluator Login Sequence
Enables frictionless access for competition jury members without requiring manual input.

```mermaid
sequenceDiagram
    autonumber
    actor Evaluator as ⚖️ Jury / Evaluator
    participant UI as 📱 Client (LoginPage.jsx)
    participant AuthContext as 🧠 AuthContext.jsx
    participant Server as 🖥️ Express API (/api/auth)
    participant DB as 🗄️ MongoDB Atlas (users)

    Evaluator->>UI: Clicks "1-Click Student" / "1-Click Staff" / "1-Click Admin"
    UI->>Server: POST /api/auth/demo-login { role: "staff" }
    Server->>DB: findOne({ email: "maintenance.staff@gift.ac.in" })
    alt User exists
        DB-->>Server: Return User Profile
    else User does not exist
        Server->>DB: create({ name: "Bikash Mohapatra", role: "staff", ... })
        DB-->>Server: Return New User Record
    end
    Server->>Server: Sign HMAC-SHA256 JWT (expiresIn: "7d")
    Server-->>UI: HTTP 200 { success: true, token, user }
    UI->>AuthContext: saveAuthSession(token, user)
    AuthContext->>AuthContext: localStorage.setItem("quickfix_token", token)
    UI-->>Evaluator: Redirects to /staff (Staff Work Order Portal)
```

---

### 2.2 Flow 2: Multi-Modal Issue Reporting Sequence
Demonstrates how photo uploads, QR room tags, voice dictation, and GPS coordinates are orchestrated during ticket creation.

```mermaid
sequenceDiagram
    autonumber
    actor Student as 🎓 Student Reporter
    participant UI as 📱 ReportIssuePage.jsx
    participant QR as 📷 QRScannerModal (jsQR)
    participant Voice as 🎙️ VoiceReportModal (Web Speech API)
    participant Cloudinary as ☁️ Cloudinary CDN
    participant API as 🖥️ IssueController.js
    participant DB as 🗄️ MongoDB Atlas (issues)
    participant Notif as 🗄️ MongoDB Atlas (notifications)

    Student->>UI: Opens Report Issue Page
    UI->>UI: Auto-reads device GPS (lat: 20.2195, lng: 85.7360)
    
    opt Scan Door / Room QR Sticker
        Student->>QR: Scans campus QR sticker
        QR-->>UI: Autofills { building: "Kalam Tech Block", room: "Lab 4", zone: "Engineering Labs" }
    end

    opt Hands-Free Voice Dictation
        Student->>Voice: Speaks defect ("Ceiling fan in Lab 4 making loud sparks")
        Voice-->>UI: Autofills title, description, category ("Electrical"), severity ("Critical")
    end

    Student->>UI: Snaps photo evidence with mobile camera
    Student->>UI: Clicks "Submit Ticket"
    
    UI->>API: POST /api/issues (multipart/form-data: title, desc, category, lat, lng, image)
    API->>Cloudinary: upload_stream(file.buffer)
    Cloudinary-->>API: Returns secure HTTPS image URL
    
    API->>API: Execute pre-save hook (Calculate priorityScore = 90)
    API->>DB: create(new Issue({ ...fields, media: { url }, priorityScore: 90 }))
    DB-->>API: Saved Issue Document
    
    API->>Notif: create({ title: "New Critical Issue", targetRole: "staff", issueId })
    API-->>UI: HTTP 201 { success: true, issue }
    UI-->>Student: Renders success checkmark & redirects to /issues/:id
```

---

### 2.3 Flow 3: Real-Time Spatial Duplicate Detection & In-Form Advisory
Prevents redundant tickets by checking geographical proximity and room identifiers while the user is typing.

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Campus User
    participant Form as 📱 ReportIssuePage.jsx (Debounce 700ms)
    participant Controller as 🖥️ IssueController.js (checkDuplicates)
    participant DB as 🗄️ MongoDB Atlas (issues)

    User->>Form: Enters Location: "Computer Lab 3" & Category: "Electrical"
    Form->>Controller: GET /api/issues/check-duplicate?lat=20.2195&lng=85.7360&category=Electrical&room=Computer Lab 3
    Controller->>DB: find({ category: "Electrical", status: { $ne: "Resolved" } })
    DB-->>Controller: Returns active electrical issues
    
    loop For each open issue
        Controller->>Controller: Calculate Haversine distance d
        alt d <= 50m OR room matches exactly
            Controller->>Controller: Flag as "High Confidence Duplicate"
        else d <= 120m AND building matches
            Controller->>Controller: Flag as "Medium Confidence Duplicate"
        end
    end

    Controller-->>Form: HTTP 200 { duplicatesFound: true, matches: [ { title, distance, upvotes, media } ] }
    Form-->>User: Displays Amber Duplicate Advisory Banner: "Matching ticket already open 12m away. Upvote instead?"
```

---

### 2.4 Flow 4: High-Frequency 1-Second GPS Telematics Stream
Maintains live campus telemetry for staff tracking, zone geofencing, and the radar map.

```mermaid
sequenceDiagram
    autonumber
    actor Staff as 🛠️ On-Duty Field Technician
    participant Browser as 🌐 Client Browser (navigator.geolocation)
    participant Service as 📡 locationLogger.js (1000ms Timer)
    participant API as 🖥️ LocationController.js (logLocation)
    participant DB as 🗄️ MongoDB Atlas (locationlogs)
    participant MapUI as 🗺️ LiveMap.jsx (Campus Radar)

    Staff->>Service: startLogging(user)
    Service->>Browser: watchPosition({ enableHighAccuracy: true })
    
    loop Every 1,000 Milliseconds (1 Second)
        Browser-->>Service: Position (lat, lng, accuracy, speed, heading)
        Service->>API: POST /api/location/log { lat, lng, speed, heading, role: "staff" }
        API->>API: detectCampusZone(lat, lng) -> "Aryabhatta Academic Block"
        API->>DB: create(new LocationLog({ userId, lat, lng, campusZone, loggedAt }))
        API-->>Service: HTTP 201 { success: true, zone: "Aryabhatta Academic Block" }
        Service->>Service: notify(listeners)
    end

    Note over MapUI,DB: When Admin or Student views the Live Campus Map:
    MapUI->>API: GET /api/location/active-staff
    API->>DB: aggregate(match loggedAt >= (now - 15min))
    DB-->>API: Returns distinct active technician coordinates
    API-->>MapUI: HTTP 200 { activeStaff: [ { name, lat, lng, lastZone } ] }
    MapUI-->>Staff: Renders active technician pins and animated radar pulse
```

---

### 2.5 Flow 5: Field Staff Work Order Execution & Photo Proof Verification
Guarantees transparent accountability through verifiable completion proof.

```mermaid
sequenceDiagram
    autonumber
    actor Tech as 🛠️ Maintenance Technician
    participant StaffUI as 📱 StaffDashboardPage.jsx
    participant DetailUI as 📱 IssueDetailPage.jsx
    participant Cloudinary as ☁️ Cloudinary CDN
    participant API as 🖥️ IssueController.js (updateIssueStatus)
    participant DB as 🗄️ MongoDB Atlas (issues)
    actor Student as 🎓 Original Reporter

    Tech->>StaffUI: Views Assigned Work Orders
    Tech->>StaffUI: Clicks "Start Work"
    StaffUI->>API: PUT /api/issues/:id/status { status: "In Progress" }
    API->>DB: Push to statusHistory & update status
    API-->>StaffUI: HTTP 200 (Status: In Progress)

    Tech->>Tech: Repairs defective infrastructure on campus
    Tech->>StaffUI: Clicks "Mark Resolved", attaches completion photo
    StaffUI->>API: PUT /api/issues/:id/status (multipart: status="Resolved", resolutionMedia, notes)
    API->>Cloudinary: upload_stream(proofImage)
    Cloudinary-->>API: Returns proof image URL
    API->>DB: update Issue { status: "Resolved", resolutionDetails: { resolvedAt, proofUrl, notes } }
    DB-->>API: Issue Updated
    API-->>StaffUI: HTTP 200 (Success)

    Note over DetailUI,Student: Reporter opens ticket detail page:
    Student->>DetailUI: Views /issues/:id
    DetailUI-->>Student: Displays SLA Timeline (Resolved) and side-by-side Before/After Photo Gallery
```

---

## 3. RESTful API Data Contracts

### 3.1 Authentication Endpoints (`/api/auth`)

#### `POST /api/auth/register`
* **Request Payload:**
  ```json
  {
    "name": "Rohan Sharma",
    "email": "rohan.sharma@gift.edu.in",
    "password": "securePassword123",
    "role": "student",
    "department": "Computer Science & Engineering",
    "identifier": "GIFT-2022-CSE-042",
    "phone": "+91 9876543210",
    "institute": "Gandhi Institute For Technology (GIFT Autonomous)"
  }
  ```
* **Response Payload (HTTP 201):**
  ```json
  {
    "success": true,
    "message": "User registered successfully with 7-day active session",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "66f7f1a1e0b123456789abcd",
      "name": "Rohan Sharma",
      "email": "rohan.sharma@gift.edu.in",
      "role": "student",
      "institute": "Gandhi Institute For Technology (GIFT Autonomous)",
      "department": "Computer Science & Engineering",
      "identifier": "GIFT-2022-CSE-042",
      "avatar": "https://images.unsplash.com/photo-..."
    }
  }
  ```

#### `POST /api/auth/demo-login`
* **Request Payload:**
  ```json
  {
    "role": "staff"
  }
  ```
* **Response Payload (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Logged in as demo staff with 7-day token",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "66f7f1a1e0b987654321fedc",
      "name": "Bikash Mohapatra (Staff)",
      "email": "maintenance.staff@gift.ac.in",
      "role": "staff",
      "institute": "BPUT Tech Campus",
      "department": "Campus Electrical & Facilities Maintenance"
    }
  }
  ```

---

### 3.2 Issues & Work Orders Endpoints (`/api/issues`)

#### `POST /api/issues`
* **Content-Type:** `multipart/form-data`
* **Form Fields:**
  * `title`: "Broken ceiling fan making grinding noise"
  * `description`: "Ceiling fan regulator does not switch off and blade is wobbling dangerously."
  * `category`: "Electrical & Lighting"
  * `severity`: "High"
  * `building`: "Aryabhatta Academic Block"
  * `room`: "Room 302"
  * `landmark`: "Near East Staircase"
  * `latitude`: 20.2195
  * `longitude`: 85.7360
  * `qrCodeTag`: "GIFT-ARYA-R302"
  * `image`: `[Binary Image File]`
* **Response Payload (HTTP 201):**
  ```json
  {
    "success": true,
    "message": "Campus issue recorded successfully",
    "issue": {
      "_id": "66f7f2b2e0b555555555aaaa",
      "title": "Broken ceiling fan making grinding noise",
      "description": "Ceiling fan regulator does not switch off...",
      "category": "Electrical & Lighting",
      "severity": "High",
      "priorityScore": 70,
      "status": "Submitted",
      "location": {
        "building": "Aryabhatta Academic Block",
        "room": "Room 302",
        "landmark": "Near East Staircase",
        "latitude": 20.2195,
        "longitude": 85.7360,
        "qrCodeTag": "GIFT-ARYA-R302"
      },
      "media": {
        "url": "https://res.cloudinary.com/.../fan_evidence.jpg",
        "provider": "cloudinary"
      },
      "upvotesCount": 0,
      "isDuplicate": false,
      "statusHistory": [
        {
          "status": "Submitted",
          "changedAt": "2026-09-28T09:15:00.000Z",
          "changedBy": "Rohan Sharma",
          "remarks": "Issue reported to campus administration"
        }
      ],
      "createdAt": "2026-09-28T09:15:00.000Z"
    },
    "potentialDuplicate": null
  }
  ```

#### `GET /api/issues/check-duplicate`
* **Query Parameters:** `latitude=20.2195&longitude=85.7360&category=Electrical & Lighting&room=Room 302`
* **Response Payload (HTTP 200):**
  ```json
  {
    "success": true,
    "duplicatesFound": true,
    "matches": [
      {
        "_id": "66f7e8a9e0b111111111bbbb",
        "title": "Ceiling fan regulator damaged",
        "description": "Fan speed cannot be controlled in room 302",
        "status": "Submitted",
        "severity": "Medium",
        "distanceMeters": 4,
        "upvotesCount": 3,
        "matchConfidence": "High",
        "media": {
          "url": "https://res.cloudinary.com/.../fan.jpg"
        }
      }
    ]
  }
  ```

#### `PUT /api/issues/:id/status`
* **Content-Type:** `multipart/form-data`
* **Form Fields:**
  * `status`: "Resolved"
  * `resolutionNotes`: "Replaced faulty capacitor and balanced the blade spindle."
  * `resolutionMedia`: `[Binary Completion Photo File]`
* **Response Payload (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Status updated to Resolved",
    "issue": {
      "_id": "66f7f2b2e0b555555555aaaa",
      "status": "Resolved",
      "resolutionDetails": {
        "resolvedAt": "2026-09-28T10:45:00.000Z",
        "resolvedByName": "Bikash Mohapatra",
        "resolutionNotes": "Replaced faulty capacitor and balanced the blade spindle.",
        "resolutionMediaUrl": "https://res.cloudinary.com/.../fan_repaired.jpg"
      },
      "statusHistory": [
        { "status": "Submitted", "changedAt": "..." },
        { "status": "In Progress", "changedAt": "..." },
        { "status": "Resolved", "changedAt": "2026-09-28T10:45:00.000Z", "changedBy": "Bikash Mohapatra" }
      ]
    }
  }
  ```

---

### 3.3 High-Frequency 1-Sec Telematics Endpoints (`/api/location`)

#### `POST /api/location/log`
* **Request Payload (Transmitted every 1,000ms):**
  ```json
  {
    "latitude": 20.21952,
    "longitude": 85.73604,
    "accuracy": 4,
    "speed": 1.4,
    "heading": 85,
    "altitude": 48,
    "batteryLevel": 88,
    "customUserName": "Bikash Mohapatra",
    "customRole": "staff"
  }
  ```
* **Response Payload (HTTP 201):**
  ```json
  {
    "success": true,
    "loggedAt": "2026-09-28T09:20:01.450Z",
    "zone": "Main Academic Block (MAB)",
    "logId": "66f7f333e0b777777777cccc"
  }
  ```

#### `GET /api/location/active-staff`
* **Response Payload (HTTP 200):**
  ```json
  {
    "success": true,
    "count": 2,
    "activeStaff": [
      {
        "id": "66f7f1a1e0b987654321fedc",
        "name": "Bikash Mohapatra (Staff)",
        "role": "staff",
        "lastZone": "Main Academic Block (MAB)",
        "lat": 20.21952,
        "lng": 85.73604,
        "lastPing": "2026-09-28T09:20:01.450Z"
      }
    ]
  }
  ```

---

### 3.4 Administrative Command Center Endpoints (`/api/admin`)

#### `GET /api/admin/stats`
* **Response Payload (HTTP 200):**
  ```json
  {
    "success": true,
    "stats": {
      "totalIssues": 42,
      "submittedCount": 11,
      "inProgressCount": 8,
      "resolvedCount": 23,
      "criticalCount": 3,
      "resolutionRate": 55,
      "avgResolutionHours": 2.4,
      "activeStaffCount": 4,
      "categoryStats": [
        { "_id": "Electrical & Lighting", "count": 14 },
        { "_id": "Water Leakage & Plumbing", "count": 10 },
        { "_id": "Cleanliness & Sanitation", "count": 8 }
      ],
      "buildingStats": [
        { "_id": "Aryabhatta Academic Block", "count": 16 },
        { "_id": "Central Library", "count": 9 },
        { "_id": "Kalam Tech Block", "count": 8 }
      ]
    }
  }
  ```

---

*End of Data Flow & Interaction Architecture Document.*
