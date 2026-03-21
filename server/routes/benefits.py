from fastapi import APIRouter, HTTPException
from firebase import db

router = APIRouter()

@router.get("/{user_id}")
def get_benefits(user_id: str):
    try:
        doc = db.collection("users").document(user_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        user = doc.to_dict()
        return user["benefits"]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))