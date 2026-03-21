# NexaCare

Personal health management app — track benefits, book appointments, find nearby clinics, get AI-powered health recommendations.

## Folders

| Folder | Owner | What lives here |
|--------|-------|-----------------|
| `/client` | P1 — Frontend | All screens + components |
| `/server` | P2 — Backend | API routes, auth, DB |
| `/ai` | P4 — AI | Chat widget, recommendation engine |

P3 (Maps) works inside `/client/components/HealthCompass`.

## Running locally

### Prerequisites
- Node.js 18+
- Copy `.env.example` → `.env` and fill in your API keys

### Client (P1)
```bash
cd client
npm install
npm run dev
```

### Server (P2)
```bash
cd server
npm install
npm run dev
# runs on localhost:3001
```

### AI (P4)
```bash
cd ai
npm install
npm run dev
```

## Environment variables

See `.env.example` — fill in real values locally, never commit them.

```
GOOGLE_MAPS_API_KEY=     # for /api/clinics (P2)
ANTHROPIC_API_KEY=       # for chat + recommendations (P4)
DATABASE_URL=            # Supabase or Firebase (P2)
AUTH_SECRET=             # session signing (P2)
```

## API routes

Base: `http://localhost:3001`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/user/:id` | User profile + benefits |
| GET | `/api/appointments/:userId` | Upcoming + past appointments |
| GET | `/api/benefits/:userId` | Benefit breakdown |
| GET | `/api/clinics?lat=&lng=&type=` | Nearby clinics via Google Maps |
| POST | `/api/appointments` | Book new appointment |

## Component contracts

**`<HealthCompass />`** — exported by P3, dropped into P1's Health Compass page
**`<ChatWidget userId={id} />`** — exported by P4, dropped into P1's dashboard

See `CLAUDE.md` for full data shapes, mock data, AI prompts, and the 24h timeline.