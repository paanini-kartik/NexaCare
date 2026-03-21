from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_admin import auth
from firebase import db

router = APIRouter()

class SignUpRequest(BaseModel):
    email: str
    password: str
    name: str
    age: int
    occupation: str

class LoginRequest(BaseModel):
    email: str
    idToken: str

@router.post("/signup")
def signup(data: SignUpRequest):
    try:
        user = auth.create_user(
            email=data.email,
            password=data.password,
            display_name=data.name
        )
        db.collection("users").document(user.uid).set({
            "name": data.name,
            "age": data.age,
            "occupation": data.occupation,
            "email": data.email,
            "benefits": {
                "dental": { "total": 1500, "used": 0 },
                "vision": { "total": 600, "used": 0 },
                "physio": { "total": 900, "used": 0 }
            }
        })
        db.collection("health").document(user.uid).set({
            "medicalHistory": [],
            "allergies": [],
            "favouriteClinics": [],
            "calendarProvider": None
        })
        return {
            "success": True,
            "uid": user.uid,
            "name": data.name,
            "age": data.age,
            "occupation": data.occupation
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login(data: LoginRequest):
    try:
        decoded = auth.verify_id_token(data.idToken)
        return {
            "success": True,
            "uid": decoded["uid"]
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))