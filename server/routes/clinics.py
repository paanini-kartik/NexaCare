import json
import os
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen

from fastapi import APIRouter

router = APIRouter()

MOCK_CLINICS = [
    {"id": "c1", "name": "Downtown Dental", "type": "dental", "lat": 43.6510, "lng": -79.3470, "acceptedBenefits": ["dental"]},
    {"id": "c2", "name": "ClearVision Optometry", "type": "optometry", "lat": 43.6550, "lng": -79.3800, "acceptedBenefits": ["vision"]},
    {"id": "c3", "name": "ActiveCare Physio", "type": "hospital", "lat": 43.6480, "lng": -79.3900, "acceptedBenefits": ["physio"]},
    {"id": "c4", "name": "City Health Clinic", "type": "hospital", "lat": 43.6600, "lng": -79.3750, "acceptedBenefits": ["dental", "vision", "physio"]},
    {"id": "c5", "name": "Shoppers Drug Mart", "type": "pharmacy", "lat": 43.6520, "lng": -79.3850, "acceptedBenefits": []},
    {"id": "c6", "name": "Rexdale Eye Care", "type": "optometry", "lat": 43.6490, "lng": -79.3700, "acceptedBenefits": ["vision"]},
    {"id": "c7", "name": "Union Physiotherapy", "type": "hospital", "lat": 43.6450, "lng": -79.3800, "acceptedBenefits": ["physio"]},
    {"id": "c8", "name": "Yonge Dental Studio", "type": "dental", "lat": 43.6570, "lng": -79.3840, "acceptedBenefits": ["dental"]},
]

TYPE_TO_PLACES = {
    "all": "hospital",
    "hospital": "hospital",
    "dental": "dentist",
    "pharmacy": "pharmacy",
    "optometry": "optometrist",
    "vision": "optometrist",
}


def infer_benefits_from_type(clinic_type: str) -> list[str]:
    if clinic_type == "dental":
        return ["dental"]
    if clinic_type == "optometry":
        return ["vision"]
    if clinic_type == "hospital":
        return ["physio"]
    return []


def normalize_clinic_type(google_types: list[str]) -> str:
    if "dentist" in google_types:
        return "dental"
    if "pharmacy" in google_types:
        return "pharmacy"
    if "optometrist" in google_types:
        return "optometry"
    return "hospital"


def fetch_google_clinics(lat: float, lng: float, clinic_type: str) -> list[dict[str, Any]]:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    if not api_key:
        return []

    params_dict = {
        "location": f"{lat},{lng}",
        "radius": 10000,
        "key": api_key,
    }
    
    if clinic_type == "all":
        params_dict["keyword"] = "health OR clinic OR hospital"
    elif clinic_type in ["vision", "optometry"]:
        params_dict["keyword"] = "optometrist OR eye doctor OR vision OR optometry"
    else:
        params_dict["type"] = TYPE_TO_PLACES.get(clinic_type, "hospital")

    params = urlencode(params_dict)
    url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?{params}"

    all_results = []
    for _ in range(1):  # Fetch 1 page (fast load time, 20 results)
        with urlopen(url, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
        
        all_results.extend(payload.get("results", []))
        
        next_page_token = payload.get("next_page_token")
        if not next_page_token:
            break
            
        import time
        time.sleep(2)  # Google requires a short delay before token is valid
        next_params = urlencode({"pagetoken": next_page_token, "key": api_key})
        url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?{next_params}"

    clinics = []
    for idx, item in enumerate(all_results):
        location = item.get("geometry", {}).get("location", {})
        google_types = item.get("types", [])
        normalized_type = normalize_clinic_type(google_types)
        if clinic_type != "all":
            normalized_type = clinic_type
            
        clinics.append(
            {
                "id": item.get("place_id", f"g_{idx}"),
                "name": item.get("name", "Unknown clinic"),
                "type": normalized_type,
                "lat": location.get("lat"),
                "lng": location.get("lng"),
                "acceptedBenefits": infer_benefits_from_type(normalized_type),
            }
        )

    return [clinic for clinic in clinics if clinic["lat"] is not None and clinic["lng"] is not None]


@router.get("/")
def get_clinics(lat: float = 43.6532, lng: float = -79.3832, type: str = "all"):
    try:
        google_clinics = fetch_google_clinics(lat=lat, lng=lng, clinic_type=type)
    except Exception as e:
        print(f"API Error fetching live clinics: {e}")
        google_clinics = []

    if google_clinics:
        return google_clinics

    if type == "all":
        return MOCK_CLINICS

    return [clinic for clinic in MOCK_CLINICS if clinic["type"] == type]