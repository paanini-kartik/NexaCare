import os
import resend
from fastapi import APIRouter, HTTPException
from firebase import db

router = APIRouter()

resend.api_key = os.getenv("RESEND_API_KEY", "")
DEMO_USER_EMAIL   = os.getenv("DEMO_USER_EMAIL", "")
DEMO_CLINIC_EMAIL = os.getenv("DEMO_CLINIC_EMAIL", "")
FROM_EMAIL        = os.getenv("FROM_EMAIL", "onboarding@resend.dev")


def send_confirmation_emails(appt: dict):
    """Send booking confirmation to user and clinic via Resend."""
    if not resend.api_key:
        print("⚠️  RESEND_API_KEY not set — skipping emails")
        return

    user_name   = appt.get("userName", "Patient")
    appt_type   = appt.get("type", "Appointment")
    clinic_name = appt.get("clinicName", "the clinic")
    date        = appt.get("date", "TBD")
    duration    = appt.get("duration", 45)
    user_email  = appt.get("userEmail") or DEMO_USER_EMAIL
    clinic_email = appt.get("clinicEmail") or DEMO_CLINIC_EMAIL

    # --- User confirmation email ---
    if user_email:
        try:
            resend.Emails.send({
                "from":    FROM_EMAIL,
                "to":      [user_email],
                "subject": f"Appointment Confirmed ✅ — {appt_type}",
                "html": f"""
                <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px">
                  <h2 style="color:#1a7a4a">Your appointment is confirmed ✅</h2>
                  <p>Hi {user_name},</p>
                  <p>Your <strong>{appt_type}</strong> at <strong>{clinic_name}</strong> has been booked.</p>
                  <table style="border-collapse:collapse;width:100%;margin:24px 0">
                    <tr><td style="padding:8px 0;color:#555">📅 Date</td><td><strong>{date}</strong></td></tr>
                    <tr><td style="padding:8px 0;color:#555">⏱ Duration</td><td><strong>{duration} minutes</strong></td></tr>
                    <tr><td style="padding:8px 0;color:#555">🏥 Clinic</td><td><strong>{clinic_name}</strong></td></tr>
                  </table>
                  <p style="color:#555">Your dental benefits will cover the estimated cost. See you there!</p>
                  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
                  <p style="color:#aaa;font-size:12px">Booked via NexaCare — Your personal health assistant</p>
                </div>
                """,
            })
            print(f"✅ User confirmation email sent to {user_email}")
        except Exception as e:
            print(f"⚠️  User email failed: {e}")

    # --- Clinic notification email ---
    if clinic_email:
        try:
            resend.Emails.send({
                "from":    FROM_EMAIL,
                "to":      [clinic_email],
                "subject": f"New Booking via NexaCare — {appt_type}",
                "html": f"""
                <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px">
                  <h2 style="color:#1a7a4a">New appointment request</h2>
                  <p>A patient has booked through <strong>NexaCare</strong>.</p>
                  <table style="border-collapse:collapse;width:100%;margin:24px 0">
                    <tr><td style="padding:8px 0;color:#555">👤 Patient</td><td><strong>{user_name}</strong></td></tr>
                    <tr><td style="padding:8px 0;color:#555">🦷 Service</td><td><strong>{appt_type}</strong></td></tr>
                    <tr><td style="padding:8px 0;color:#555">📅 Date</td><td><strong>{date}</strong></td></tr>
                    <tr><td style="padding:8px 0;color:#555">⏱ Duration</td><td><strong>{duration} minutes</strong></td></tr>
                    <tr><td style="padding:8px 0;color:#555">📧 Contact</td><td><strong>{user_email}</strong></td></tr>
                  </table>
                  <p style="color:#555">Please confirm availability with the patient directly.</p>
                  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
                  <p style="color:#aaa;font-size:12px">NexaCare Booking System</p>
                </div>
                """,
            })
            print(f"✅ Clinic notification email sent to {clinic_email}")
        except Exception as e:
            print(f"⚠️  Clinic email failed: {e}")


@router.get("/{user_id}")
def get_appointments(user_id: str):
    try:
        appointments = db.collection("appointments").where("userId", "==", user_id).stream()
        return [{"id": a.id, **a.to_dict()} for a in appointments]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/")
def create_appointment(appointment: dict):
    try:
        doc = db.collection("appointments").add(appointment)
        appt_id = doc[1].id
        saved = {"id": appt_id, **appointment}

        # Fire confirmation emails — non-blocking, won't fail the request
        send_confirmation_emails(appointment)

        return {"success": True, "id": appt_id, "appointment": saved}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
