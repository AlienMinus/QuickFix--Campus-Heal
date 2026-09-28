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

#### Step 4: Attach Photographic or Video Evidence
* Tap the media upload area to snap a live photo, record a short video clip, or select from your gallery.
* **Supported Formats:**
  * **Photos:** JPG, PNG, WebP, HEIC up to 10MB.
  * **Videos:** MP4, WebM, MOV, MKV up to 50MB (ideal for showing dynamic issues like sparking wires, running water leaks, or rattling machinery).
* An instant interactive preview (image thumbnail or inline HTML5 video player) appears with a remove/replace option.

#### Step 5: Real-Time Duplicate Warning Advisory
* As you type the location and category, the built-in AI duplicate detection engine evaluates open tickets within 50 meters.
* If a similar issue is detected, an **Amber Duplicate Advisory Banner** appears showing the existing ticket's photo/video, title, distance, and current status, inviting you to upvote that ticket instead.

#### Step 6: Submit Ticket
* Tap **"Submit Ticket"**.
* The image or video is compressed and securely uploaded to Cloudinary CDN (or local fallback storage), the algorithmic priority score is computed, and campus technicians receive an automated alert notification.
* You are immediately redirected to the ticket's SLA timeline page.

---

### 3.4 Tracking SLA Timeline & Discussion (`/issues/:id`)
Every ticket features a dedicated real-time progress page:
1. **Visual SLA Progression Stepper:** Shows chronological milestones: *Submitted* $\rightarrow$ *Under Review* $\rightarrow$ *Assigned* $\rightarrow$ *In Progress* $\rightarrow$ *Resolved*.
2. **Interactive Campus Pin:** Displays the exact location coordinates on an embedded mini-map.
3. **Before & After Media Proof:** Displays the reporter's original evidence (photo or playable video) alongside the technician's verified completion proof (photo or video).
4. **Discussion Thread:** Post contextual comments or query updates from the maintenance crew.

---

### 3.5 Institute-Scoped Live Notifications & Passive Feed
The notification bell in the top navigation bar delivers real-time ticket alerts:
1. **Strict Institute Boundary:** Students and staff only receive notifications generated within their own enrolled campus. Cross-campus notifications are completely filtered out.
2. **Impersonal Passive Phrasing:** Broadcast notifications are written in clean passive voice without second-person pronouns (e.g., *"Reported issue status has been updated to 'Resolved'"* and *"Technician has been assigned to resolve the issue at Main Academic Block"*), preventing confusion across students or staff viewing the alert list.
3. **Personalized Privacy Routing:** Ticket status updates and assignment dispatches are securely routed only to the reporter and assigned staff.

---

### 3.6 Dynamic Registration & Academic Stream Selection (`/register`)
When new students or staff members create an account:
1. **Dynamic Campus Binding:** Selecting an **Institute / College** from the dropdown instantly queries that institute's active registry via `GET /api/institutes/branches/:identifier`.
2. **Synchronized Stream Dropdown:** The **Department / Academic Stream** select list dynamically populates with the exact branches configured by that college's administrator (e.g., *Computer Science & Engineering (CSE)*, *AI & DS*, *Mechanical Engineering*, *MBA*).
3. **Dedicated Campus Data:** Account data, reports, and zones remain isolated within the selected college.

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

### 4.3 Resolving Issues & Submitting Photo or Video Proof
When maintenance work is physically completed:
1. Tap **"Mark Resolved & Upload Proof"** on the work order card.
2. The **Resolution Proof Modal** appears.
3. **Attach Proof Photo or Video:** Snap a photo or record a short video clip proving the repair was completed (e.g., demonstrating that the fan spins silently or the tap stops leaking). An interactive media preview appears immediately.
4. **Enter Resolution Notes:** Provide details of the repair (e.g., *"Replaced 36W LED ballast and tightened socket terminals"*).
5. Tap **"Confirm & Close Ticket"**.
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

### 5.8 Institute Header Customization (Normal Admin)
Normal college administrators have dedicated controls to customize portal branding for their campus:
1. Tap the **"Customize"** button in the Admin Dashboard header to open the **Institute Header Customization** modal.
2. Edit **Institute / Campus Header Title** and **Header Tagline / Subtitle**.
3. Changes immediately update the portal navbar branding for all students, technicians, and faculty belonging to that college (`PUT /api/institutes/my-institute/header`).
4. **Security Boundary:** Normal administrators cannot modify or access the platform-wide Global Header.

---

### 5.9 Academic Branches & Streams Registry
Campus administrators can manage the official list of academic departments and streams offered by their institution:
1. Navigate to the **"Academic Branches & Streams"** section in the Admin Console (accessible via the section selector dropdown or dashboard tabs).
2. **Add New Stream:** Tap **"+ Add New Stream"**, input the academic stream name (e.g., *Computer Science & Engineering (CSE)*, *Electrical & Electronics Engineering (EEE)*, *MBA*), and confirm.
3. **Edit Stream:** Tap the edit icon to rename or update stream designations.
4. **Delete Stream:** Remove obsolete or inactive streams with confirmation.
5. **Reset to Defaults:** Restore the 10 standard engineering and management defaults at any time.
6. **Live Registration Synchronization:** All active streams configured here instantly populate the *Department / Academic Stream* dropdown on the user registration page for new students and staff joining this college.

---

## 6. 👑 Super Administrator Manual (Apex Governance Directorate)

When logged in as `superadmin@quickfix.org`, the user is directed to the dedicated **Super Admin Directorate** (`/superadmin`).

### 6.1 Purpose & Role Definition
* **Managing Normal Admins:** The Super Admin's explicit mandate is to govern and manage normal Campus Administrators across institutions.
* **Privacy by Design:** Super Administrators do not have access to private student complaint logs, chat message threads, confidential photos, or personal student profiles. Private operations remain strictly isolated at the campus administrator level.
* **Unified Governance (No Institute Filter):** All campus administrators are managed in a single, unified administrative directory without cumbersome institute dropdown filters.

### 6.2 Managing Campus Administrators
1. **Admin Directory:** View all registered campus administrators, their official emails, assigned campuses, administrative departments, employee identifiers, phone numbers, and onboarding dates.
2. **Onboarding a New Campus Admin:**
   - Tap **"+ Onboard Campus Admin"**.
   - Enter Full Name, Official Email Address, Initial Temporary Password, Assigned Campus/Institute, Department, Employee Identifier, and Contact Phone.
   - Tap **"Register Admin"**. The new administrator can now sign in immediately to their campus console.
3. **Editing Administrator Details:**
   - Tap **"Edit"** on any administrator card.
   - Modify department, assigned campus, contact details, or promote/demote access levels (*Admin* $\leftrightarrow$ *Staff* $\leftrightarrow$ *Student*).
   - Enter a new temporary password to reset the administrator's credentials if requested.
4. **Revoking Administrator Access:**
   - Tap the red trash icon on any administrator card.
   - Confirm revocation to delete the administrator account. All existing tickets supervised by the administrator remain preserved in the system.

### 6.3 High-Level System Governance Metrics
The Super Admin dashboard displays aggregated platform-wide counters:
* **Campus Admins:** Total number of active campus administrators.
* **Total Platform Users:** Total registered users system-wide (aggregated count only, zero private records exposed).
* **Field Staff Personnel:** Total active maintenance technicians across all campuses.
* **Security Governance:** Status of role-based access control (RBAC) and privacy isolation.

---

### 6.4 Global Platform Header Governance
Super Administrators hold exclusive central authority over the platform-wide brand identity:
1. Tap the **"Global Header"** button in the directorate header actions bar.
2. Configure **Platform Name / Main Header Title** (e.g., *Smart Campus QuickFix*), **Secondary Subtitle**, and **Header Tagline / Mission**.
3. Changes update central platform branding for guests, unauthenticated landing screens, login/register pages, and Super Admin views via `PUT /api/settings/global-header`.
4. Stored centrally in the `SystemSetting` key-value collection (`global_header`).

---

### 6.5 Campus Facility Category Governance
Super Administrators manage the standardized campus maintenance taxonomy:
1. Tap **"Define Category"** in the directorate top action bar.
2. Specify Category Name (e.g., *HVAC & Climate Control*, *Fire Safety & Extinguishers*), unique Category Code (e.g., `HVAC`, `FIRE`), Description, Default Severity Level (*Low*, *Medium*, *High*, *Critical*), SLA Target Turnaround Hours, Icon, and Status (*Active* / *Inactive*).
3. Super Admins can edit existing categories, adjust SLA requirements, or remove categories from governance.
4. Changes automatically propagate across all campus reporting forms, dynamic hashtag dropdowns, and analytics filters.

---

### 6.6 Responsive KPI Grid
The Super Admin console features an adaptive executive grid:
* **Large Desktop Viewports:** Enhanced 4-column layout with spacious typography and instant status chips.
* **Tablet & Mobile Screens:** Clean stacked auto-fitting cards with optimal alignment and zero horizontal overflow.

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
