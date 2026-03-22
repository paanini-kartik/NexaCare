import { doc, getDoc, setDoc, updateDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import { getFirestoreDb } from "./firebase";
import { mergeSessionMetaForFirestoreSave, normalizeSessionMeta } from "./sessionMetaModel";

const SESSION_META_DOC = ["appState", "sessionMeta"];

export function normEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

/**
 * Shared family + employer key data (single doc to keep rules simple).
 */
export async function loadSessionMetaFromFirestore() {
  const db = getFirestoreDb();
  if (!db) return normalizeSessionMeta(null);
  const ref = doc(db, SESSION_META_DOC[0], SESSION_META_DOC[1]);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return normalizeSessionMeta(null);
  }
  return normalizeSessionMeta(snap.data());
}

export async function saveSessionMetaToFirestore(sessionMeta) {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, SESSION_META_DOC[0], SESSION_META_DOC[1]);
  const local = normalizeSessionMeta(sessionMeta);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const remoteRaw = snap.exists() ? snap.data() : {};
    const merged = mergeSessionMetaForFirestoreSave(remoteRaw, local);
    transaction.set(
      ref,
      {
        families: merged.families,
        employerKeys: merged.employerKeys,
        enterpriseDirectory: merged.enterpriseDirectory,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

/** Retry briefly after signup — Firestore write may trail auth callback. */
export async function loadUserDocument(uid) {
  const db = getFirestoreDb();
  if (!db || !uid) return null;
  for (let i = 0; i < 15; i++) {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) return snap.data();
    await new Promise((r) => setTimeout(r, 80));
  }
  return null;
}

export async function saveUserDocument(uid, payload) {
  const db = getFirestoreDb();
  if (!db || !uid) return;
  await setDoc(
    doc(db, "users", uid),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function setEmailLookup(emailNorm, uid) {
  const db = getFirestoreDb();
  if (!db) return;
  await setDoc(doc(db, "usersByEmail", emailNorm), { uid, updatedAt: serverTimestamp() }, { merge: true });
}

export async function ensureEmailLookup(uid, emailNorm) {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, "usersByEmail", emailNorm);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { uid, updatedAt: serverTimestamp() }, { merge: true });
  }
}

export async function updateRemoteUserProfileByEmail(emailNorm, partial) {
  const db = getFirestoreDb();
  if (!db) return { ok: false };
  const lookup = await getDoc(doc(db, "usersByEmail", emailNorm));
  if (!lookup.exists()) return { ok: false };
  const { uid } = lookup.data();
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return { ok: false };
  const prev = userSnap.data();
  const profile = { ...(prev.profile && typeof prev.profile === "object" ? prev.profile : {}), ...partial };
  await updateDoc(userRef, { profile, updatedAt: serverTimestamp() });
  return { ok: true };
}
