import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Reads Vite env vars. If apiKey is missing, Firebase is treated as disabled
 * and the app can use localStorage-only auth in this browser.
 */
export function isFirebaseConfigured() {
  return Boolean(import.meta.env.VITE_FIREBASE_API_KEY);
}

function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

let appSingleton;
let authSingleton;
let dbSingleton;

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null;
  if (!appSingleton) {
    const config = getFirebaseConfig();
    appSingleton = getApps().length ? getApps()[0] : initializeApp(config);
  }
  return appSingleton;
}

export function getFirebaseAuth() {
  if (!isFirebaseConfigured()) return null;
  if (!authSingleton) {
    authSingleton = getAuth(getFirebaseApp());
  }
  return authSingleton;
}

export function getFirestoreDb() {
  if (!isFirebaseConfigured()) return null;
  if (!dbSingleton) {
    dbSingleton = getFirestore(getFirebaseApp());
  }
  return dbSingleton;
}
