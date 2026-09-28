# 📖 Comprehensive User & Demonstration Manual
## Smart Campus QuickFix — Real-Time Civic Maintenance & Campus Telematics Platform
**Event:** BPUT Tech Carnival 2026 • **Venue:** GIFT Autonomous, Bhubaneswar  
**Date:** September 2026 • **Version:** 1.0.0 • **Document Status:** Official User Guide

---

## 1. Introduction & Overview

**Smart Campus QuickFix** is a mobile-first civic maintenance and facility management platform built to transform how college campuses identify, report, prioritize, and resolve infrastructure issues. 

Modeled on the campus of **Gandhi Institute For Technology (GIFT Autonomous, Bhubaneswar)** under **Biju Patnaik University of Technology (BPUT)**, this application provides an end-to-end transparent workflow connecting students, field maintenance technicians, and university administrators.

---

## 2. ⚡ Fast Evaluator 15-Minute Jury Demonstration Guide

To maximize demonstration efficiency during the **15-minute live jury presentation**, the application includes dedicated **1-Click Demo Login** shortcuts that bypass all credential typing.

### 2.1 One-Click Demo Credentials
Navigate to [`/login`](file:///client/src/pages/LoginPage/LoginPage.jsx) and click any of the colored demo role badges:

| Persona Badge | Demo Account | Assigned Role | Landing Page | Key Demonstration Highlights |
|---|---|---|---|---|
| 🎓 **Student** | `student.demo@gift.ac.in` | `student` | `/` (Home) | Report problems, camera photo upload, room QR autofill, AI voice dictation, upvoting |
| 🛠️ **Staff** | `maintenance.staff@gift.ac.in` | `staff` | `/staff` (Work Orders) | Assigned ticket queue, 1-second live GPS patrol broadcasting, completion proof photo |
| 🛡️ **Admin** | `admin.campus@gift.ac.in` | `admin` | `/admin` (Console) | Executive KPIs, ticket dispatch, duplicate merging, user elevation, 1-click CSV export |
| 👑 **Super Admin** | `superadmin@quickfix.org` | `superadmin` | `/admin` (Super Console) | Multi-campus governance, institute registration, cross-college resolution analytics |

> [!TIP]
> **Dynamic Role Switcher:** You can also dynamically switch roles on the fly using the **Role Switcher dropdown** located in the top navigation bar without logging out!

### 2.2 Toggleable Smartphone Chassis vs. Fullscreen View
When viewing the application on a laptop, desktop, or presentation projector screen, an interactive **Smartphone Device Frame Toggle** appears in the top-right corner.
- **Phone Frame Mode:** Displays the application enclosed in a realistic smartphone chassis with an active status bar (time, 5G, battery), speaker notch, camera lens, and rounded corners. This visually proves the mobile-first UX design to the jury.
- **Fullscreen Mode:** Expands the application to occupy the full browser viewport for expansive data tables and charts.
- **Mobile Hardware:** On smartphones and tablets ($\le 1024\text{ px}$), the app automatically enters native edge-to-edge fullscreen mode.

---

## 3. 🎓 Student & Campus Resident Manual

### 3.1 Exploring the Campus Feed (`/` & `/track`)
1. **Search Bar:** Type keywords to search issues by title, description, building, or room number (e.g., *"Lab 4"*, *"Aryabhatta"*, *"fan"*).
2. **Category Filter:** Filter by campus domains including *Electrical & Lighting*, *Water Leakage & Plumbing*, *Cleanliness & Sanitation*, *Network & Wi-Fi*, etc.
3. **Status Tabs:** Switch between **All**, **Submitted** (Orange), **In Progress** (Blue), and **Resolved** (Green).
4. **Sorting Options:** Sort tickets by **Highest Priority** (algorithmic score), **Latest First**, or **Most Upvoted**.

### 3.2 Upvoting Community Issues
Instead of filing duplicate reports for an existing issue (such as a water leak in the main cafeteria):
1. Locate the issue card on the Home or Tracking page.
2. Tap the **👍 Upvote** button.
3. The upvote count increments immediately (optimistic UI update), boosting the ticket's `priorityScore` by $+5$ points and alerting administrators of growing student concern.

---

### 3.3 Filing an Issue Step-by-Step (`/report`)

```
[ Step 1: Open Form ] ──> [ Step 2: Auto GPS / QR Scan ] ──> [ Step 3: Voice / Text Input ]
                                                                       │
[ Step 6: Confirmation ] <── [ Step 5: Duplicate Advisory ] <── [ Step 4: Photo Evidence ]
```

#### Step 1: Access the Reporting Page
Tap the central **"Report"** tab in the bottom navigation bar or the floating action button.

#### Step 2: Capture Coordinates & Location
* **Automatic GPS Lock:** The app automatically accesses device GPS sensors to record high-precision latitude and longitude coordinates.
* **Room QR Scanner Modal:** Tap **"Scan QR"** to launch the camera. Point the camera at a door or equipment QR code sticker (e.g., `{"building": "Kalam Tech Block", "room": "Lab 4"}`). The room, building, zone, and inspection recommendations will autofill instantly.
  * *No Camera?* Switch to the **"Select Campus Zone"** tab in the modal to pick any predefined GIFT campus location.

#### Step 3: Enter Issue Details (Text or AI Voice)
* **Title & Description:** Enter a brief summary of the problem.
* **AI Voice Dictation:** Tap the **"Voice Assistant"** button and speak naturally (e.g., *"Leaking tap overflowing on 2nd floor Aryabhatta washroom"*). The app converts speech to text and intelligently pre-populates category, severity, and title.
* **Category & Severity:** Select from 8 campus categories and choose severity level (*Low*, *Medium*, *High*, or *Critical*).

#### Step 4: Attach Photographic Evidence
* Tap the camera area to snap a live photo or select an image from your device gallery (supports JPG, PNG, WebP up to 8MB).
* An instant thumbnail preview is displayed with a remove/replace option.

#### Step 5: Real-Time Duplicate Warning Advisory
* As you type the location and category, the built-in AI duplicate detection engine evaluates open tickets within 50 meters.
* If a similar issue is detected, an **Amber Duplicate Advisory Banner** appears showing the existing ticket's photo, title, distance, and current status, inviting you to upvote that ticket instead.

#### Step 6: Submit Ticket
* Tap **"Submit Ticket"**.
* The image is compressed and securely uploaded to Cloudinary CDN, the algorithmic priority score is computed, and campus technicians receive an automated alert notification.
* You are immediately redirected to the ticket's SLA timeline page.

---

### 3.4 Tracking SLA Timeline & Discussion (`/issues/:id`)
Every ticket features a dedicated real-time progress page:
1. **Visual SLA Progression Stepper:** Shows chronological milestones: *Submitted* $\rightarrow$ *Under Review* $\rightarrow$ *Assigned* $\rightarrow$ *In Progress* $\rightarrow$ *Resolved*.
2. **Interactive Campus Pin:** Displays the exact location coordinates on an embedded mini-map.
3. **Before & After Photo Proof:** Once resolved, shows the reporter's original evidence photo alongside the technician's verified completion photo.
4. **Discussion Thread:** Post contextual comments or query updates from the maintenance crew.

---

## 4. 🛠️ Field Maintenance Staff Manual (`/staff`)

The Staff Portal is engineered for field technicians on duty across campus.

### 4.1 On-Duty 1-Second GPS Patrol Telemetry
At the top of the Staff Dashboard, the **Patrol Telemetry Bar** shows:
- **Broadcasting Status:** Indicates active 1,000ms GPS transmission to MongoDB Atlas.
- **Campus Zone Detection:** Displays the technician's current campus zone (e.g., *"Main Academic Block"* or *"Central Library"*).
- **Patrol Toggle:** Tap **"On Duty (Broadcasting)"** to pause or resume telemetry tracking.

### 4.2 Managing Assigned Work Orders
1. **Task Queue:** View work orders assigned to you, prioritized by urgency and critical hazard flags.
2. **Starting Work:** Tap **"Start Work"**. The ticket status transitions immediately to `In Progress`, recording a timestamp and updating the reporter's feed.
3. **Navigating to Defect:** Tap the location pin to inspect room details, building landmarks, and GPS coordinates.

### 4.3 Resolving Issues & Submitting Photo Proof
When maintenance work is physically completed:
1. Tap **"Mark Resolved"** on the work order card.
2. The **Resolution Proof Modal** appears.
3. **Attach Proof Photo:** Snap a photo of the repaired equipment (mandatory for high-accountability audits).
4. **Enter Resolution Notes:** Provide details of the repair (e.g., *"Replaced 36W LED ballast and tightened socket terminals"*).
5. Tap **"Complete & Submit Proof"**.
6. The ticket is marked `Resolved`, resolution timestamp is locked, and the student reporter receives a resolution notification.

---

## 5. 🛡️ Campus Administrator Manual (`/admin`)

The Administrative Command Center provides senior facility managers with birds-eye oversight.

### 5.1 Executive KPI Metrics
The command center displays four real-time KPI tiles:
- **Total Campus Tickets:** Complete volume of registered maintenance reports.
- **Resolution Rate (%):** Percentage of closed/resolved tickets.
- **Critical Backlog:** Open high-risk safety hazards requiring immediate intervention.
- **On-Duty Field Crew:** Number of active technicians currently broadcasting GPS patrol telemetry.
- **Average Resolution Time:** Average turnaround time in hours.

---

### 5.2 Ticket Management & Technician Dispatch
Under the **"Campus Issues"** tab:
1. **Assigning Technicians:** Use the technician dropdown on any ticket card to assign work to an available staff member (e.g., *Bikash Mohapatra*). The technician receives an instant task notification.
2. **Status Override:** Change status manually between *Submitted*, *In Progress*, and *Resolved*.
3. **Delete / Spam Removal:** Delete false alarms, offensive content, or accidental submissions with one click.

---

### 5.3 Merging Duplicate Issues
When multiple students report the same incident (e.g., pipe burst):
1. In the Admin Dashboard, click **"Merge Duplicate"** on the redundant ticket.
2. Select the **Primary Ticket ID**.
3. Tap **"Confirm Merge"**.
4. The system automatically transfers all upvotes from the duplicate to the primary ticket (recomputing its priority score), marks the duplicate as `Resolved`, and links it back to the primary ticket.

---

### 5.4 Live Staff Radar Patrol Monitor
Click the **"Staff Patrol"** tab to view live telematics:
- Inspect technician names, roles, battery levels, speed, accuracy, and current campus zones.
- View recent telemetry timestamps to confirm field personnel are actively patrolling.

---

### 5.5 User Role Management & Elevation
Under the **"User Directory"** tab:
- Browse all registered students, faculty, and maintenance crew.
- Elevate or alter user permissions dynamically using the role dropdown (*Student* $\leftrightarrow$ *Staff* $\leftrightarrow$ *Admin*).

---

### 5.6 Configuring Campus Zones
Under the **"Campus Zones"** tab:
- Add custom university blocks, laboratories, hostels, or sports grounds.
- Set latitude/longitude coordinates, default categories, and standard inspection recommendations.
- Changes update the QR room scanner and GPS geofencer across the entire system.

---

### 5.7 1-Click CSV Report Export
Tap the **"Export CSV"** button in the header of the Admin Dashboard. The system generates and downloads a clean CSV file containing:
- Ticket ID, Title, Category, Severity, Status
- Building, Room, Coordinates, QR Tag
- Reporter Name, Assigned Staff Name
- Creation Date, Resolution Date, Resolution Duration (Hours)

---

## 6. 👑 Super Administrator Manual (Multi-Campus Governance)

When logged in as `superadmin@quickfix.org`, the administrator gains access to **Multi-Institute Governance**:

### 6.1 Multi-Campus Aggregations
- **Cross-Campus Overview:** Compares total volume, resolution rate, and active users across affiliated colleges (e.g. *GIFT Autonomous*, *CET Bhubaneswar*, *VSSUT Burla*).
- **Institute Filter Dropdown:** Filter the entire admin console by specific institute or view global data.

### 6.2 Registering a New Institution
1. Tap **"+ Register New Institute"**.
2. Enter Institute Name, Unique Code (e.g., `GIFT-AUTONOMOUS`, `BPUT-MAIN`), City, State, and Official Contact Email.
3. Tap **"Create Institute"**.
4. The institute is instantly available in the registration dropdown for new student onboarding.

---

## 7. 📱 Mobile App & PWA Installation Guide

### 7.1 Progressive Web App (PWA) Installation
The application includes a web app manifest (`manifest.json`) and service worker configuration:
1. Open the application URL in **Google Chrome** on an Android phone.
2. Tap the browser menu (⋮) and select **"Add to Home Screen"** or **"Install App"**.
3. An app icon with the GIFT QuickFix shield logo will appear on your phone's home screen.
4. Launching the icon runs the application in a standalone, chromeless native-like window.

### 7.2 Native Android APK (Capacitor)
The project includes a ready-to-build Android wrapper:
- Pre-compiled debug APK: [`SmartCampusQuickFix-debug.apk`](file:///e:/Semesters/7th%20Sem/Tech-Carnival2026/SmartCampusQuickFix-debug.apk)
- Automated build script: [`build-apk.ps1`](file:///e:/Semesters/7th%20Sem/Tech-Carnival2026/build-apk.ps1)
- To transfer and test on Android hardware, follow [`send_to_phone.txt`](file:///e:/Semesters/7th%20Sem/Tech-Carnival2026/send_to_phone.txt).

---

## 8. ❓ Troubleshooting & Frequently Asked Questions (FAQ)

### Q1: The browser asks for camera permission when opening the QR scanner or photo uploader.
* **Solution:** Tap **"Allow"**. If blocked, open browser settings $\rightarrow$ Site Settings $\rightarrow$ Camera $\rightarrow$ Allow. Alternatively, use the **"Select Campus Zone"** or **"Upload Image"** fallback options.

### Q2: Geolocation reports a warning or coordinates do not update.
* **Solution:** Ensure location services are turned on in your device settings. If testing in an indoor lab or desktop without GPS satellites, the app automatically activates **Simulated Campus Patrol**, ensuring realistic coordinates around GIFT Autonomous Bhubaneswar (`20.2195° N, 85.7360° E`).

### Q3: Voice dictation does not capture speech.
* **Solution:** Voice dictation uses the browser Web Speech API (supported natively in Google Chrome, Edge, and Safari). Ensure your microphone is allowed. If speech recognition fails, the modal provides simulated voice prompts for quick testing.

### Q4: How long does a user session remain logged in?
* **Solution:** All sessions are signed with 7-day JSON Web Tokens (`expiresIn: '7d'`), so evaluators and students will not be logged out during the competition.

---

*End of User & Demonstration Manual.*
