# NexaCare — Pitch Script
**Hack the Globe 2026 · 10 min · 8 min pitch + 2 min demo**

One person, then the next. No alternating.
**P1 → P2 → P3 → P4 → Demo**
Each speaker: ~2 min. Demo: 2 min video.

---

## Person 1 — Hook
*Slide 1 · ~1:30*

When did you last book a routine checkup? Not because something hurt — just because it was time.

Most people have to actually think about that.

It's not that people don't care. It's that routine care means three different portals, a benefits document from your onboarding email you never opened, and somehow remembering your last dental cleaning was fourteen months ago.

So it slips. And keeps slipping.

NexaCare handles that. You set up a profile once — we track what's covered, what's overdue, where to go.

I'm [Name]. I built the frontend — everything you're about to see.

---

## Person 2 — Problem
*Slides 2, 3 · ~2:00*

Here's what it actually looks like today.

You have dental coverage. Vision. Physio. They're sitting in three portals you haven't logged into since you were hired, and December — when everything resets — comes every year whether you used it or not.

So most people don't. And stuff that a routine cleaning or checkup would catch gets worse.

*(advance to slide 3)*

42% of adults skipped at least one preventive checkup last year. Not because they couldn't afford it — because the friction was too high. 67% of employees don't fully use the benefits already in their pay package. Canada spends $88 billion a year on conditions that earlier care would have caught.

The coverage exists. The clinics exist. What's missing is a layer that actually connects them.

I'm [Name]. I built the backend — the API that ties everything together.

---

## Person 3 — Solution
*Slides 4, 5 · ~2:00*

*(advance to slide 4)*

Four features.

Smart Scheduling flags which checkups you're overdue for and walks you through booking them. Benefits Tracker shows exactly what your plan covers and how much is left — no more guessing if physio is included. Health Compass is a map of nearby clinics filtered by your actual coverage. And the AI assistant, which [P4 name] will talk about in a second.

*(advance to slide 5)*

Setup takes two minutes. Age, occupation, health history, benefits. Add your employer invite code or upload your insurance PDF — we parse it automatically. Connect Google Calendar once, and every appointment you book syncs instantly with a confirmation email sent automatically.

That's the full flow. One setup, and it keeps working.

I'm [Name]. I built Health Compass.

---

## Person 4 — AI + Business
*Slides 6, 7 · ~2:00*

*(advance to slide 6)*

The feature I built is the AI health assistant.

It's not a chatbot that answers generic questions. It knows your name, your benefits balance, your upcoming appointments, your allergies, your last checkup dates. It has 26 tools — it can book an appointment, cancel one, find a nearby clinic, update your health profile, add an event to your Google Calendar, or read an insurance PDF you upload. All through conversation.

And it's fully server-side. The Anthropic API key never touches the browser — your data stays in NexaCare's backend.

The same AI engine powers the recommendations on your dashboard — it looks at what you're overdue for and surfaces it automatically, without you having to ask.

*(advance to slide 7)*

Business model is two tracks. Free tier for individuals: smart scheduling, the map, basic assistant. Premium at $8 a month adds the full AI agent, PDF parsing, and unlimited history.

B2B is the real revenue. Employers onboard their teams, HR gets a view of benefit utilization, employees actually use what's in their package. 67% of employees don't use their benefits — employers pay for unused coverage every year. The ROI is direct.

Phase two: clinic partnerships with live booking. NexaCare becomes the link between the employee, the benefit, and the appointment.

---

## Person 1 — Close
*Slide 8 · ~0:30*

*(advance to slide 8)*

Preventive care is almost always the cheaper option.

The problem has never been coverage. It's the friction between having it and doing anything with it.

Built in 24 hours. React, FastAPI, Firebase, Google Calendar, Google Maps, and Anthropic Claude.

Let us show you.

*(start demo)*

---

## Demo — 2 min

**Suggested order:**
1. **Dashboard** — greeting, AI recommendation cards surfaced, upcoming appointments
2. **Benefits Tracker** — dental/vision/physio progress bars, what's left
3. **Health Compass** — filter by type, tap a clinic pin, see accepted benefits badge
4. **AI Chatbot** — type "Do I have enough dental coverage for a cleaning?" → live answer with balance + book action
5. *(optional)* Upload a mock insurance PDF → chatbot reads it

If you narrate: one line per feature. Don't read what's on screen.

---

## Timing

| Segment | Speaker | Slides | Time |
|---------|---------|--------|------|
| Hook | P1 | 1 | ~1:30 |
| Problem | P2 | 2–3 | ~2:00 |
| Solution | P3 | 4–5 | ~2:00 |
| AI + Business | P4 | 6–7 | ~2:00 |
| Close | P1 | 8 | ~0:30 |
| Demo | — | — | ~2:00 |
| **Total** | | | **~10:00** |

---

## Handoffs

- P1 → P2: *"I'm [Name]. I built the frontend."* [look at P2]
- P2 → P3: *"I'm [Name]. I built the backend."* [look at P3]
- P3 → P4: *"[P4 Name] will talk about the AI side."*
- P4 → P1: [sit down, P1 walks up]
- P1 → Demo: *"Let us show you."*

---

## If a Judge Asks

**"Why not just use your insurance app?"**
Insurance apps show coverage. NexaCare tells you what to do with it — flags what you're overdue for, finds the right clinic, and books it. The assistant knows your actual balance.

**"How does the AI know my data?"**
Your profile, benefits, and appointments are injected into the system prompt on every call — server-side. The model always has current context, not stale chat history.

**"Go-to-market?"**
Freemium for individuals, B2B employer plans for revenue. Clinic partnerships in phase two.

**"Is health data safe?"**
Anthropic API calls are fully server-side — key never in the browser. Firebase handles auth and storage with standard security rules. PIPEDA-compliant design from day one.

**"What did you build in 24 hours vs. what's planned?"**
Everything in the demo is real and live: booking, email confirmation, calendar sync, PDF parsing, AI agent with 26 tools, map with real Google Maps data. Phase two (clinic partnerships, rescheduling, mobile) is roadmap.
