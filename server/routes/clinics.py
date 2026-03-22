import json
import os
import ssl
import time
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen

from fastapi import APIRouter

router = APIRouter()

# Default map centre (used when the caller doesn't pass lat/lng).
# Override with DEFAULT_LAT / DEFAULT_LNG in .env for non-Toronto deployments.
_DEFAULT_LAT = float(os.getenv("DEFAULT_LAT", "43.6532"))
_DEFAULT_LNG = float(os.getenv("DEFAULT_LNG", "-79.3832"))


def _ssl_context() -> ssl.SSLContext:
    """
    macOS / some Python builds ship without a usable CA store for urllib;
    certifi provides Mozilla's bundle so Google HTTPS verifies.
    """
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def _https_json(url: str, timeout: float = 8) -> dict[str, Any]:
    ctx = _ssl_context()
    with urlopen(url, timeout=timeout, context=ctx) as response:
        return json.loads(response.read().decode("utf-8"))


def _google_maps_api_key() -> str:
    """Read key from env; supports common alternate names and quoted values in .env files."""
    for name in ("GOOGLE_MAPS_API_KEY", "GOOGLE_MAPS_KEY", "MAPS_API_KEY"):
        raw = os.getenv(name)
        if not raw:
            continue
        v = raw.strip().strip('"').strip("'")
        if v:
            return v
    return ""

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
    api_key = _google_maps_api_key()
    if not api_key:
        print("No Google Maps / Places API key found (set GOOGLE_MAPS_API_KEY in .env)")
        return []

    params_dict = {
        "location": f"{lat},{lng}",
        "rankby": "distance",
        "key": api_key,
    }
    
    if clinic_type == "all":
        params_dict["keyword"] = "health OR clinic OR hospital"
    elif clinic_type in ["vision", "optometry"]:
        params_dict["keyword"] = "optometrist OR eye doctor OR vision OR optometry"
    elif clinic_type == "hospital":
        params_dict["type"] = "hospital"
        params_dict["keyword"] = "emergency room OR trauma OR general hospital"
    else:
        params_dict["type"] = TYPE_TO_PLACES.get(clinic_type, "hospital")

    params = urlencode(params_dict)
    url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?{params}"

    all_results = []
    for _ in range(1):  # Fetch 1 page (fast load time, 20 results)
        payload = _https_json(url, timeout=8)

        status = payload.get("status")
        if status not in ("OK", "ZERO_RESULTS"):
            err = payload.get("error_message") or ""
            print(f"Google Places nearby search status={status} {err}".strip())

        all_results.extend(payload.get("results", []))

        next_page_token = payload.get("next_page_token")
        if not next_page_token:
            break

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
def get_clinics(lat: float = _DEFAULT_LAT, lng: float = _DEFAULT_LNG, type: str = "all"):
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

@router.get("/{place_id}")
def get_clinic_details(place_id: str):
    api_key = _google_maps_api_key()
    if not api_key:
        return {}

    params_dict = {
        "place_id": place_id,
        "fields": "name,formatted_address,formatted_phone_number,website,editorial_summary,business_status,geometry,rating,user_ratings_total,opening_hours",
        "key": api_key,
    }
    params = urlencode(params_dict)
    url = f"https://maps.googleapis.com/maps/api/place/details/json?{params}"

    try:
        payload = _https_json(url, timeout=8)
        status = payload.get("status")
        if status != "OK":
            err = payload.get("error_message") or ""
            print(f"Google Place Details status={status} {err}".strip())
            return {}
        return payload.get("result", {})
    except Exception as e:
        print(f"API Error fetching place details: {e}")
        return {}