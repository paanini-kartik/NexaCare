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
        return user.get("benefits", {"dental": {"total": 0, "used": 0}, "vision": {"total": 0, "used": 0}, "physio": {"total": 0, "used": 0}})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))