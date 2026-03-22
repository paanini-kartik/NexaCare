"""
Firebase Admin SDK initialisation.

Credential resolution order:
  1. FIREBASE_SERVICE_ACCOUNT_JSON  env var — full JSON string (recommended for production)
  2. FIREBASE_SERVICE_ACCOUNT_PATH  env var — path to a JSON key file
  3. Literal path  server/serviceAccountKey.json  — only if the file exists on disk
                   (allows local dev without any env vars)

Raises RuntimeError if none of the above yield a valid credential.
"""

import json
import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

_app = None
_db = None


def _init():
    global _app, _db

    if _app is not None:
        return

    cred = None

    # ── Option 1: JSON string in env ──────────────────────────────────────────
    json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    if json_str:
        try:
            service_account_info = json.loads(json_str)
            cred = credentials.Certificate(service_account_info)
        except (json.JSONDecodeError, ValueError) as exc:
            raise RuntimeError(
                f"FIREBASE_SERVICE_ACCOUNT_JSON is set but contains invalid JSON: {exc}"
            ) from exc

    # ── Option 2: File path in env ────────────────────────────────────────────
    if cred is None:
        json_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "").strip()
        if json_path and Path(json_path).is_file():
            cred = credentials.Certificate(json_path)

    # ── Option 3: Local default path ──────────────────────────────────────────
    if cred is None:
        default_path = Path(__file__).resolve().parent / "serviceAccountKey.json"
        if default_path.is_file():
            cred = credentials.Certificate(str(default_path))

    if cred is None:
        raise RuntimeError(
            "Firebase credentials not found. Provide one of:\n"
            "  • FIREBASE_SERVICE_ACCOUNT_JSON (JSON string)\n"
            "  • FIREBASE_SERVICE_ACCOUNT_PATH (file path)\n"
            "  • server/serviceAccountKey.json (local file)"
        )

    _app = firebase_admin.initialize_app(cred)
    _db = firestore.client()


def get_db():
    _init()
    return _db


# Convenience: expose db as a module-level attribute (lazy)
class _LazyDb:
    """Proxy that initialises Firebase on first attribute access."""

    def __getattr__(self, name):
        return getattr(get_db(), name)


db = _LazyDb()
