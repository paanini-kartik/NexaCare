from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_clinics(lat: float = None, lng: float = None):
    return [
        
        # Placeholder values
        
        {
            "id": "c1",
            "name": "Downtown Dental",
            "type": "dental",
            "lat": 43.6510,
            "lng": -79.3470,
            "acceptedBenefits": ["dental"]
        },
        {
            "id": "c2",
            "name": "ClearVision Optometry",
            "type": "optometry",
            "lat": 43.6550,
            "lng": -79.3800,
            "acceptedBenefits": ["vision"]
        },
        {
            "id": "c3",
            "name": "ActiveCare Physio",
            "type": "hospital",
            "lat": 43.6480,
            "lng": -79.3900,
            "acceptedBenefits": ["physio"]
        },
        {
            "id": "c4",
            "name": "City Health Clinic",
            "type": "hospital",
            "lat": 43.6600,
            "lng": -79.3750,
            "acceptedBenefits": ["dental", "vision", "physio"]
        },
        {
            "id": "c5",
            "name": "Shoppers Drug Mart",
            "type": "pharmacy",
            "lat": 43.6520,
            "lng": -79.3850,
            "acceptedBenefits": ["dental"]
        },
        {
            "id": "c6",
            "name": "Rexdale Eye Care",
            "type": "optometry",
            "lat": 43.6490,
            "lng": -79.3700,
            "acceptedBenefits": ["vision"]
        },
        {
            "id": "c7",
            "name": "Union Physiotherapy",
            "type": "hospital",
            "lat": 43.6450,
            "lng": -79.3800,
            "acceptedBenefits": ["physio"]
        },
        {
            "id": "c8",
            "name": "Yonge Dental Studio",
            "type": "dental",
            "lat": 43.6570,
            "lng": -79.3840,
            "acceptedBenefits": ["dental"]
        }
    ]