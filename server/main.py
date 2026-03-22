"""
NexaCare Python API.

Handles clinics proxy (Google Maps) and appointment booking (Firebase + Resend emails).
User profiles, benefits, auth handled client-side via Firebase SDK.
"""

from pathlib import Path
from dotenv import load_dotenv

_server_dir = Path(__file__).resolve().parent
_repo_root = _server_dir.parent

# Load env FIRST before any other imports read os.getenv()
load_dotenv(_repo_root / ".env")
load_dotenv(_server_dir / ".env", override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import clinics, appointments, users, benefits, health as health_route, calendar


app = FastAPI(title="NexaCare API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


app.include_router(clinics.router,       prefix="/api/clinics")
app.include_router(appointments.router,  prefix="/api/appointments")
app.include_router(users.router,         prefix="/api/users")
app.include_router(benefits.router,      prefix="/api/benefits")
app.include_router(health_route.router,  prefix="/api/health-profile")
app.include_router(calendar.router,      prefix="/api/calendar")
