"""
NexaCare Python API — clinics proxy only.

User profiles, benefits, family/session meta, and auth are handled in the React app
via Firebase Auth + Firestore (client SDK). This service keeps Google Places / Maps
API keys off the browser and exposes `/api/clinics`.
"""

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

from routes import clinics

_server_dir = Path(__file__).resolve().parent
_repo_root = _server_dir.parent

# Repo-root `.env` (e.g. NexaCare/.env), then `server/.env` (overrides). CWD no longer matters for uvicorn.
load_dotenv(_repo_root / ".env")
load_dotenv(_server_dir / ".env", override=True)

app = FastAPI(title="NexaCare API", version="1.0.0")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


app.include_router(clinics.router, prefix="/api/clinics")
