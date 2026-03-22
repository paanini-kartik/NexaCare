"""
Server-side AI routes for NexaCare.

Proxies calls to Anthropic so the API key never reaches the browser.

Endpoints:
  POST /api/ai/recommendations  — generate checkup recommendations from user profile
  POST /api/ai/chat             — forward a chat payload to Anthropic, injecting the key
"""

import json
import os

import requests
from fastapi import APIRouter, HTTPException

router = APIRouter()

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
MODEL = "claude-3-5-haiku-20241022"


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


# ── POST /api/ai/recommendations ─────────────────────────────────────────────

@router.post("/recommendations")
def get_recommendations(body: dict):
    """
    Accept: { age, occupation, lastDental, lastEye, lastCheckup, unusedDental, unusedVision }
    Return: [ { type, reason, urgency } ] — parsed JSON array
    """
    key = _get_key()

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
        "model": MODEL,
        "max_tokens": 512,
        "messages": [{"role": "user", "content": prompt}],
    }

    try:
        resp = requests.post(
            ANTHROPIC_API_URL,
            headers=_anthropic_headers(key),
            json=payload,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Anthropic request failed: {exc}")

    text = data.get("content", [{}])[0].get("text", "[]")
    # Extract JSON array from response (may have surrounding text)
    import re
    match = re.search(r"\[[\s\S]*\]", text)
    json_str = match.group(0) if match else "[]"
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        return []


# ── POST /api/ai/chat ─────────────────────────────────────────────────────────

@router.post("/chat")
def chat(body: dict):
    """
    Forward a chat payload to Anthropic.
    Accepts: { messages, tools?, system?, max_tokens? }
    The model is always hardcoded server-side; x-api-key comes from env.
    Returns: raw Anthropic response JSON.
    """
    key = _get_key()

    payload = {
        "model": MODEL,
        "max_tokens": body.get("max_tokens", 1024),
        "messages": body.get("messages", []),
    }
    if "system" in body:
        payload["system"] = body["system"]
    if "tools" in body:
        payload["tools"] = body["tools"]

    try:
        resp = requests.post(
            ANTHROPIC_API_URL,
            headers=_anthropic_headers(key),
            json=payload,
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Anthropic request failed: {exc}")
