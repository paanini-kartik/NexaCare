from fastapi import APIRouter

router = APIRouter()

@router.get("/{user_id}")
def get_appointments(user_id: str):
    return [
        
        # Placeholder appointments
        
        {
            "id": "a1",
            "type": "Annual Dental Checkup",
            "clinicName": "Downtown Dental",
            "date": "2026-04-05",
            "duration": 60,
            "status": "upcoming"
        },
        {
            "id": "a2",
            "type": "Eye Exam",
            "clinicName": "ClearVision Optometry",
            "date": "2026-04-12",
            "duration": 45,
            "status": "upcoming"
        },
        {
            "id": "a3",
            "type": "Physiotherapy Session",
            "clinicName": "ActiveCare Physio",
            "date": "2026-04-20",
            "duration": 30,
            "status": "upcoming"
        },
        {
            "id": "a4",
            "type": "Dental Cleaning",
            "clinicName": "Downtown Dental",
            "date": "2025-12-01",
            "duration": 45,
            "status": "past"
        },
        {
            "id": "a5",
            "type": "General Checkup",
            "clinicName": "City Health Clinic",
            "date": "2025-10-15",
            "duration": 30,
            "status": "past"
        }
    ]

@router.post("/")
def create_appointment(appointment: dict):
    # save to db later
    return { "success": True, "appointment": appointment }