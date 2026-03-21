# NexaCare — AI Layer Documentation

> Written from the actual code in `/ai` — commit `ecd75eb`, Mar 21 2026.  
> Author: Person 4 (nickcantanhede)

---

## Overview

The `/ai` folder is a self-contained TypeScript package that delivers two things to Person 1 (Frontend):

| Export | File | What it does |
|--------|------|--------------|
| `<ChatWidget />` | `ChatWidget.tsx` | React chat UI connected to Anthropic API with user-aware system prompt |
| `getRecommendations()` | `recommendations.ts` | Async function that returns 2–3 AI-generated checkup recommendations as JSON |

Both are exported from `index.ts` and use the shared types in `types.ts`.

---

## Files

```
/ai
  ChatWidget.tsx       ← React component — the chat UI
  recommendations.ts   ← getRecommendations() function
  index.ts             ← barrel export (re-exports both)
  types.ts             ← shared TypeScript interfaces
  package.json         ← @anthropic-ai/sdk dependency
  tsconfig.json        ← TypeScript config
```

---

## Setup

### 1. Install dependencies
```bash
cd ai
npm install
```

### 2. Set your API key

The code resolves the key in this priority order:

| Framework | Variable name |
|-----------|--------------|
| Vite | `VITE_ANTHROPIC_API_KEY` |
| Create React App | `REACT_APP_ANTHROPIC_API_KEY` |
| Node / fallback | `ANTHROPIC_API_KEY` |

Add to your `.env` file in the project root (never commit real keys):
```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

---

## `<ChatWidget />`

### Import
```tsx
import ChatWidget from "../ai/ChatWidget";
```

### Props
```ts
interface ChatWidgetProps {
  userId: string;   // e.g. "user_demo_01"
}
```

### Image / Camera support (coming)
- 📷 button in the input bar opens the file picker (camera on mobile, file browser on desktop)
- Accepted formats: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Image is converted to base64 in the browser — no upload server needed
- Sent to Anthropic as a `vision` content block alongside any text the user typed
- A thumbnail preview is shown in the user's message bubble before the response arrives
- Claude responds with health-relevant analysis (e.g. rash identification, prescription label reading, food label breakdown)
- Falls back gracefully if the image is too large (>5 MB) — shows an inline error instead of sending

### Usage — drop into Dashboard
```tsx
// Dashboard.tsx (Person 1)
import ChatWidget from "../ai/ChatWidget";

export default function Dashboard() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ... rest of dashboard ... */}

      {/* Fixed chat bar at bottom — give it a defined height */}
      <div style={{ height: "420px", borderTop: "1px solid #E5E7EB" }}>
        <ChatWidget userId="user_demo_01" />
      </div>
    </div>
  );
}
```

### What it does on mount
1. Fetches `/api/user/${userId}` from the backend
2. If the route isn't live yet, **automatically falls back to the mock user** (Alex Chen, Software Developer, Toronto) — no setup needed
3. Builds a personalised system prompt with the user's name, age, occupation, and benefit balances
4. Every message sent includes the full conversation history so Claude remembers context

### Behaviour
- Shows "Hi Alex! Ask me anything about your health benefits or appointments." as the empty state
- User bubbles: blue, right-aligned
- Assistant bubbles: grey, left-aligned
- Shows "Thinking…" while waiting for a response
- Enter key sends (Shift+Enter does not)
- Error state: shows "Sorry, I couldn't connect right now. Please try again."
- Fully self-contained — no nav, headers, or page chrome inside

### Model
`claude-sonnet-4-6`, max 512 tokens per response (1024 when an image is attached — vision responses are longer)

---

## `getRecommendations()`

### Import
```ts
import { getRecommendations } from "../ai/recommendations";
```

### Signature
```ts
async function getRecommendations(
  user: User,
  appointments?: Appointment[]   // optional — falls back to "never recorded" if omitted
): Promise<Recommendation[]>
```

### Usage — call on Dashboard load
```tsx
// Dashboard.tsx (Person 1)
import { getRecommendations } from "../ai/recommendations";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [recs, setRecs] = useState<Recommendation[]>([]);

  useEffect(() => {
    // Fetch user + appointments from backend, then get recommendations
    Promise.all([
      fetch("/api/user/user_demo_01").then(r => r.json()),
      fetch("/api/appointments/user_demo_01").then(r => r.json()),
    ]).then(([user, appointments]) => {
      getRecommendations(user, appointments).then(setRecs);
    });
  }, []);

  return (
    <div>
      {/* "Suggested for You" section */}
      {recs.map((rec, i) => (
        <div key={i} style={{
          background: rec.urgency === "high" ? "#FEF3C7" : "#F0FDF4",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "8px"
        }}>
          <strong>{rec.type}</strong>
          <p style={{ margin: "4px 0", fontSize: "13px" }}>{rec.reason}</p>
          <span style={{ fontSize: "11px", textTransform: "uppercase" }}>
            {rec.urgency} priority
          </span>
        </div>
      ))}
    </div>
  );
}
```

### How it works internally
1. Looks through `appointments` for past visits matching "dental", "cleaning", "vision", "eye", "optometry", "checkup", "general", "physical"
2. Formats dates as readable strings (e.g. "3/15/2025") or "never recorded"
3. Calculates unused benefit amounts from `user.benefits`
4. Sends a structured prompt to `claude-sonnet-4-6` (max 256 tokens)
5. Strips any markdown code fences the model might wrap around the JSON
6. Returns parsed `Recommendation[]` — returns `[]` on parse failure (never throws)

### Return shape
```ts
interface Recommendation {
  type: string;                        // e.g. "Eye exam"
  reason: string;                      // e.g. "Last visit was 22 months ago"
  urgency: "low" | "medium" | "high";
}
```

### Example output
```json
[
  {
    "type": "Eye exam",
    "reason": "No eye exam on record and you have $600 in unused vision benefits",
    "urgency": "high"
  },
  {
    "type": "Dental cleaning",
    "reason": "Last cleaning was over a year ago and you have $1,100 in dental benefits remaining",
    "urgency": "medium"
  }
]
```

---

## Types (`types.ts`)

```ts
interface User {
  id: string;
  name: string;
  age: number;
  occupation: string;
  location: { lat: number; lng: number };
  benefits: {
    dental: { total: number; used: number };
    vision: { total: number; used: number };
    physio: { total: number; used: number };
  };
}

interface Appointment {
  id: string;
  type: string;
  clinicName: string;
  date: string;           // ISO 8601
  duration: number;       // minutes
  status: "upcoming" | "past";
}

interface Recommendation {
  type: string;
  reason: string;
  urgency: "low" | "medium" | "high";
}

interface Message {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;   // set when user attaches a photo
  imageType?: string;     // e.g. "image/jpeg"
}
```

---

## Mock data (built into ChatWidget.tsx)

The mock is used automatically if `/api/user/:id` returns an error. No config needed.

```ts
const MOCK_USER = {
  id: "user_demo_01",
  name: "Alex Chen",
  age: 34,
  occupation: "Software Developer",
  benefits: {
    dental: { total: 1500, used: 400 },
    vision: { total: 600, used: 0 },
    physio: { total: 900, used: 200 },
  },
  location: { lat: 43.6532, lng: -79.3832 },
};
```

---

## Checklist for Person 1

- [ ] `npm install` inside `/ai`
- [ ] `VITE_ANTHROPIC_API_KEY` added to `.env`
- [ ] `<ChatWidget userId="user_demo_01" />` added to Dashboard with a defined height container
- [ ] `getRecommendations(user, appointments)` called in `useEffect` on Dashboard load
- [ ] "Suggested for You" cards render `rec.type`, `rec.reason`, `rec.urgency`

---

## Known limitations

- `dangerouslyAllowBrowser: true` is set on the Anthropic client — the API key is exposed to the browser. Fine for a hackathon demo; in production the API call should go through the backend (`/api/chat`) so the key stays server-side.
- No streaming — the chat waits for the full response before rendering. Could be upgraded with `client.messages.stream()`.
- Recommendation engine has no caching — it makes a fresh API call every time the dashboard loads.
- Image analysis is browser-side base64 — fine for demo. In production, images should be proxied through the backend so the API key stays server-side.
- Max image size: 5 MB (enforced client-side before the API call).
