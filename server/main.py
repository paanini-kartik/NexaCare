from fastapi import FastAPI
from routes import clinics

app = FastAPI()

app.include_router(clinics.router, prefix="/api/clinics")