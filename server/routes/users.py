from fastapi import APIRouter, HTTPException
from firebase import db

router = APIRouter()

@router.get("/{user_id}")
def get_user(user_id: str):
    try:
        doc = db.collection("users").document(user_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        user = doc.to_dict()
        user["id"] = user_id
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))