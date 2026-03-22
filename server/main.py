"""
NexaCare Python API — clinics proxy only.

User profiles, benefits, family/session meta, and auth are handled in the React app
via Firebase Auth + Firestore (client SDK). This service keeps Google Places / Maps
API keys off the browser and exposes `/api/clinics`.
"""

from dotenv import load_dotenv
from fastapi import FastAPI

from routes import clinics

# Load from root NexaCare/.env first, then fall back to server/.env
load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv()

app = FastAPI(title="NexaCare API", version="1.0.0")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


app.include_router(clinics.router, prefix="/api/clinics")
