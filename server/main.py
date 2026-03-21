from fastapi import FastAPI
from routes import clinics
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.include_router(clinics.router, prefix="/api/clinics")