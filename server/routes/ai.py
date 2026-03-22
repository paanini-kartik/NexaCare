"""
Server-side AI routes for NexaCare.

Proxies calls to Anthropic so the API key never reaches the browser.

Endpoints:
  POST /api/ai/recommendations  — generate checkup recommendations from user profile
  POST /api/ai/chat             — forward a chat payload to Anthropic, injecting the key
"""

import json
import os
from typing import Optional

import requests
from fastapi import APIRouter, HTTPException

router = APIRouter()

ANTHROPIC_API_URL = os.getenv("ANTHROPIC_API_URL", "https://api.anthropic.com/v1/messages")
ANTHROPIC_VERSION = os.getenv("ANTHROPIC_API_VERSION", "2023-06-01")
DEFAULT_MODEL     = os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")


def _get_key() -> str:
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key:
        raise HTTPException(
            status_code=400,
            detail="ANTHROPIC_API_KEY is not set on the server. Add it to your .env file.",
        )
    return key


def _anthropic_headers(key: str) -> dict:
    return {
        "x-api-key": key,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
    }


def _get_model() -> str:
    return os.getenv("ANTHROPIC_MODEL", DEFAULT_MODEL)


def _raise_anthropic_http_error(resp: requests.Response):
    try:
        error_body = resp.json()
    except ValueError:
        error_body = {}

    provider_message = None
    if isinstance(error_body, dict):
        provider_message = error_body.get("error", {}).get("message")

    if provider_message:
        print(f"Anthropic error {resp.status_code}: {provider_message}")

    if resp.status_code in (401, 403):
        detail = "Anthropic authentication failed on the server. Check ANTHROPIC_API_KEY."
    elif resp.status_code == 404:
        detail = (
            f"Anthropic rejected the configured model '{_get_model()}'. "
            "Set ANTHROPIC_MODEL to a model available for this key."
        )
    elif resp.status_code == 405:
        detail = (
            "Anthropic rejected the server request. Check the configured model "
            "and server deployment instead of the browser."
        )
    else:
        detail = provider_message or f"Anthropic request failed with status {resp.status_code}."

    raise HTTPException(status_code=502, detail=detail)


def _post_to_anthropic(payload: dict, timeout: int):
    key = _get_key()

    try:
        resp = requests.post(
            ANTHROPIC_API_URL,
            headers=_anthropic_headers(key),
            json=payload,
            timeout=timeout,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach Anthropic: {exc}")

    if not resp.ok:
        _raise_anthropic_http_error(resp)

    try:
        return resp.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="Anthropic returned an unreadable response.")


# ── POST /api/ai/recommendations ─────────────────────────────────────────────

@router.post("/recommendations")
def get_recommendations(body: dict):
    """
    Accept: { age, occupation, lastDental, lastEye, lastCheckup, unusedDental, unusedVision }
    Return: [ { type, reason, urgency } ] — parsed JSON array
    """
    age = body.get("age", "unknown")
    occupation = body.get("occupation", "unknown")
    last_dental = body.get("lastDental", "never")
    last_eye = body.get("lastEye", "never")
    last_checkup = body.get("lastCheckup", "never")
    unused_dental = body.get("unusedDental", 0)
    unused_vision = body.get("unusedVision", 0)

    prompt = (
        f"Based on this user profile:\n"
        f"- Age: {age}, Occupation: {occupation}\n"
        f"- Last dental visit: {last_dental}\n"
        f"- Last eye exam: {last_eye}\n"
        f"- Last general checkup: {last_checkup}\n"
        f"- Unused dental: ${unused_dental}, unused vision: ${unused_vision}\n"
        f"\n"
        f"What checkups should this user book soon?\n"
        f'Return ONLY a JSON array, no other text. Each item: {{"type": string, "reason": string, "urgency": "low"|"medium"|"high"}}\n'
        f"Return 3 recommendations maximum."
    )

    payload = {
        "model": _get_model(),
        "max_tokens": 512,
        "messages": [{"role": "user", "content": prompt}],
    }

    data = _post_to_anthropic(payload, timeout=30)

    text = data.get("content", [{}])[0].get("text", "[]")
    # Extract JSON array from response (may have surrounding text)
    import re
    match = re.search(r"\[[\s\S]*\]", text)
    json_str = match.group(0) if match else "[]"
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        return []


# ── POST /api/ai/cadence-intervals ───────────────────────────────────────────

CADENCE_BOUNDS = {
    "physical": (90, 365),
    "dental": (90, 240),
    "vision": (180, 730),
}


def _clamp_cadence(field: str, value) -> Optional[int]:
    bounds = CADENCE_BOUNDS.get(field)
    if not bounds:
        return None
    lo, hi = bounds
    try:
        n = int(round(float(value)))
    except (TypeError, ValueError):
        return None
    return max(lo, min(hi, n))


@router.post("/cadence-intervals")
def get_cadence_intervals(body: dict):
    """
    Personalized days-between-visits for the three core rings (physical, dental, vision).
    Returns JSON with clamped integers; uses Anthropic with heuristic fallback on failure.
    """
    age = body.get("age", "unknown")
    occupation = body.get("occupation", "unknown")
    allergies = body.get("allergies") or []
    medical_history = body.get("medicalHistory") or []
    last_visits = body.get("lastVisits") or {}

    hist_lines = []
    for ev in medical_history[:24]:
        if isinstance(ev, dict):
            t = str(ev.get("title", "")).strip()
            n = str(ev.get("notes", "")).strip()
            if t or n:
                hist_lines.append(f"- {t}: {n}".strip(": "))
    hist_blob = "\n".join(hist_lines) if hist_lines else "(none listed)"

    allergy_blob = ", ".join(
        str(a.get("name", a) if isinstance(a, dict) else a) for a in allergies[:32]
    ) or "(none listed)"

    lv_physical = last_visits.get("physical") or "unknown"
    lv_dental = last_visits.get("dental") or "unknown"
    lv_vision = last_visits.get("optometry") or last_visits.get("vision") or "unknown"

    prompt = f"""You personalize preventive care timing for a health app (Canada-oriented). Not medical advice—navigation hints only.

User snapshot:
- Age: {age}
- Occupation: {occupation}
- Allergies: {allergy_blob}
- Medical history (titles/notes):
{hist_blob}
- Last logged visits (ISO dates or unknown): physical={lv_physical}, dental={lv_dental}, eye={lv_vision}

Task: Suggest how many **full days** should typically pass **between** visits for each category, using mainstream preventive guidance. Prefer **proactive** (shorter) intervals when age, job strain, diabetes, hypertension, pregnancy, heavy screen use, or oral risk factors appear in the text. Prefer **longer** intervals only for clearly low-risk young adults with no flags.

Hard limits (must obey):
- physicalDays: integer {CADENCE_BOUNDS["physical"][0]}–{CADENCE_BOUNDS["physical"][1]}
- dentalDays: integer {CADENCE_BOUNDS["dental"][0]}–{CADENCE_BOUNDS["dental"][1]}
- visionDays: integer {CADENCE_BOUNDS["vision"][0]}–{CADENCE_BOUNDS["vision"][1]}

Return **ONLY** valid JSON, no markdown, no commentary:
{{"physicalDays": <int>, "dentalDays": <int>, "visionDays": <int>, "summary": "<one short sentence for the UI>"}}
"""

    payload = {
        "model": _get_model(),
        "max_tokens": 400,
        "temperature": 0.2,
        "messages": [{"role": "user", "content": prompt}],
    }

    fallback = {
        "ok": False,
        "physicalDays": None,
        "dentalDays": None,
        "visionDays": None,
        "summary": None,
    }

    try:
        data = _post_to_anthropic(payload, timeout=45)
    except HTTPException:
        return fallback

    text = data.get("content", [{}])[0].get("text", "{}")
    import re

    match = re.search(r"\{[\s\S]*\}", text)
    json_str = match.group(0) if match else "{}"
    try:
        parsed = json.loads(json_str)
    except json.JSONDecodeError:
        return fallback

    phys = _clamp_cadence("physical", parsed.get("physicalDays"))
    dent = _clamp_cadence("dental", parsed.get("dentalDays"))
    vis = _clamp_cadence("vision", parsed.get("visionDays"))

    if phys is None or dent is None or vis is None:
        return fallback

    summary = parsed.get("summary")
    if not isinstance(summary, str):
        summary = None
    else:
        summary = summary.strip()[:280] or None

    return {
        "ok": True,
        "physicalDays": phys,
        "dentalDays": dent,
        "visionDays": vis,
        "summary": summary,
    }


# ── POST /api/ai/chat ─────────────────────────────────────────────────────────

@router.post("/chat")
def chat(body: dict):
    """
    Forward a chat payload to Anthropic.
    Accepts: { messages, tools?, system?, max_tokens? }
    The model is always hardcoded server-side; x-api-key comes from env.
    Returns: raw Anthropic response JSON.
    """
    payload = {
        "model": _get_model(),
        "max_tokens": body.get("max_tokens", 1024),
        "messages": body.get("messages", []),
    }
    if "system" in body:
        payload["system"] = body["system"]
    if "tools" in body:
        payload["tools"] = body["tools"]

    return _post_to_anthropic(payload, timeout=60)
