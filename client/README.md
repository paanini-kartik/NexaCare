# NexaCare Frontend

Authenticated areas show **only data you enter** (profile, employer plans, manual providers, keys) plus **live API responses** where configured (e.g. clinics). There are no bundled sample insurers, clinics, or news articles.

- **Firebase**: When `VITE_FIREBASE_*` env vars are set, auth and Firestore persist your account. See `FIREBASE_SETUP.md`.
- **Local mode**: Without Firebase, a legacy path may use browser `localStorage` for the signed-in user in that browser only.
- **Compass**: Map pins load from `/api/clinics` when the backend is running; otherwise the list stays empty.

## Run locally

```bash
cd client
npm install
npm run dev
```

Open the Vite URL (usually http://localhost:5173).

### `npm install` fails with `EBADPLATFORM` / `fdir` + `win32`

That usually means `package-lock.json` was corrupted (duplicate `node_modules/fdir` entries). Fix:

```bash
rm -rf node_modules package-lock.json
npm install
```

The `npm warn Unknown env config "devdir"` message comes from a **global** npm config entry; remove `devdir` from `~/.npmrc` if you want to silence it.

## Build check

```bash
npm run lint
npm run build
```

## Firebase Hosting (static deploy)

```bash
npm run build
firebase deploy
```
