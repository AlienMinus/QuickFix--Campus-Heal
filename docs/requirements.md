# 📋 System Requirements Specification (SRS)
## Smart Campus QuickFix — Real-Time Civic Maintenance & Campus Telematics Platform
**Event:** BPUT Tech Carnival 2026 • **Venue:** GIFT Autonomous, Bhubaneswar  
**Date:** September 2026 • **Version:** 1.0.0 • **Document Status:** Final Production Specification

---

## 1. Executive Summary & Problem Context

### 1.1 Context & Background
Modern educational campuses, such as the Gandhi Institute For Technology (GIFT Autonomous, Bhubaneswar) under Biju Patnaik University of Technology (BPUT), house thousands of students, faculty, and administrative staff across sprawling multi-acre facilities. In these environments, daily civic infrastructure failures—such as damaged desks, broken ceiling fans, leaking washroom plumbing, flickering classroom lighting, faulty projectors, and Wi-Fi network dead zones—are commonplace.

Traditionally, universities handle maintenance through manual paper logbooks, verbal complaints to hostel wardens, or informal messaging groups. This traditional model suffers from severe operational shortcomings:
1. **Lack of Transparency:** Students have zero visibility into whether their complaint was reviewed, who was assigned, or when it will be fixed.
2. **Redundant & Duplicate Reports:** A single broken tap or water cooler in a central foyer often results in dozens of students filing repetitive complaints, overwhelming maintenance staff.
3. **No Prioritization Mechanism:** Urgent electrical or safety hazards are queued alongside minor cosmetic issues on a first-come, first-served basis.
4. **Accountability Deficit:** Maintenance crews lack verified before/after proof of resolution, leading to premature ticket closures or recurring failures.
5. **No Real-Time Spatial Visibility:** Administrators cannot track where maintenance personnel are stationed across campus, causing dispatch delays.

### 1.2 The Solution: Smart Campus QuickFix
**Smart Campus QuickFix** is a mobile-first, transparent civic maintenance and facility management application tailored for college campuses. It bridges the gap between campus residents, maintenance technicians, and estate administrators through:
- **Multi-Modal Fast Reporting:** Allows issue filing via camera photo capture, QR code room scanning, AI voice dictation, and automatic 1-second GPS geocoding.
- **Intelligent Spatial Duplicate Detection:** Warns users when an issue has already been reported within a 50-meter radius or within the same room.
- **Algorithmic Priority Engine:** Ranks issues dynamically based on severity weights, community upvotes, and emergency multipliers.
- **Continuous 1-Second GPS Telematics Stream:** Streams live technician patrol coordinates to MongoDB Atlas, visualized on a campus radar map.
- **Complete SLA Verification:** Provides side-by-side before/after photo evidence and timestamped audit logs for every repair.
- **Multi-Tenant Campus Architecture:** Supports multi-institute isolation with administrative oversight for higher education boards.

---

## 2. Evaluation Matrix Alignment (100 Marks Breakdown)

This specification directly fulfills the official evaluation parameters of the **BPUT Tech Carnival 2026 Mobile Application Development Contest**:

| Dimension | Marks | System Implementation |
|---|:---:|---|
| **1. Problem Understanding & Relevance** | **15** | Accurately targets common campus maintenance bottlenecks across academic blocks, labs, and hostels at GIFT Autonomous Bhubaneswar. |
| **2. Functionality & Features** | **25** | Complete ticket lifecycle: submission, duplicate filtering, smart scoring, technician dispatch, live radar mapping, before/after proof, and role-based portals. |
| **3. UI/UX & Usability** | **20** | Modern dark-mode aesthetic, bottom mobile navigation, toggleable smartphone chassis for presentations, high-contrast badges, and fast 1-click evaluator logins. |
| **4. Innovation & Futuristic Potential** | **20** | Continuous 1-second GPS telematics logging to MongoDB, Web Speech API voice dictation, QR room autofill, and spatial duplicate clustering. |
| **5. Performance & Reliability** | **10** | Cloudinary CDN auto-compression, sub-second API responses, TTL automated log expiration, and graceful GPS/camera fallbacks. |
| **6. Demonstration Readiness** | **10** | Pre-seeded with realistic GIFT Autonomous campus data and 1-Click Fast Demo Logins for Student, Staff, Admin, and Super Admin roles. |
| **Total Marks** | **100** | **Complete Full-Stack Prototype Meeting All Mandates** |

---

## 3. Stakeholder Analysis & User Personas

### 3.1 Student / Campus Resident
* **Primary Objective:** Quickly report infrastructure defects, track status in real-time, and confirm resolution.
* **Key Needs:**
  * One-handed, fast reporting (< 30 seconds).
  * Room identification without typing complex building names (QR scan or voice).
  * Upvoting existing issues so they get fixed faster instead of filing duplicates.
  * Notifications when the reported defect is resolved.

### 3.2 Maintenance Staff / Field Technician
* **Primary Objective:** Receive assigned work orders, navigate directly to defect locations, and record verifiable proof of completion.
* **Key Needs:**
  * Clean queue of assigned tasks sorted by urgency and severity.
  * Direct location details (building, room, landmark, GPS pin).
  * 1-touch status updates (*Submitted* $\rightarrow$ *In Progress* $\rightarrow$ *Resolved*).
  * Mandatory upload of completion photo proof with resolution notes.
  * Continuous on-duty patrol broadcast to show active campus presence.

### 3.3 Campus Administrator (Estate & Facilities)
* **Primary Objective:** Oversee campus health, dispatch tasks to technicians, eliminate duplicate reports, and track KPIs.
* **Key Needs:**
  * High-level command center with real-time metrics (Resolution Rate, Critical Backlog, Active Staff).
  * Automated duplicate detection and 1-click duplicate merging.
  * Technician assignment and reassignment tools.
  * Live radar map tracking field staff locations.
  * 1-Click CSV export for administrative audits and executive reporting.

### 3.4 Super Administrator (Apex Higher Education Governance)
* **Primary Objective:** Oversee multiple affiliated colleges or campus branches under a centralized educational board.
* **Key Needs:**
  * Institute registration and code management.
  * Cross-campus comparative analytics and global resolution rate monitoring.
  * Multi-tenant data isolation preventing unauthorized access between institutes.

---

## 4. Functional Requirements (FR)

### Module 1: User Management, Authentication & Security
* **FR-1.1: Standard Registration & Login:** The system shall support user registration and authentication via email and hashed passwords with role assignment (`student`, `staff`, `admin`, `superadmin`).
* **FR-1.2: Session Management:** The system shall issue JSON Web Tokens (JWT) signed via HMAC-SHA256 with a 7-day validity period (`expiresIn: '7d'`) stored securely on the client.
* **FR-1.3: Google OAuth 2.0 Integration:** The system shall support one-click Single Sign-On (SSO) via Google OAuth 2.0 with backend token verification.
* **FR-1.4: 1-Click Evaluator Fast Login:** The login interface shall provide one-click demo login buttons for Student (`student.demo@gift.ac.in`), Staff (`maintenance.staff@gift.ac.in`), Admin (`admin.campus@gift.ac.in`), and Super Admin (`superadmin@quickfix.org`) to enable instant evaluation without manual typing.
* **FR-1.5: Role-Based Access Control (RBAC):** Backend endpoints shall enforce route-level authorization guards preventing non-privileged users from performing administrative or staff-restricted operations.

### Module 2: Smart Multi-Modal Issue Reporting
* **FR-2.1: Structured Issue Submission:** Users shall be able to submit issues specifying Title, Description, Category, Severity, Building, Room, Landmark, and GPS coordinates.
* **FR-2.2: Standardized Campus Categories:** The system shall enforce predefined campus categories:
  * Damaged Infrastructure (desks, doors, windows, walls)
  * Electrical & Lighting (fans, lights, switchboards, wiring)
  * Water Leakage & Plumbing (taps, pipes, washroom drainage)
  * Cleanliness & Sanitation (waste disposal, hygiene)
  * Network & Wi-Fi (routers, access points, lab connectivity)
  * Lab & Classroom Equipment (projectors, smart boards, computers)
  * Safety & Security Hazard (fire extinguishers, exposed cables)
  * Other Campus Maintenance
* **FR-2.3: Photographic Evidence Upload:** Users shall be able to attach a photo taken from the camera or uploaded from the gallery (up to 8MB). Photos shall be automatically uploaded to Cloudinary CDN and linked to the ticket document.
* **FR-2.4: Room QR Code Scanner:** The application shall include an in-app QR scanner capable of reading room QR codes (e.g., `{"building": "Kalam Tech Block", "room": "Lab 4", "zone": "Engineering Labs"}`) using the device webcam or image upload, automatically populating the form fields.
* **FR-2.5: AI Voice Dictation:** The system shall integrate the HTML5 Web Speech API allowing users to dictate issue details hands-free. The system shall extract keywords to suggest title, description, category, and severity.
* **FR-2.6: Automatic 1-Second GPS Tagging:** When filing a report, the client shall auto-fill high-accuracy GPS coordinates obtained from the device's geolocation sensor.

### Module 3: Intelligent Duplicate Detection Engine
* **FR-3.1: Spatial Proximity & Room Matching:** While a user fills out a report, the system shall evaluate existing open tickets (*Submitted* or *In Progress*) within a 50–60 meter radius or matching the same room number.
* **FR-3.2: Real-Time Duplicate Advisory:** If potential duplicates are detected, the app shall display an in-form warning showing the existing ticket's title, photo, status, and distance, offering the user a direct link to upvote the existing ticket instead of submitting a duplicate.
* **FR-3.3: Administrator Ticket Merging:** Administrators shall have the ability to merge duplicate tickets into a primary ticket, transferring upvotes and auto-resolving the duplicate with a link to the primary ticket.

### Module 4: Algorithmic Priority Engine
* **FR-4.1: Multi-Factor Priority Scoring:** Every ticket shall automatically compute a numeric `priorityScore` (0 to 100) before saving in the database:
  $$\text{Priority Score} = \text{Base Severity Score} + \text{Upvote Score} + \text{Emergency Bonus}$$
  * *Critical:* Base score = 90
  * *High:* Base score = 70
  * *Medium:* Base score = 50
  * *Low:* Base score = 25
  * *Upvotes:* $+5$ points per upvote (capped at $+20$ points)
* **FR-4.2: Dynamic Recomputation:** When students upvote a ticket, the system shall dynamically recompute and update its priority score in real-time, sorting urgent community concerns to the top of the queue.

### Module 5: Lifecycle Tracking & SLA Progression
* **FR-5.1: Finite State Machine:** Every issue shall progress through defined states: `Submitted` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved`.
* **FR-5.2: SLA Audit History:** Every status change shall append an entry to `statusHistory` recording the new status, ISO timestamp, user name, and remarks.
* **FR-5.3: Before/After Photographic Verification:** When marking an issue as `Resolved`, staff must provide resolution notes and an optional completion proof photo, allowing side-by-side comparison on the ticket detail page.
* **FR-5.4: Community Upvoting & Discussion:** Campus users shall be able to upvote issues (optimistically updated in UI) and post contextual comments.

### Module 6: High-Frequency 1-Second GPS Telematics Stream
* **FR-6.1: 1,000ms Location Telemetry Broadcast:** Active client sessions shall stream device coordinates, speed, heading, altitude, and accuracy to `/api/location/log` every 1,000 milliseconds.
* **FR-6.2: Automated Campus Geofencing:** Incoming telemetry shall be matched against campus zones (Main Academic Block, Library, Hostels, Cafeteria, Sports Complex) using Euclidean radius boundaries to log the active zone.
* **FR-6.3: Simulated Patrol Fallback:** In desktop environments or when GPS hardware lacks satellite lock, the client service shall initiate a realistic campus patrol drift simulation around GIFT Autonomous campus coordinates (`20.2195° N, 85.7360° E`).
* **FR-6.4: Time-To-Live (TTL) Data Pruning:** MongoDB shall automatically expire high-frequency location logs after 7 days (`expireAfterSeconds: 604800`) to prevent database bloat while maintaining audit trails.

### Module 7: Interactive Live Radar Campus Map
* **FR-7.1: Campus-Centered Map View:** The app shall embed an interactive Leaflet map centered at GIFT Autonomous Bhubaneswar coordinates.
* **FR-7.2: Animated User Radar Pulse:** A pulsing blue radar wave shall visually represent the user's active GPS coordinate and sensor accuracy circle.
* **FR-7.3: Active Staff Patrol Markers:** Field maintenance staff actively streaming telemetry shall appear as distinct technician pins showing their name, role, and current zone.
* **FR-7.4: Severity-Coded Issue Pins:** Open campus issues shall be plotted with color-coded markers (Red = Critical, Orange = High, Yellow = Medium, Blue = Low) with clickable popup cards.

### Module 8: Field Staff Task Management Portal (`/staff`)
* **FR-8.1: Work Order Queue:** Technicians shall view tasks assigned directly to them, along with unassigned critical emergencies.
* **FR-8.2: 1-Click Status Advance:** Technicians can transition tickets from *Submitted* to *In Progress* with a single tap.
* **FR-8.3: Completion Modal:** Technicians can resolve tickets by uploading completion proof photos and entering closing remarks.

### Module 9: Executive Administrative Command Center (`/admin`)
* **FR-9.1: Executive KPI Metrics:** Administrators shall view real-time metrics for Total Issues, Submitted, In Progress, Resolved, Critical Backlog, Resolution Rate (%), Average Resolution Time (Hours), and Active On-Duty Staff.
* **FR-9.2: Ticket Dispatch & Assignment:** Administrators can assign or reassign any ticket to available technicians.
* **FR-9.3: User Role Management:** Administrators can view all registered campus members and promote or demote roles (`student` $\leftrightarrow$ `staff` $\leftrightarrow$ `admin`).
* **FR-9.4: Campus Zone Configuration:** Administrators can add, edit, or delete campus zones with custom coordinates, category defaults, and inspection recommendations.
* **FR-9.5: 1-Click CSV Export:** Administrators can export comprehensive campus ticket logs to CSV format for board presentations and compliance audits.

### Module 10: Super Administrator Governance Directorate (`/superadmin`)
* **FR-10.1: Campus Administrator Governance:** Super administrators have dedicated authority to manage normal campus administrators across all colleges (creating new admin accounts, updating administrative assignments, resetting credentials, or revoking accounts).
* **FR-10.2: Privacy Safeguard & Isolation:** Super administrators are strictly insulated from private student complaints, personal descriptions, and direct discussion logs; civic maintenance data remains confidential at the campus administrator level.
* **FR-10.3: Unified Management (No Institute Filter):** All normal campus administrators are managed in a consolidated directory without institute dropdown filtering.
* **FR-10.4: Modular CSV Data Seeding:** The backend initializes campus seed datasets (institutions, user credentials, and maintenance issues) from structured CSV files located in `server/data/` (`institutes.csv`, `users.csv`, `issues.csv`).

### Module 11: Real-Time Campus Notifications
* **FR-11.1: Role-Targeted Broadcasts:** Notifications shall support targeting by role (`all`, `student`, `staff`, `admin`) or direct user recipient.
* **FR-11.2: Ticket Event Triggers:** Automated notifications shall be dispatched upon ticket submission (notifying staff), task assignment (notifying technician), and status changes (notifying reporter).
* **FR-11.3: Read State Tracking:** Users can mark notifications as read, updating the unread counter in the navigation bell.

---

## 5. Non-Functional Requirements (NFR)

### 5.1 Performance & Responsiveness
* **NFR-1.1:** REST API endpoint response times shall not exceed 300ms under standard local load, and shall remain under 800ms when hosted on cloud instances.
* **NFR-1.2:** Client production bundle size shall be optimized using Vite tree-shaking, resulting in a production build time under 6 seconds.
* **NFR-1.3:** Images uploaded to Cloudinary shall be delivered via CDN with responsive width parameters, maintaining fast load times on 3G/4G campus mobile connections.
* **NFR-1.4:** High-frequency location streaming (`/api/location/log`) shall process background POST requests asynchronously without freezing or stuttering the client UI thread.

### 5.2 Scalability & Data Architecture
* **NFR-2.1:** MongoDB collections shall utilize geospatial 2dsphere indexes for coordinate lookups and compound indexes on `{ category: 1, status: 1 }` and `{ institute: 1, createdAt: -1 }`.
* **NFR-2.2:** Location telemetry records shall be governed by MongoDB TTL (Time-To-Live) indexes to ensure automatic data grooming after 7 days without requiring manual cron jobs.

### 5.3 Usability, Accessibility & Design
* **NFR-3.1:** The user interface shall adhere to a mobile-first philosophy with high contrast ratios, large tap targets ($\ge 44 \times 44\text{ px}$), and clear typography.
* **NFR-3.2:** The app shall provide an interactive **Smartphone Device Frame Toggle** allowing presentation evaluators to inspect the mobile viewport layout or expand to desktop view on widescreen monitors.
* **NFR-3.3:** The application shall include PWA manifest capabilities (`manifest.json`) and vector SVG icons (`favicon.svg`) allowing seamless installation to Android home screens.

### 5.4 Security & Data Protection
* **NFR-4.1:** All passwords stored in MongoDB shall be hashed with `bcryptjs` using a salt work factor of 10.
* **NFR-4.2:** All private API endpoints shall be protected by JWT Bearer authentication headers validated via Express middleware.
* **NFR-4.3:** Sensitive administrative actions (role updates, issue deletions, institute creation) shall be restricted by strict RBAC middleware checking `req.user.role`.
* **NFR-4.4:** Cross-Origin Resource Sharing (CORS) shall be configured to allow secure communication between frontend and backend domains.

### 5.5 Reliability, Resilience & Graceful Degradation
* **NFR-5.1:** If camera hardware or browser permissions are unavailable, the QR scanner and photo uploaders shall allow standard file picker selection.
* **NFR-5.2:** If geolocation hardware is unavailable or blocked, the location logger shall transition to campus patrol simulation to prevent application crashes.
* **NFR-5.3:** If Cloudinary credentials are missing or unconfigured, the server shall automatically fall back to local disk storage in `server/uploads/` without throwing unhandled exceptions.

---

## 6. Requirements Traceability Matrix (RTM)

| Requirement ID | Description | Component / File | Verification Method |
|---|---|---|---|
| **FR-1.1, FR-1.2** | 7-day JWT Authentication | `server/controllers/authController.js`, `client/src/context/AuthContext.jsx` | Integration Test / Login API |
| **FR-1.3** | Google OAuth SSO | `client/src/pages/LoginPage/LoginPage.jsx`, `server/controllers/authController.js` | OAuth Token Verification |
| **FR-1.4** | 1-Click Fast Evaluator Login | `LoginPage.jsx`, `authController.js` (`demoLogin`) | UI Button Click Test |
| **FR-2.1, FR-2.3** | Photo Issue Reporting | `ReportIssuePage.jsx`, `server/controllers/issueController.js`, Cloudinary | Multipart POST Test |
| **FR-2.4** | Room QR Code Scanner | `QRScannerModal.jsx`, `jsQR` library | Webcam & Sample QR Image Test |
| **FR-2.5** | AI Voice Dictation | `VoiceReportModal.jsx`, Web Speech API | Speech Recognition Test |
| **FR-3.1, FR-3.2** | Spatial Duplicate Detection | `issueController.js` (`checkDuplicates`), `ReportIssuePage.jsx` | Proximity API Test (50m radius) |
| **FR-4.1, FR-4.2** | Smart Priority Engine | `server/models/Issue.js` (`pre-save` hook), `issueController.js` | Score Calculation Unit Test |
| **FR-5.1 - FR-5.3** | Lifecycle & Before/After Proof | `IssueDetailPage.jsx`, `issueController.js` (`updateIssueStatus`) | State Transition & Image Test |
| **FR-6.1 - FR-6.4** | 1-Sec GPS Telematics Stream | `locationLogger.js`, `locationController.js`, `LocationLog.js` | 1000ms Polling Network Test |
| **FR-7.1 - FR-7.4** | Live Campus Radar Map | `LiveMap.jsx`, `LiveMapPage.jsx`, Leaflet | Visual Map Render Test |
| **FR-8.1 - FR-8.3** | Staff Work Order Portal | `StaffDashboardPage.jsx`, `issueController.js` | Assigned Task Queue Test |
| **FR-9.1 - FR-9.5** | Admin Command Center & CSV | `AdminDashboardPage.jsx`, `adminController.js` | Metric Aggregation & Export Test |
| **FR-10.1 - FR-10.3** | Multi-Campus Tenancy | `Institute.js`, `instituteController.js`, `OrgContext.jsx` | Multi-Institute Isolation Test |
| **FR-11.1 - FR-11.3** | Campus Alerts & Notifications | `Notification.js`, `notificationController.js`, `NotificationBell.jsx` | Notification Feed Test |

---

*End of System Requirements Specification.*
