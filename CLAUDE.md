# NexaCare — Hackathon Project

## What this project is

A personal health management app built by 4 people in 24 hours. It helps users track employer benefits, book appointments, find nearby clinics, and get AI-powered health recommendations. The three features that must work for the demo: Dashboard + appointments, Benefits tracker, Health Compass (map).

## Team structure

| Person | Role | Owns | Folder |
|--------|------|------|--------|
| P1 | Frontend | All screens + integration | `/client` |
| P2 | Backend | API routes + auth + DB | `/server` |
| P3 | Maps | Health Compass feature | `/client/components/HealthCompass` |
| P4 | AI / Chatbot | Chat widget + recommendations | `/ai` |

P1 is the integration point — they assemble everything. P3 and P4 export self-contained components that P1 drops in.

---

## Agreed data shapes — DO NOT change without telling the whole team

### User
```ts
{
  id: string
  name: string
  age: number
  occupation: string
  location: { lat: number, lng: number }
  benefits: {
    dental:  { total: number, used: number }
    vision:  { total: number, used: number }
    physio:  { total: number, used: number }
  }
}
```

### Appointment
```ts
{
  id: string
  type: string           // e.g. "Annual Dental Checkup"
  clinicName: string
  date: string           // ISO 8601
  duration: number       // minutes
  status: "upcoming" | "past"
}
```

### Clinic
```ts
{
  id: string
  name: string
  type: "hospital" | "dental" | "pharmacy" | "optometry"
  lat: number
  lng: number
  acceptedBenefits: Array<"dental" | "vision" | "physio">
}
```

### AI Recommendation (P4 → P1)
```ts
{
  type: string           // e.g. "Eye exam"
  reason: string         // one sentence
  urgency: "low" | "medium" | "high"
}
```

---

## Repo structure

```
/client                        ← P1 works here
  /components
    /HealthCompass             ← P3 exports <HealthCompass /> here
    /ChatWidget                ← P4 exports <ChatWidget /> here
  /mock
    user.json
    appointments.json
    clinics.json
/server                        ← P2 works here
/ai                            ← P4 works here
CLAUDE.md                      ← this file
README.md
.env.example
```

---

## API routes (P2 owns — post to group chat when each goes live)

Base URL: `localhost:3001`

| Route | Returns | Notes |
|-------|---------|-------|
| `GET /api/user/:id` | `User` | Full profile + benefits |
| `GET /api/appointments/:userId` | `Appointment[]` | Upcoming + past |
| `GET /api/benefits/:userId` | benefits object | Dental / vision / physio |
| `GET /api/clinics?lat=&lng=&type=` | `Clinic[]` | Proxies Google Maps Nearby Search |
| `POST /api/appointments` | `Appointment` | Stretch goal |

---

## Component contracts

### `<HealthCompass />` — P3 delivers, P1 drops in
- Full-screen map centered on user location
- Filtered pins by type (hospital / dental / pharmacy / optometry)
- Search bar + clinic info card on pin tap
- **No nav, headers, or page chrome inside the component**
- Fetches `/api/clinics` — uses mock until P2 route is live

### `<ChatWidget />` — P4 delivers, P1 drops in
- Accepts `userId` prop
- Scrollable message list + text input + send button
- Connects to Anthropic API with full conversation history
- System prompt injects user's age, benefits, appointment history
- **No page chrome inside the component**

---

## Mock data

### Demo user
```json
{
  "id": "user_demo_01",
  "name": "Alex Chen",
  "age": 34,
  "occupation": "Software Developer",
  "location": { "lat": 43.6532, "lng": -79.3832 },
  "benefits": {
    "dental":  { "total": 1500, "used": 400 },
    "vision":  { "total": 600,  "used": 0   },
    "physio":  { "total": 900,  "used": 200 }
  }
}
```

### Demo appointments
```json
[
  { "id": "apt_01", "type": "Annual Dental Checkup",  "clinicName": "Smile Dental Studio",    "date": "2026-04-02T10:00:00Z", "duration": 60,  "status": "upcoming" },
  { "id": "apt_02", "type": "Physiotherapy Session",  "clinicName": "ActiveCare Physio",       "date": "2026-04-10T14:30:00Z", "duration": 45,  "status": "upcoming" },
  { "id": "apt_03", "type": "General Checkup",        "clinicName": "Bayview Family Medicine", "date": "2026-04-18T09:00:00Z", "duration": 30,  "status": "upcoming" },
  { "id": "apt_04", "type": "Vision Test",            "clinicName": "ClearView Optometry",     "date": "2025-12-15T11:00:00Z", "duration": 45,  "status": "past"     },
  { "id": "apt_05", "type": "Dental Cleaning",        "clinicName": "Smile Dental Studio",     "date": "2025-10-03T10:00:00Z", "duration": 45,  "status": "past"     }
]
```

### Demo clinics
```json
[
  { "id": "c_01", "name": "Smile Dental Studio",   "type": "dental",    "lat": 43.6545, "lng": -79.3801, "acceptedBenefits": ["dental"] },
  { "id": "c_02", "name": "ClearView Optometry",   "type": "optometry", "lat": 43.6510, "lng": -79.3850, "acceptedBenefits": ["vision"] },
  { "id": "c_03", "name": "ActiveCare Physio",     "type": "hospital",  "lat": 43.6580, "lng": -79.3900, "acceptedBenefits": ["physio"] },
  { "id": "c_04", "name": "Rexall Pharmacy",       "type": "pharmacy",  "lat": 43.6490, "lng": -79.3820, "acceptedBenefits": [] },
  { "id": "c_05", "name": "Toronto General Hosp.", "type": "hospital",  "lat": 43.6590, "lng": -79.3870, "acceptedBenefits": ["dental", "vision", "physio"] },
  { "id": "c_06", "name": "Downtown Dental Care",  "type": "dental",    "lat": 43.6520, "lng": -79.3760, "acceptedBenefits": ["dental"] },
  { "id": "c_07", "name": "Shoppers Drug Mart",    "type": "pharmacy",  "lat": 43.6555, "lng": -79.3930, "acceptedBenefits": [] },
  { "id": "c_08", "name": "Bay Street Eye Care",   "type": "optometry", "lat": 43.6500, "lng": -79.3840, "acceptedBenefits": ["vision"] }
]
```

---

## AI system prompt (P4 owns)

```
You are a personal health assistant for [name], a [age]-year-old [occupation].

Their current benefits:
- Dental: $[used] used of $[total] ($[remaining] remaining)
- Vision: $[used] used of $[total] ($[remaining] remaining)
- Physiotherapy: $[used] used of $[total] ($[remaining] remaining)

Upcoming appointments: [list types and dates]
Past appointments: [list types and dates]
Location: [city]

Rules:
- Answer health and scheduling questions clearly and concisely
- Proactively mention when the user is overdue for a checkup
- Reference specific benefit balances when relevant
- Keep answers to 2–4 sentences unless asked for more
- Tone: friendly, direct, not clinical
```

### Recommendation engine prompt (separate call on dashboard load)
```
Based on this user profile:
- Age: [age], Occupation: [occupation]
- Last dental visit: [date or "never recorded"]
- Last eye exam: [date or "never recorded"]
- Last general checkup: [date or "never recorded"]
- Unused dental: $[amount], unused vision: $[amount]

What checkups should this user book soon?
Return ONLY a JSON array. Each item: { "type": string, "reason": string, "urgency": "low"|"medium"|"high" }
Return 2–3 recommendations maximum.
```

---

## Required API keys (.env — never commit real values)

```
GOOGLE_MAPS_API_KEY=
ANTHROPIC_API_KEY=
DATABASE_URL=
AUTH_SECRET=
```

---

## 24-hour timeline

| Hours | What |
|-------|------|
| 0–1   | All together: lock shapes, set up repo, assign roles, everyone runs locally |
| 1–8   | Parallel build. P2 posts each route to group chat when live. |
| 8–9   | Integration checkpoint: P1 drops in P3 + P4 components, fix mismatches |
| 9–18  | Polish, seed data, squash bugs. P2 helps whoever is blocked. |
| 18–22 | Full demo run-through. Fix anything a judge would notice. |
| 22–24 | Code freeze. Practice pitch. Sleep. |

---

## How it all connects

```
P4 (AI)      →  Recommendation[]  →  P1 "Suggested for You" cards
P4 (AI)      →  <ChatWidget />    →  P1 dashboard bottom bar
P3 (Maps)    →  <HealthCompass /> →  P1 Health Compass page
P2 (Backend) →  /api/clinics      →  P3 clinic pins
P2 (Backend) →  /api/user         →  P4 system prompt context
P2 (Backend) →  /api/*            →  P1 swaps mock imports for real calls
```

---

## Four screens P1 must build

1. **Onboarding** — 3 intro slides → account form → dashboard. Skip on subsequent logins.
2. **Dashboard** — greeting, appointment cards, "Suggested for You" AI section, `<ChatWidget />` fixed at bottom.
3. **Benefits Tracker** — Dental / Vision / Physio cards with progress bars. Green/yellow/red by remaining amount.
4. **Health Compass** — filter bar (All / Dental / Vision / Pharmacy / Hospital), `<HealthCompass />` component, search bar.
