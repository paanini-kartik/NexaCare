# NexaCare Frontend (Dummy Data Prototype)

This frontend is intentionally running on **dummy local data only**.

- No backend/API connection yet
- No Firebase Auth integration yet
- LocalStorage is used only to simulate account/profile state for UI testing

## Run locally

```bash
cd client
npm install
npm run dev
```

Open the Vite URL (usually http://localhost:5173).

## Build check

```bash
npm run lint
npm run build
```

## Firebase Hosting (static deploy only)

Firebase Hosting config is ready for SPA rewrites. Auth is not configured.

```bash
npm run build
firebase deploy
```
