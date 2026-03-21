from fastapi import APIRouter

router = APIRouter()

@router.get("/{user_id}")
def get_benefits(user_id: str):
    return {
        
        # Placeholder values
        
        "dental": { "total": 1500, "used": 400 },
        "vision": { "total": 600, "used": 0 },
        "physio": { "total": 900, "used": 200 }
    }