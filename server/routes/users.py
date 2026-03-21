from fastapi import APIRouter

router = APIRouter()

@router.get("/{user_id}")
def get_user(user_id: str):
    return {
        
        # Placeholder user
        
        "id": user_id,
        "name": "Alex",
        "age": 34,
        "occupation": "Software Developer",
        "location": {
            "lat": 43.6532,
            "lng": -79.3832
        },
        "benefits": {
            "dental": { "total": 1500, "used": 400 },
            "vision": { "total": 600, "used": 0 },
            "physio": { "total": 900, "used": 200 }
        }
    }