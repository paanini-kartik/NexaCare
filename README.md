# NexaCare

Personal health management app — track benefits, book appointments, find nearby clinics, get AI-powered health recommendations.

## Folders

| Folder | Owner | What lives here |
|--------|-------|-----------------|
| `/client` | P1 — Frontend | All screens + components |
| `/server` | P2 — Backend | **Clinics API** (Python/FastAPI); user/benefit data is in Firestore via the client |
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

### Server (P2) — clinics proxy
```bash
cd server
pip install fastapi uvicorn python-dotenv
uvicorn main:app --reload --port 8000
```
The React app proxies `/api/*` to this port (`VITE_API_PROXY_TARGET`, default `http://localhost:8000`). See `server/README.md`.

### AI (P4)
```bash
cd ai
npm install
npm run dev
```

## Environment variables

See `.env.example` — fill in real values locally, never commit them.

```
GOOGLE_MAPS_API_KEY=     # for /api/clinics (P2 Python server)
ANTHROPIC_API_KEY=       # for chat + recommendations (P4)
# Firebase / Firestore: configured in client (.env) for auth + user/session/family data
```

## API routes (Python server)

Base when using Vite dev: same origin (`/api/...` proxied to `localhost:8000`).

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Liveness |
| GET | `/api/clinics?lat=&lng=&type=` | Nearby clinics (Google Places / fallback mocks) |

User profile, benefits, family sharing, and session state are **not** on this server — they are stored in **Firestore** from the React app.

## Component contracts

**`<HealthCompass />`** — exported by P3, dropped into P1's Health Compass page
**`<ChatWidget userId={id} />`** — exported by P4, dropped into P1's dashboard

See `CLAUDE.md` for full data shapes, mock data, AI prompts, and the 24h timeline.
