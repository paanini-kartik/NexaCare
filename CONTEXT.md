# NexaCare — Full Project Context
> Auto-generated memory file for AI tools. Last updated: March 22, 2026.
> Owner: Nicolas Miranda Cantanhede (Person 4 — AI/Chatbot layer + integration support)

---

## 1. What This Project Is

A personal health management app built in 24 hours for a hackathon. 4-person team.

**Live demo user:** Alex Chen, 34, Software Developer, Toronto ON
**Three must-work features:** Dashboard + appointments · Benefits tracker · Health Compass (map)

---

## 2. Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite, React Router, Lucide React icons, react-markdown + remark-gfm |
| Backend | FastAPI (Python 3.13) + Uvicorn, Firebase Admin SDK |
| Database | Firebase Firestore |
| Auth | Firebase Auth (client-side SDK) |
| AI | Anthropic Claude API (`claude-haiku-4-5-20251001`) with tool use |
| Email | Resend API (free plan — yahoo addresses only) |
| Maps | Google Maps API (teammate P3 owns) |
| PDF parsing | pypdf 6.7.0 (backend) |
| Calendar | Google OAuth2 (`google-auth-oauthlib`, `google-api-python-client`) |

---

## 3. Running the Project

```bash
# Frontend (port 5173)
cd /Users/nicol/Desktop/NexaCare/client
npm run dev

# Backend (port 8000)
cd /Users/nicol/Desktop/NexaCare/server
python3 -m uvicorn main:app --reload --port 8000

# Integration test
cd /Users/nicol/Desktop/NexaCare
node scripts/test-integration.mjs
```

**Env file:** `/Users/nicol/Desktop/NexaCare/.env`
```
GOOGLE_MAPS_API_KEY=...
RESEND_API_KEY=...
DEMO_USER_EMAIL=nicolas220208@yahoo.com
DEMO_CLINIC_EMAIL=nicolas220208@yahoo.com
FROM_EMAIL=onboarding@resend.dev
VITE_ANTHROPIC_API_KEY=...         # in client/.env
# Pending from teammate:
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## 4. Repository Structure

```
/Users/nicol/Desktop/NexaCare/
├── client/                          ← React frontend (Person 1 + Nicolas)
│   └── src/
│       ├── components/
│       │   ├── ChatbotWidget.jsx    ← Main AI chat component (Nicolas owns)
│       │   ├── CheckupDashboardSection.jsx
│       │   └── HealthCompass/       ← Map component (Person 3 owns)
│       ├── pages/
│       │   ├── DashboardPage.jsx    ← Dashboard (fully rebuilt)
│       │   ├── BenefitsPage.jsx
│       │   ├── HealthCompassPage.jsx
│       │   ├── SettingsPage.jsx     ← Has Google Calendar integration tab
│       │   ├── EmergencyPage.jsx
│       │   └── HealthProfilePage.jsx
│       ├── contexts/
│       │   └── AuthContext.jsx      ← Firebase auth + effectiveInsurers
│       ├── data/
│       │   └── mockData.js          ← onboardingSlides, quickActions, clinicLocations
│       └── index.css                ← All styles (2700+ lines)
├── server/                          ← FastAPI backend
│   ├── main.py                      ← App entry point + router registration
│   └── routes/
│       ├── appointments.py          ← CRUD + email confirmation + calendar auto-add
│       ├── benefits.py
│       ├── calendar.py              ← Google Calendar OAuth2 flow
│       ├── clinics.py               ← Google Maps Nearby Search proxy
│       ├── health.py
│       ├── pdf.py                   ← PDF text extraction via pypdf
│       └── users.py
├── scripts/
│   └── test-integration.mjs         ← 10/10 integration tests (all passing)
├── mock-insurance-doc.html          ← Open in browser → print to PDF for testing
├── CLAUDE.md                        ← Project instructions for Claude Code
└── CONTEXT.md                       ← This file
```

---

## 5. API Routes

Base URL: `http://localhost:8000`

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/clinics?lat=&lng=&type=` | Nearby clinics (Google Maps proxy) |
| GET | `/api/appointments/:email` | All appointments for user |
| POST | `/api/appointments` | Book new appointment (+ email confirmation) |
| DELETE | `/api/appointments/:id` | Cancel appointment |
| GET | `/api/users/:email` | User profile |
| GET | `/api/benefits/:email` | Benefit balances |
| GET | `/api/health-profile/:email` | Health profile data |
| POST | `/api/pdf/extract-text` | Extract text from uploaded PDF (multipart) |
| GET | `/api/calendar/status` | Google Calendar connection status |
| GET | `/api/calendar/auth-url` | Get OAuth URL to redirect user |
| GET | `/api/calendar/callback` | OAuth callback → redirects to `/settings?calendar=connected` |
| POST | `/api/calendar/add-event` | Add event to user's Google Calendar |
| DELETE | `/api/calendar/disconnect` | Disconnect calendar |

---

## 6. ChatbotWidget.jsx — Full Feature List

**File:** `/Users/nicol/Desktop/NexaCare/client/src/components/ChatbotWidget.jsx`

### AI Tools (Claude tool_use)
| Tool | What it does |
|---|---|
| `get_user_profile` | Returns name, age, occupation from AuthContext |
| `get_benefits` | Returns dental/vision/physio balances |
| `get_appointments` | Returns upcoming + past appointments from backend |
| `book_appointment` | POST to backend, sends email confirmation |
| `find_clinics` | GET from backend clinics API |
| `update_benefit_usage` | Updates used amount in Firestore |
| `add_benefit_provider` | Adds insurance provider + categories to Firestore |
| `remove_benefit_provider` | Removes provider (with undo snapshot) |
| `add_medical_event` | Logs medical event to profile |
| `remove_medical_event` | Removes medical event (with undo snapshot) |
| `add_favorite_clinic` | Saves clinic to favorites |
| `remove_favorite_clinic` | Removes clinic from favorites (with undo snapshot) |
| `add_allergy` | Adds allergy to profile |
| `remove_allergy` | Removes allergy (with undo snapshot) |
| `restore_last_action` | Undo last destructive action from snapshot stack |
| `add_to_calendar` | POST to `/api/calendar/add-event` |

### File Upload
- **Images:** Base64 encoded → sent to Claude Vision API for health photo analysis
- **PDFs:** POSTed to `/api/pdf/extract-text` (backend pypdf) → text sent to Claude as insurance parser prompt
- **Drag & drop:** Supported on the chat panel
- **Image preview:** Shown inline in chat bubble with lightbox on click

### Chat History
- Persisted in `localStorage` keyed by `nexacare:history:{email}`
- Loaded once Firebase auth resolves (guarded by `historyLoaded` state)
- History drawer: Clock icon shows past sessions, Plus starts new chat

### Rich Response Rendering
Claude responses use HTML comment tags parsed by `parseRichReply()`:
```
<!--URGENCY:high-->
<!--BENEFIT_CARD:{"type":"dental","used":400,"total":1500}-->
<!--APPOINTMENT:{"type":"Checkup","clinic":"Smile Dental","date":"2026-04-02"}-->
<!--CLINICS:[{"name":"...","type":"dental"}]-->
<!--ACTIONS:[{"label":"Book Now","action":"book"},{"label":"View Benefits","route":"/benefits"}]-->
```

### Smart Action Buttons
After every response, Claude emits `<!--ACTIONS:[...]-->` with contextual buttons rendered below the message.

### Lucide Icons used
`Activity, AlertTriangle, Calendar, CheckCircle, Clock, Eye, Maximize2, MessageCircle, Minimize2, Paperclip, Pill, Plus, Stethoscope, X, Zap`

### System Prompt
Claude is injected with:
- User name, age, occupation
- Dental/vision/physio benefit balances (used / total / remaining)
- Upcoming appointments (type + date)
- Past appointments (type + date)
- Instructions to use STRUCTURED RESPONSE TAGS and emit SMART ACTIONS

---

## 7. DashboardPage.jsx — Components

**File:** `/Users/nicol/Desktop/NexaCare/client/src/pages/DashboardPage.jsx`

| Component | Description |
|---|---|
| Hero | Time-based greeting ("Good morning/afternoon/evening, {firstName}"), next appointment context line |
| `StatsBar` | 3 metrics: next appt date · total benefits remaining · appointments this month |
| `MemberBenefitsSummaryCard` | Visual progress bars (dental/vision/physio) from `effectiveInsurers`, color thresholds: >80% red, >50% amber, else green |
| `EmployerProgramSummaryCard` | Employer view: total annual limits by benefit line across job roles |
| `OnboardingRibbon` | Setup steps with checkmarks, navigates to relevant pages |
| `QuickActionsVivid` | 6-tile grid: Book Appointment, View Benefits, Emergency, Update Profile, Upload Insurance PDF, Find Nearby Clinic |
| `UpcomingAppointments` | Fetches real data from backend, date-block cards, cancel button (calls DELETE endpoint) |
| `AIRecommendations` | Calls Anthropic API on mount, cached in `sessionStorage` per day per user email, shows 3 recommendation cards with urgency badges (red/amber/green) |

### Data Sources
- Appointments: `GET http://localhost:8000/api/appointments/:email`
- Benefits: Derived from `effectiveInsurers` (AuthContext) → `effectiveInsurers.flatMap(i => i.categories)`
- AI Recommendations: Direct Anthropic API call using `VITE_ANTHROPIC_API_KEY`

---

## 8. SettingsPage.jsx — Integrations Tab

**File:** `/Users/nicol/Desktop/NexaCare/client/src/pages/SettingsPage.jsx`

- "Integrations" tab with Google Calendar connect/disconnect UI
- Reads `?calendar=connected|error` query param on OAuth redirect back
- Polls `/api/calendar/status` for live connection status
- `connectCalendar()` → fetches auth URL → redirects browser
- `disconnectCalendar()` → DELETE to backend

---

## 9. Google Calendar Integration

**Status:** Code complete, waiting on GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET from teammate (P2).

**Backend file:** `/Users/nicol/Desktop/NexaCare/server/routes/calendar.py`
- Graceful no-op when env vars not set (returns 503, doesn't crash server)
- Tokens stored in Firestore `calendar_tokens` collection
- OAuth callback redirects to `http://localhost:5173/settings?calendar=connected`

**Teammate steps to get keys:**
1. Go to console.cloud.google.com → same project as Google Maps
2. APIs & Services → Enable "Google Calendar API"
3. OAuth consent screen → External → add test user email
4. Credentials → Create OAuth 2.0 Client ID → Web application
5. Authorized redirect URIs: `http://localhost:8000/api/calendar/callback`
6. Add `GOOGLE_CLIENT_ID=` and `GOOGLE_CLIENT_SECRET=` to `.env`

---

## 10. PDF Parsing

**How it works:**
1. User uploads PDF via paperclip or drag & drop in chat
2. Frontend POSTs file to `http://localhost:8000/api/pdf/extract-text` (multipart)
3. Backend uses `pypdf` to extract text, returns `{ text, pages }`
4. Frontend sends text to Claude with insurance parser prompt
5. Claude calls `add_benefit_provider` to save data to Firestore
6. Claude summarizes what it found

**Note:** pdfjs-dist v5 was removed from the frontend — it crashed in Vite due to worker URL changes in v5. pypdf on the backend is the stable solution.

**Test file:** `/Users/nicol/Desktop/insurance-statement.pdf` (BlueCross mock, 1 page)
Also: Open `mock-insurance-doc.html` in browser → Cmd+P → Save as PDF for a richer version.

---

## 11. Data Shapes (agreed by all teammates — do not change)

```ts
User {
  id: string; name: string; age: number; occupation: string;
  location: { lat: number; lng: number };
  benefits: {
    dental:  { total: number; used: number };
    vision:  { total: number; used: number };
    physio:  { total: number; used: number };
  }
}

Appointment {
  id: string; type: string; clinicName: string;
  date: string;        // ISO 8601
  duration: number;    // minutes
  status: "upcoming" | "past";
}

Clinic {
  id: string; name: string;
  type: "hospital" | "dental" | "pharmacy" | "optometry";
  lat: number; lng: number;
  acceptedBenefits: Array<"dental" | "vision" | "physio">;
}

AIRecommendation {
  type: string;                          // e.g. "Eye exam"
  reason: string;                        // one sentence
  urgency: "low" | "medium" | "high";
}
```

---

## 12. Demo User Data

```json
{
  "id": "user_demo_01",
  "name": "Alex Chen",
  "email": "nicolas220208@yahoo.com",
  "age": 34,
  "occupation": "Software Developer",
  "location": { "lat": 43.6532, "lng": -79.3832 },
  "benefits": {
    "dental":  { "total": 1500, "used": 400 },
    "vision":  { "total": 600,  "used": 0 },
    "physio":  { "total": 900,  "used": 200 }
  }
}
```

Demo appointments:
- Apr 2 2026 — Annual Dental Checkup @ Smile Dental Studio (upcoming)
- Apr 10 2026 — Physiotherapy Session @ ActiveCare Physio (upcoming)
- Apr 18 2026 — General Checkup @ Bayview Family Medicine (upcoming)
- Dec 15 2025 — Vision Test @ ClearView Optometry (past)
- Oct 3 2025 — Dental Cleaning @ Smile Dental Studio (past)

---

## 13. CSS Architecture

**File:** `/Users/nicol/Desktop/NexaCare/client/src/index.css` (~2700 lines)

Key CSS variable tokens:
```css
--primary: #059669        /* green */
--primary-dark: #047857
--secondary: #0369a1      /* blue */
--bg: #f1f5f9             /* page background */
--bg-elevated: #ffffff    /* cards */
--title: #0f172a          /* headings */
--body: #64748b           /* body text */
--border: #e2e8f0
--radius: 0               /* square corners everywhere */
```

Key class namespaces:
- `dash-*` — Dashboard components
- `chat-*` — ChatbotWidget UI
- `wallet-*` — Benefits cards
- `action-vibe-*` — Quick action tiles
- `step-chip-*` — Onboarding steps
- `landing-*` — Landing page sections
- `page-hero` — Page header blocks

---

## 14. Known Issues / Pending

| Item | Status |
|---|---|
| Google Calendar keys | Waiting on teammate (P2) to generate OAuth credentials |
| pdfjs-dist | Removed from frontend — backend pypdf used instead |
| Bundle size warning | `index-DldH--LN.js` is 1.7MB — not a blocker for demo |
| Upload Insurance PDF quick action | `onClick: () => {}` is a no-op (needs to open file picker) |
| Appointment cancel | Does `window.location.reload()` — could be a state update instead |

---

## 15. Git

**Remote:** `https://github.com/paanini-kartik/NexaCare.git`
**Branch:** `main` (everyone pushes directly)
**Latest commit:** `81c33f3` — fix(pdf): move PDF extraction to backend using pypdf

Commit history highlights:
- `feat(dashboard)` — full UI overhaul (stats bar, benefit bars, real appts, AI recs)
- `fix(chat)` — PDF upload pdfjs → backend pypdf
- `fix(chat)` — chat history load timing (Firebase auth guard)
- `feat(calendar)` — Google Calendar OAuth2 integration
- `feat(chat)` — image upload, drag & drop, rich responses, Lucide icons
- `feat(chat)` — undo stack, restore_last_action tool

---

## 16. Integration Test Results

**Script:** `scripts/test-integration.mjs`
**Status:** 10/10 passing

Tests cover: backend health · clinics API · appointment list · appointment create · appointment delete · user profile · benefits · health profile · PDF extract endpoint
