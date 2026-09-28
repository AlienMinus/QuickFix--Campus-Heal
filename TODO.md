# 🏆 BPUT Tech Carnival 2026
## 📱 Mobile Application Development Contest — Problem Statement & Mandate

> **Event:** BPUT Tech Carnival 2026  
> **Venue:** GIFT Autonomous, Bhubaneswar  
> **Event Date:** 29th September 2026  
> **Development Time:** 3 Hours  
> **Live Demonstration:** 15 Minutes per Participant  
> **Participation:** Individual  

---

## 📌 Problem Statement: Smart Campus QuickFix

### 🎯 The Goal
Develop a mobile application focused entirely on identifying, reporting, tracking, and managing campus-related issues in a smart, transparent, and user-friendly manner.

The application should help students and other campus users report common problems such as:
* 🔌 Broken lights, ceiling fans, switchboards, and electrical hazards
* 🚰 Water leakage, washroom flooding, and plumbing failures
* 🧹 Cleanliness, waste disposal, and campus sanitation issues
* 📶 Wi-Fi network dead zones, router failures, and lab connectivity issues
* 🪑 Damaged infrastructure, broken desks, doors, windows, and walls

---

## 📋 Core Requirements (What the App Must Do)

### 1. Smart Issue Reporting & Location
* **Input:** Allow users to easily select the issue category, provide a short description, and specify the exact location of the reported issue.
* **Evidence:** Allow users to optionally attach a photograph or other relevant evidence (images or dynamic video clips) of the issue.
* **Submission:** Provide a simple, responsive, and functional mechanism to submit and record the reported issue into persistent storage.

### 2. Issue Tracking & Smart Prioritization
* **Tracking:** Provide users with a clear mechanism to view their submitted issues and track their current lifecycle status (*Submitted*, *In Progress*, or *Resolved*).
* **Prioritization:** Provide an automated mechanism to categorize or prioritize reported issues based on factors such as issue type, severity level, upvotes, or relevance.
* **Smart Features:** Implement innovative features such as:
  * Intelligent issue categorization & dynamic hashtag tagging (`#category`, `@zone`, `$severity`)
  * Spatial duplicate-issue detection (Haversine radius & room proximity advisory)
  * Room QR code scanning for instantaneous location autofill
  * Algorithmic priority score computation ($0-100$)

### 3. Campus Impact & Innovation
* **Dashboard:** Provide a clear dashboard summary showing relevant information such as reported issues, issue categories, status, active on-duty personnel, and resolution statistics.
* **Notifications:** Provide users with real-time notifications or updates regarding their reported issues and dispatched assignments.
* **Innovation:** Incorporate forward-looking capabilities:
  * Executive analytics and 1-click CSV audit export
  * Accessibility features and responsive smartphone frame toggle
  * Hands-free AI voice-based reporting (Web Speech API)
  * Continuous 1-second GPS patrol telematics streaming to cloud database
  * Multi-campus tenancy, central platform governance, and isolated campus notifications

---

## ⚙️ Technical Mandate
* The app may be built using a suitable mobile application development framework or technology of the participant's choice.
* The solution must demonstrate a functional mobile application prototype with a clear purpose and working core functionality.
* Participants may use suitable APIs, cloud databases, mapping/location services, or media CDNs where required for their proposed solution.
* Advanced technologies such as AI/ML are optional and are not mandatory for participation. Quality, relevance, and functionality are prioritized over sheer quantity of tools.

---

## 📊 Evaluation Criteria (100 Marks Breakdown)

| # | Evaluation Criterion | Marks | System Implementation Highlights | Status |
|:---:|---|:---:|---|:---:|
| **1** | **Problem Understanding & Relevance** | **15** | Accurately models real-world student and estate management pain points across GIFT Autonomous / BPUT blocks. | ✅ Complete |
| **2** | **Functionality & Features** | **25** | Complete end-to-end ticket lifecycle: Multi-modal reporting $\rightarrow$ Duplicate warning $\rightarrow$ Smart priority engine $\rightarrow$ Technician dispatch $\rightarrow$ Before/After photo proof verification. | ✅ Complete |
| **3** | **UI/UX & Usability** | **20** | Modern dark-mode mobile UI, bottom navigation bar, toggleable smartphone chassis, high-contrast badges, and 1-Click Fast Evaluator logins. | ✅ Complete |
| **4** | **Innovation & Futuristic Potential** | **20** | Continuous 1-second GPS telematics logging to MongoDB Atlas, spatial duplicate clustering advisory, QR room autofill, and voice dictation. | ✅ Complete |
| **5** | **Performance & Reliability** | **10** | Cloudinary CDN auto-compression, sub-5-second Vite production build, TTL index log expiration, and graceful GPS/camera fallbacks. | ✅ Complete |
| **6** | **Demonstration** | **10** | Zero-friction 15-minute live jury presentation flow with pre-seeded campus records and 1-click role switcher. | ✅ Complete |
| | **TOTAL** | **100** | **Comprehensive Full-Stack Mobile & Web Solution** | 🏆 Ready |

---

## 📝 General Competition Guidelines

> [!IMPORTANT]
> * **Individual Participation:** All development and live presentation is performed individually.
> * **Bring Your Own Hardware:** Participants use their own development machines, local servers, and presentation accessories.
> * **Working Prototype Required:** The application must have a clear purpose and demonstrable working functionality.
> * **Evaluation on Working Code:** The jury will evaluate the actual demonstrated implementation and live execution, not only theoretical slides or mockups.

---

## ✅ Feature Implementation Checklist

### 🎓 Student Experience
- [x] Multi-modal issue reporting (Camera photo upload, video clips, GPS coordinates)
- [x] Room QR scanner modal for instant building, room, and zone autofill
- [x] Web Speech API AI voice assistant dictation
- [x] Spatial duplicate detection warning banner (50-meter radius)
- [x] Community upvoting system with instant priority score boost
- [x] Real-time SLA progress tracker with before & after photographic verification
- [x] Dynamic institute registration with live academic branch dropdown synchronization

### 🛠️ Field Maintenance Crew Portal
- [x] Priority-ranked work order dispatch queue
- [x] Continuous 1-second on-duty GPS patrol telematics transmission to MongoDB Atlas
- [x] One-tap status advance (*Submitted* $\rightarrow$ *In Progress* $\rightarrow$ *Resolved*)
- [x] Photo/video completion proof upload modal with resolution notes

### 🛡️ Campus Administrator Command Center
- [x] Real-time executive KPI metrics (Resolution Rate, Critical Backlog, Active Staff)
- [x] Live interactive campus radar map (Leaflet) with technician patrol markers
- [x] Technician dispatch, re-assignment, and duplicate ticket merging
- [x] User directory and role elevation (*Student* $\leftrightarrow$ *Staff* $\leftrightarrow$ *Admin*)
- [x] Campus zones and geofencing perimeter editor
- [x] Campus academic branches & streams registry console
- [x] Campus header title and subtitle branding customization
- [x] 1-Click comprehensive CSV export for administrative audits

### 👑 Super Administrator Apex Directorate
- [x] Central campus administrator onboarding, management, and credential reset
- [x] Multi-campus tenancy and institute registry
- [x] Global platform header governance (`/api/settings/global-header`)
- [x] Standardized facility category taxonomy & SLA target configuration
- [x] Responsive 4-column desktop to mobile stacked KPI grid

### 🔔 Notifications & Security
- [x] Strict institute-level boundary isolation (no cross-campus alert leaks)
- [x] Impersonal passive voice formatting across all broadcast feeds
- [x] Personal recipient dispatch routing (`targetRole: 'personal'`)
- [x] 7-day HMAC-SHA256 JWT session management
- [x] 1-Click Fast Evaluator login buttons for jury demonstration
