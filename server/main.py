import firebase

from fastapi import FastAPI
from routes import users, appointments, clinics, benefits, auth, health
from dotenv import load_dotenv
from pathlib import Path

# Load from root NexaCare/.env first, then fall back to server/.env
load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv()

app = FastAPI()

app.include_router(auth.router, prefix="/api/auth")
app.include_router(users.router, prefix="/api/users")
app.include_router(appointments.router, prefix="/api/appointments")
app.include_router(clinics.router, prefix="/api/clinics")
app.include_router(benefits.router, prefix="/api/benefits")
app.include_router(health.router, prefix="/api/health")