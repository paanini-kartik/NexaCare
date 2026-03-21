import firebase

from fastapi import FastAPI
from routes import users, appointments, clinics, benefits

app = FastAPI()

from routes import auth
app.include_router(auth.router, prefix="/api/auth")

app.include_router(users.router, prefix="/api/users")
app.include_router(appointments.router, prefix="/api/appointments")
app.include_router(clinics.router, prefix="/api/clinics")
app.include_router(benefits.router, prefix="/api/benefits")