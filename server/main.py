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
load_dotenv(_repo_root / ".env", override=True)
load_dotenv(_server_dir / ".env", override=True)

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import clinics, appointments, users, benefits, health as health_route, calendar, pdf as pdf_route
from routes import ai as ai_route


app = FastAPI(title="NexaCare API", version="1.0.0")

_raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174",
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]
LOCAL_DEV_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=LOCAL_DEV_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "service": "NexaCare API"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


app.include_router(clinics.router,       prefix="/api/clinics")
app.include_router(appointments.router,  prefix="/api/appointments")
app.include_router(users.router,         prefix="/api/users")
app.include_router(benefits.router,      prefix="/api/benefits")
app.include_router(health_route.router,  prefix="/api/health-profile")
app.include_router(calendar.router,      prefix="/api/calendar")
app.include_router(pdf_route.router,     prefix="/api/pdf")
app.include_router(ai_route.router,      prefix="/api/ai")
