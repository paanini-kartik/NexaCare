from fastapi import APIRouter, HTTPException
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from firebase import db
import os

router = APIRouter()

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("CALENDAR_REDIRECT_URI", "http://127.0.0.1:8000/api/calendar/callback")
SCOPES = ["https://www.googleapis.com/auth/calendar"]

def make_flow():
    return Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )

@router.get("/connect/{user_id}")
def connect_calendar(user_id: str):
    try:
        flow = make_flow()
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            state=user_id
        )
        return { "url": auth_url }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/callback")
def calendar_callback(code: str, state: str):
    try:
        flow = make_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials
        db.collection("health").document(state).update({
            "calendarProvider": "google",
            "calendarTokens": {
                "token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": list(credentials.scopes)
            }
        })
        return { "success": True, "message": "Calendar connected" }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/schedule/{user_id}")
def schedule_appointment(user_id: str, appointment: dict):
    try:
        doc = db.collection("health").document(user_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        tokens = doc.to_dict().get("calendarTokens")
        if not tokens:
            raise HTTPException(status_code=400, detail="Calendar not connected")
        credentials = Credentials(**tokens)
        service = build("calendar", "v3", credentials=credentials)
        event = {
            "summary": appointment["type"],
            "location": appointment["clinicName"],
            "start": {
                "dateTime": appointment["date"] + "T09:00:00",
                "timeZone": "America/Toronto"
            },
            "end": {
                "dateTime": appointment["date"] + "T10:00:00",
                "timeZone": "America/Toronto"
            }
        }
        service.events().insert(calendarId="primary", body=event).execute()
        return { "success": True }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))