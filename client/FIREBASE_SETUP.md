# Firebase (Auth + Firestore)

## 1. Create a Firebase project

1. [Firebase Console](https://console.firebase.google.com/) → Add project.
2. Enable **Authentication** → Sign-in method → **Email/Password**.
3. Enable **Firestore** → Create database (start in **test mode** while developing, then deploy rules below).

## 2. Register a web app

Project settings → Your apps → Web → copy the config into `client/.env.local`:

```bash
cp .env.example .env.local
```

Fill `VITE_FIREBASE_*` values. Restart `npm run dev` after changes.

## 3. Deploy Firestore rules

The repo includes `firestore.rules` as a **starting point** for development. Review and tighten before production (especially `appState` and `usersByEmail`).

```bash
# From repo root, if Firebase CLI is installed and project is linked:
firebase deploy --only firestore:rules
```

Or paste the rules into **Firestore → Rules** in the console.

## 4. Data model

| Path | Purpose |
|------|---------|
| `users/{uid}` | `profile`, `healthProfile`, `household`, `enterprises`, `onboardingComplete` |
| `usersByEmail/{email}` | `{ uid }` for updating other accounts (e.g. family role) |
| `appState/sessionMeta` | `families` map + `employerKeys` array (shared demo data) |

## 5. Without Firebase

If `VITE_FIREBASE_API_KEY` is unset, the app can use a **local browser-only** auth path with `localStorage` (no cloud account).
