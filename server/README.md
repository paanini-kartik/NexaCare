# NexaCare server (Python)

## Role

- **This service**: Proxies **nearby clinics** (`/api/clinics`) so Maps/Places keys stay server-side.
- **Not here**: User data, benefits, family groups, employer keys, and session metadata live in **Firestore**, read/written by the **React client** (`client/`) with the Firebase Web SDK.

Legacy modules under `routes/` (`users`, `benefits`, `auth`, `appointments`, `health`) and `firebase.py` are **not mounted** by `main.py`. They were alternate/duplicate paths; the app uses Firestore from the browser instead.

## Run locally

From repo root (with a virtualenv if you use one):

```bash
cd server
pip install fastapi uvicorn python-dotenv
uvicorn main:app --reload --port 8000
```

The Vite dev server proxies `/api/*` to `http://localhost:8000` by default. Override with:

`VITE_API_PROXY_TARGET=http://127.0.0.1:8000` in `client/.env`.

## Endpoints

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/health` | Liveness |
| GET | `/api/clinics` | Query params: `lat`, `lng`, `type` — see `routes/clinics.py` |

## Env

Clinics route uses `GOOGLE_MAPS_API_KEY` (or related) from the environment — see `routes/clinics.py` for exact variable names.
