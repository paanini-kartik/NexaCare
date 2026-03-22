"""
Google Calendar integration for NexaCare.

Endpoints:
  GET  /api/calendar/status?user_email=...    → is user connected?
  GET  /api/calendar/auth-url?user_email=...  → OAuth URL to redirect user to
  GET  /api/calendar/callback                 → Google redirects here after approval
  POST /api/calendar/add-event                → create calendar event after booking
  DELETE /api/calendar/disconnect?user_email= → remove tokens

Requires in .env:
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
"""

import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from firebase import db

router = APIRouter()

CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
REDIRECT_URI  = "http://localhost:8000/api/calendar/callback"
SCOPES        = ["https://www.googleapis.com/auth/calendar.events"]
FRONTEND_URL  = "http://localhost:5173"


def _configured() -> bool:
    return bool(CLIENT_ID and CLIENT_SECRET)


def _make_flow():
    from google_auth_oauthlib.flow import Flow
    return Flow.from_client_config(
        {
            "web": {
                "client_id":     CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
                "token_uri":     "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )


def _get_tokens(user_email: str) -> dict | None:
    doc = db.collection("calendar_tokens").document(user_email).get()
    return doc.to_dict() if doc.exists else None


def _save_tokens(user_email: str, tokens: dict):
    db.collection("calendar_tokens").document(user_email).set(tokens)


def _get_credentials(user_email: str):
    """Return valid Google Credentials, auto-refreshing if needed."""
    from google.oauth2.credentials import Credentials
    tokens = _get_tokens(user_email)
    if not tokens or not tokens.get("refresh_token"):
        return None

    creds = Credentials(
        token=tokens.get("token"),
        refresh_token=tokens["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        scopes=SCOPES,
    )

    # Auto-refresh if expired
    if not creds.valid:
        try:
            from google.auth.transport.requests import Request
            import requests as req_lib
            creds.refresh(Request())
            _save_tokens(user_email, {
                **tokens,
                "token": creds.token,
            })
        except Exception as e:
            print(f"⚠️  Token refresh failed for {user_email}: {e}")
            return None

    return creds


# ── ENDPOINTS ─────────────────────────────────────────────────────────────────

@router.get("/status")
def calendar_status(user_email: str = Query(...)):
    """Check if the user has connected Google Calendar."""
    if not _configured():
        return {"connected": False, "reason": "Keys not configured — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env"}
    tokens = _get_tokens(user_email)
    return {"connected": bool(tokens and tokens.get("refresh_token"))}


@router.get("/auth-url")
def get_auth_url(user_email: str = Query(...)):
    """Return the Google OAuth URL to redirect the user to."""
    if not _configured():
        raise HTTPException(status_code=503, detail="GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set in .env yet")
    try:
        flow = _make_flow()
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            prompt="consent",
            state=user_email,
        )
        return {"url": auth_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/callback")
def oauth_callback(
    code: str  = Query(None),
    state: str = Query(None),
    error: str = Query(None),
):
    """Google redirects here after user approves. Exchanges code for tokens, then redirects back to frontend."""
    if error:
        return RedirectResponse(f"{FRONTEND_URL}/settings?calendar=error&reason={error}")

    if not code or not state:
        return RedirectResponse(f"{FRONTEND_URL}/settings?calendar=error&reason=missing_params")

    user_email = state

    try:
        flow = _make_flow()
        flow.fetch_token(code=code)
        creds = flow.credentials

        _save_tokens(user_email, {
            "token":         creds.token,
            "refresh_token": creds.refresh_token,
            "scopes":        list(creds.scopes or SCOPES),
            "user_email":    user_email,
        })
        print(f"✅ Google Calendar connected for {user_email}")
        return RedirectResponse(f"{FRONTEND_URL}/settings?calendar=connected")
    except Exception as e:
        print(f"⚠️  Calendar callback failed: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/settings?calendar=error&reason=token_exchange_failed")


@router.post("/add-event")
def add_calendar_event(body: dict):
    """
    Create a Google Calendar event for a booked appointment.
    Body: { userEmail, type, clinicName, date (ISO 8601), duration (minutes) }
    """
    user_email  = body.get("userEmail", "")
    appt_type   = body.get("type",       "Appointment")
    clinic_name = body.get("clinicName", "")
    date_str    = body.get("date",       "")
    duration    = int(body.get("duration", 45))

    if not user_email:
        raise HTTPException(status_code=400, detail="userEmail is required")

    if not _configured():
        return {"success": False, "reason": "Google OAuth keys not configured yet — add them to .env"}

    creds = _get_credentials(user_email)
    if not creds:
        return {"success": False, "reason": "User has not connected Google Calendar"}

    # Parse ISO 8601 start time safely
    try:
        start_dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        start_dt = datetime.now(timezone.utc) + timedelta(days=7)

    end_dt = start_dt + timedelta(minutes=duration)

    event = {
        "summary":     f"🏥 {appt_type}",
        "location":    clinic_name,
        "description": f"Booked via NexaCare\nClinic: {clinic_name}\nDuration: {duration} minutes",
        "start": {"dateTime": start_dt.isoformat(), "timeZone": "America/Toronto"},
        "end":   {"dateTime": end_dt.isoformat(),   "timeZone": "America/Toronto"},
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email", "minutes": 60 * 24},  # 1 day before
                {"method": "popup", "minutes": 60},        # 1 hour before
            ],
        },
    }

    try:
        from googleapiclient.discovery import build
        service = build("calendar", "v3", credentials=creds)
        result  = service.events().insert(calendarId="primary", body=event).execute()
        event_id   = result.get("id")
        event_link = result.get("htmlLink")
        print(f"✅ Calendar event created: {event_id} for {user_email}")
        return {"success": True, "eventId": event_id, "link": event_link}
    except Exception as e:
        print(f"⚠️  Calendar event creation failed for {user_email}: {e}")
        return {"success": False, "reason": str(e)}


@router.delete("/disconnect")
def disconnect_calendar(user_email: str = Query(...)):
    """Remove saved tokens — disconnects Google Calendar for this user."""
    try:
        db.collection("calendar_tokens").document(user_email).delete()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
