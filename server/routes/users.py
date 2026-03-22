import urllib.parse
from fastapi import APIRouter, HTTPException
from firebase import db

router = APIRouter()


def _find_user_doc(user_id: str):
    """
    Look up a user document by UID (direct doc ID) first,
    then fall back to querying profile.email — handles both
    uid-keyed and email-passed lookups gracefully.
    """
    decoded = urllib.parse.unquote(user_id)

    # 1. Direct UID lookup (fast path)
    doc = db.collection("users").document(decoded).get()
    if doc.exists:
        return doc

    # 2. Fallback: nested profile.email field (current Firestore schema)
    try:
        results = list(
            db.collection("users")
            .where("profile.email", "==", decoded)
            .limit(1)
            .stream()
        )
        if results:
            return results[0]
    except Exception:
        pass

    # 3. Fallback: top-level email field (legacy docs)
    try:
        results = list(
            db.collection("users")
            .where("email", "==", decoded)
            .limit(1)
            .stream()
        )
        if results:
            return results[0]
    except Exception:
        pass

    return None


@router.get("/{user_id}")
def get_user(user_id: str):
    try:
        doc = _find_user_doc(user_id)
        if not doc or not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        data = doc.to_dict()
        data["id"] = doc.id
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
