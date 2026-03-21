from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from firebase import db

router = APIRouter()

class MedicalEvent(BaseModel):
    date: str
    title: str
    notes: Optional[str] = None

class Allergy(BaseModel):
    name: str
    severity: str

class FavouriteClinic(BaseModel):
    name: str
    type: str

class HealthProfile(BaseModel):
    medicalHistory: Optional[List[MedicalEvent]] = []
    allergies: Optional[List[Allergy]] = []
    favouriteClinics: Optional[List[FavouriteClinic]] = []
    calendarProvider: Optional[str] = None

@router.get("/{user_id}")
def get_health(user_id: str):
    try:
        doc = db.collection("health").document(user_id).get()
        if not doc.exists:
            return {
                "medicalHistory": [],
                "allergies": [],
                "favouriteClinics": [],
                "calendarProvider": None
            }
        return doc.to_dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{user_id}")
def update_health(user_id: str, data: HealthProfile):
    try:
        db.collection("health").document(user_id).set(data.dict())
        return { "success": True }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))