# Feature Completion Matrix — DASIG Portal
**Course:** IT411 Capstone & Research 2 | CIT-University  
**Team Code:** `2627-sem1-it411-40` | Group 40 (Section G6)  
**System:** Digital Alliance for Sustainable Innovation and Growth (DASIG) Portal  
**Live Frontend:** [https://dasig-portal.vercel.app](https://dasig-portal.vercel.app)  
**Live API:** [https://dasig-portal.onrender.com/api](https://dasig-portal.onrender.com/api)  
**Evaluation Date:** October 2026

---

## 1. Overview of Modules and Completion Status

| Module | Core Functionality | Public / Guest | Member | Admin | Completion Status | Known Constraints / Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Authentication & Role-Based Access (RBAC)** | Registration, JWT login, profile editing, password changing, session persistence | Read / Register | Full Profile | Full Control | **100% Complete** | Token lifespan: 24h (Admin), 7d (Member). Passwords hashed using bcryptjs (salt 10). |
| **Haribon AI Trilingual Chatbot** | Hybrid NLP engine, fuzzy matching, language detection (EN / CEB / TGL), voice narration | ✅ | ✅ | ✅ | **100% Complete** | Offline synthesis fallback ensures answers even if backend network is interrupted. |
| **Events & Summits** | FullCalendar view, event RSVP, QR code pass generation, capacity enforcement | View / RSVP Pass | Fast RSVP Pass | Create, Edit, Attendance Scanner | **100% Complete** | Enforces maximum attendee limits; prevents duplicate registration per user. |
| **Faculty Development & Training** | Multi-week course listings, syllabus breakdown, self-enrollment | View Only | Enroll | Manage Courses & Enrollees | **100% Complete** | Dynamic enrollment cap validation. |
| **Institutional Member Directory** | Partner institution profiles (CIT-U, UPV, USA, DOST-7, DICT-7, DTI-7, DepEd-7) | View Roster | View Roster | Edit Institution Data | **100% Complete** | Data backed by PostgreSQL table `members` with Row-Level Security (RLS). |
| **Consortium Governance Policies** | Searchable statutory policies, RA 10173 data privacy rules, IP accord, charter PDFs | Public Charters | Full Documents | Upload / Archive | **100% Complete** | Searchable by title, category, and keyword. |
| **Strategic Partnerships & Funding** | DOST-7 GIA grants, SETUP funding calls, industry linkages | View Grants | Apply / Link | Post Grants / Review | **100% Complete** | Lists active funding calls and institutional partnership tiers. |
| **Executive Admin Command Center** | Real-time node telemetry, quick jump (`Ctrl+K`), member applications, analytics | ❌ | ❌ | Full Access | **100% Complete** | Real-time database round-trip telemetry via `/api/health`. Responsive mobile drawer for phone access. |
| **Contact & Inquiries** | Public feedback form, administrative message queue, read/unread states | Send Inquiry | Send Inquiry | Triage / Reply | **100% Complete** | Stores messages in PostgreSQL with status tracking. |

---

## 2. Detailed Feature Breakdown & Acceptance Verification

### Module 1: Authentication & Authorization
* **F-AUTH-01: Public Guest Registration**
  * *Status:* Implemented & Verified.
  * *Description:* Visitors can register an account with name, email, institution, and secure password.
  * *Acceptance:* Successful registration stores user in Supabase with role `GUEST`.
* **F-AUTH-02: Role-Based Access Control (RBAC)**
  * *Status:* Implemented & Verified.
  * *Description:* JWT middleware validates roles (`GUEST`, `MEMBER`, `ADMIN`) before allowing access to restricted endpoints.
  * *Acceptance:* Guests attempting to access `/admin` or `/policies` are redirected or blocked with HTTP 403.
* **F-AUTH-03: Profile and Security Management**
  * *Status:* Implemented & Verified.
  * *Description:* Users can update avatars, phone numbers, and change passwords.
  * *Acceptance:* Passwords re-hashed; sessions updated immediately.

### Module 2: Haribon AI Trilingual Assistant
* **F-AI-01: Language Detection & Trilingual Processing**
  * *Status:* Implemented & Verified.
  * *Description:* Automatic detection of English, Bisaya/Cebuano, and Tagalog/Filipino query markers.
  * *Acceptance:* Answering "what is dasig" in English, "unsa ang dasig" in Bisaya, or "ano ang dasig" in Tagalog responds in the corresponding language.
* **F-AI-02: Intent Matching Engine**
  * *Status:* Implemented & Verified.
  * *Description:* Weighted scoring in `intentMatcher.js` matching queries against 25+ domain categories without crashing on unhandled inputs.
  * *Acceptance:* Achieved 0% error rate across concurrent performance test runs.
* **F-AI-03: In-Chat Navigation & Action Chips**
  * *Status:* Implemented & Verified.
  * *Description:* Bot replies include deep links to relevant portal pages and follow-up suggestion chips.

### Module 3: Events & Summits Management
* **F-EVT-01: Interactive Calendar View**
  * *Status:* Implemented & Verified.
  * *Description:* FullCalendar grid displaying regional conferences, hackathons, and symposiums.
* **F-EVT-02: Instant RSVP & Digital QR Admission Pass**
  * *Status:* Implemented & Verified.
  * *Description:* Generates a unique QR pass per registration.
* **F-EVT-03: Administrator QR Attendance Verification**
  * *Status:* Implemented & Verified.
  * *Description:* Admins can scan or check in attendees, toggling real-time attendance status.

### Module 4: Administrative Command Center
* **F-ADM-01: Real-Time Regional Node Telemetry**
  * *Status:* Implemented & Verified.
  * *Description:* Dynamic `/api/health` probe measuring round-trip PostgreSQL latency and system uptime.
* **F-ADM-02: Command Palette & Mobile Drawer**
  * *Status:* Implemented & Verified.
  * *Description:* Fast keyboard navigation (`Ctrl+K` / `Cmd+K`) and responsive slide-out drawer on smartphone viewports.
* **F-ADM-03: Chatbot Accuracy & Usage Reporting**
  * *Status:* Implemented & Verified.
  * *Description:* Real-time analytics reporting total conversations, query volume, and intent distribution over custom date ranges.

---

## 3. Known Limitations & Future Roadmap

1. **Email SMTP Rate Limits:** On free SMTP tiers (e.g., standard Gmail/Brevo), bulk registration confirmation emails may queue if exceeding 100 emails/hour. Production deployments recommend dedicated SendGrid/Postmark relays.
2. **Cold Starts on Render Free Tier:** The backend API on Render spins down when inactive for 15 minutes. The initial health check may take up to 45 seconds to wake up the service.
3. **Speech Synthesis Browser Dependency:** The client-side voice reading feature relies on the Web Speech API; voice timbre varies depending on the client device's installed OS voices.

