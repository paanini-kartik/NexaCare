from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase import db

router = APIRouter()

@router.get("/{user_id}")
def get_appointments(user_id: str):
    try:
        appointments = db.collection("appointments").where("userId", "==", user_id).stream()
        return [{"id": a.id, **a.to_dict()} for a in appointments]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/")
def create_appointment(appointment: dict):
    try:
        doc = db.collection("appointments").add(appointment)
        return { "success": True, "id": doc[1].id }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))