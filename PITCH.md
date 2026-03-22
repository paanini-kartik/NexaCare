# NexaCare — Pitch Script
**Hack the Globe 2026 · Health & Humanity Theme**
**10 min pitch + 5 min Q&A · Format: P1 → P2 → P3 → P4 → Demo**

> Judging breakdown: 45% business strategy · 45% technical implementation · 10% presentation
> Each speaker owns one chunk. No alternating. Hand off cleanly.

---

## Timing at a Glance

| Segment | Speaker | Slides | Time | Criterion covered |
|---------|---------|--------|------|-------------------|
| Hook | P1 | 1 | ~1:00 | Presentation |
| Problem + Impact | P2 | 2–3 | ~2:30 | Problem Scope · Impact & Relevance |
| Solution + Fit | P3 | 4–5 | ~2:00 | Solution Scope · Tech-Problem Fit |
| Technical + Innovation | P4 | 6 | ~2:00 | Technical Proficiency · Innovation · Scalability |
| Business Model | P4 | 7 | ~1:30 | Business Operation Model |
| Close | P1 | 8 | ~0:30 | Presentation |
| Live Demo | — | — | ~2:00 | Tech Demo (Devpost) |
| **Total** | | | **~11:30** *(aim for 10, Q&A fills rest)* | |

---

## Person 1 — Hook
*Slide 1 · ~1:00*

When did you last book a routine checkup? Not because something hurt — just because it was time.

Most people have to actually think about that.

It's not that people don't care about their health. It's that using your benefits means logging into three separate portals, finding a document from your onboarding email you never opened, and somehow remembering that your last dental cleaning was fourteen months ago.

So it slips. And it keeps slipping.

NexaCare removes that friction entirely. You set up a profile once — we track what's covered, what's overdue, and where to go.

I'm [Name]. I built the frontend — everything you're about to see.

---

## Person 2 — Problem + Impact
*Slides 2, 3 · ~2:30*
*(addresses: Problem Scope 15 pts · Impact & Relevance 15 pts)*

Here's the real picture.

In Canada, most employees receive comprehensive health benefits — dental, vision, physio — as part of their compensation. But those benefits sit behind fragmented portals, reset every December, and come with no reminders, no guidance, and no map to the nearest in-network clinic.

So people don't use them. Not because they can't afford to — because the friction is too high.

*(advance to slide 3)*

The numbers are stark. **42% of adults** skipped at least one preventive checkup last year. **67% of employees** don't fully use the benefits already in their compensation. Canada spends **$88 billion annually** on conditions that routine preventive care would have caught earlier.

And this isn't evenly distributed. Lower-income employees and newcomers to Canada are hit hardest — they're less likely to navigate fragmented English-only portals, less likely to know what "physio coverage" actually means, and most likely to let that coverage expire unused. The people who most need preventive care are the least likely to access it — even when it's paid for.

The coverage exists. The clinics exist. What's missing is the layer that connects them — in a way that actually works for everyone.

I'm [Name]. I built the backend — the API that ties it all together.

---

## Person 3 — Solution + Technology Fit
*Slides 4, 5 · ~2:00*
*(addresses: Solution Scope 15 pts · Technology-Problem Fit 10 pts)*

*(advance to slide 4)*

NexaCare is that layer. Four features that work together.

**Smart Scheduling** — our AI identifies which checkups you're overdue for based on your age, occupation, and health history, and walks you through booking them in seconds. **Benefits Tracker** — a live view of dental, vision, and physio: what's covered, what you've used, what's left before reset. **Health Compass** — a real-time map of nearby clinics filtered by your actual coverage, so you never show up somewhere that doesn't take your plan. And the **AI Health Assistant** — [P4 name] will cover that in a moment.

*(advance to slide 5)*

Why is technology the right fit here? Because the problem is fundamentally one of fragmented information and missing connections — exactly what software solves. The clinic data is available via Google Maps. The benefits data is in your employer's system. The appointment slot exists. NexaCare is the integration layer that makes them visible and actionable in one place.

Setup takes two minutes: age, occupation, last checkup dates. Add your employer invite code or upload your insurance PDF — we parse it automatically with our backend. Connect Google Calendar once. Every appointment you book after that syncs instantly, with a confirmation email sent automatically.

I'm [Name]. I built Health Compass.

---

## Person 4 — Technical + Business
*Slides 6, 7 · ~3:30*
*(addresses: Technical Proficiency 10 pts · Innovation 10 pts · Scalability 10 pts · Business Operation Model 15 pts)*

*(advance to slide 6)*

Let me tell you what's under the hood.

The stack: React 19 and Vite on the frontend, FastAPI and Python on the backend, Firebase for authentication and data, Leaflet with Google Maps for the clinic map, Resend for email confirmations, Google Calendar OAuth2 for sync, and pypdf for parsing insurance documents server-side.

The most technically differentiated part is the AI agent. It's not a chatbot that answers generic health questions. It has **26 tools** — it can read your live profile, benefits balance, upcoming appointments, allergies, and checkup history. It can book or cancel appointments, find nearby clinics by type, update your health profile, add events to Google Calendar, and parse a PDF you upload — all through conversation. Every Anthropic API call is fully server-side: the key never reaches the browser, and your data never leaves our backend.

This is what makes it genuinely novel. Most health apps are read-only. NexaCare's agent can act — and every action it takes is grounded in your real, live data, not a static snapshot.

On scalability: the architecture is stateless. The backend is a FastAPI server that can be containerized and scaled horizontally. Firebase handles auth and data at any volume. The AI layer is a thin proxy — compute scales with Anthropic's infrastructure. There are no bottlenecks tied to team size.

*(advance to slide 7)*

The business model is two tracks, and the unit economics are clear.

Free tier for individuals: smart scheduling, Health Compass, and a basic assistant. That drives adoption and network density.

**B2B employer plans are the revenue engine.** Employers pay per-seat to onboard their teams. HR gets a utilization dashboard — for the first time, they can see whether their benefit spend is actually being used. Employees get a tool that makes their coverage accessible. The employer value prop is direct: higher benefit utilization, fewer wasted plan dollars, reduced sick days from conditions caught earlier.

Our cost structure is lean: Anthropic API usage, Firebase, email delivery, and maps — all consumption-based, scaling with revenue.

Phase two is clinic partnerships: live appointment availability, direct booking through NexaCare, and a referral fee per confirmed appointment. That's the model that turns NexaCare from a benefit navigation tool into the infrastructure layer for preventive care in Canada.

---

## Person 1 — Close
*Slide 8 · ~0:30*

*(advance to slide 8)*

Preventive care is almost always the cheaper option — for the individual, for the employer, and for the healthcare system.

The problem has never been coverage. It's the friction between having it and actually using it.

Built in 24 hours. Let us show you.

*(start demo)*

---

## Live Demo — ~2:00
*(This is the Devpost Tech Demo — 5 points. Show real functionality, not slides.)*

**Run in this order — one line of narration per screen, don't read what's on screen:**

1. **Dashboard** *(~20 sec)* — "This is Alex's dashboard. The AI has already flagged that he hasn't used $600 of vision coverage and is overdue for an eye exam."
2. **Benefits Tracker** *(~15 sec)* — "Dental, vision, physio — live balances, color-coded by how much is left."
3. **Health Compass** *(~25 sec)* — Filter to Dental → tap a clinic pin → "It shows the clinic, accepted benefits, and a booking button."
4. **Book an appointment** *(~20 sec)* — Click Book → pick a date → confirm → "Confirmation email sent, Google Calendar synced."
5. **AI Chatbot** *(~30 sec)* — Type: *"Do I have enough dental coverage for a cleaning this month?"* → show the response with live balance + action buttons. "It knows the real number. It can book from here."
6. *(If time)* **PDF upload** *(~10 sec)* — Drop mock PDF → chatbot reads it. "Upload your insurance document — it parses the coverage automatically."

---

## Handoffs

- P1 → P2: *"I'm [Name]. I built the frontend."* [look at P2]
- P2 → P3: *"I'm [Name]. I built the backend."* [look at P3]
- P3 → P4: *"[P4 Name] will walk you through the technical layer and the business model."*
- P4 → P1: [sit down, P1 walks up]
- P1 → Demo: *"Let us show you."*

---

## Judge Q&A Prep

**"Why not just use your insurance provider's app?"**
Insurance apps show your balance. They don't tell you you're overdue, they don't show you which nearby clinics accept your specific plan, and they can't book anything. NexaCare is the action layer on top.

**"How do you address the needs of lower-income or newcomer populations?"**
The core app is free. We're designing for people who don't have time to navigate three portals — that's most employees, but it's especially acute for newcomers and hourly workers who lose coverage when they don't use it by December. Localization and language support is phase two.

**"How does the AI actually know my data?"**
Every API call injects your live profile, benefits, and appointments server-side. The model doesn't rely on chat history — it reads from the source on every turn. That's why it always has the right number.

**"What's your go-to-market?"**
Freemium to build individual adoption. B2B employer contracts for revenue. We go to HR teams first — they already have the pain of low benefit utilization, and we have a clear ROI story. Clinic partnerships follow once we have volume.

**"Is this PIPEDA-compliant?"**
Designed from day one with that in mind. Anthropic calls are server-side, keys never in the browser, Firebase security rules are scoped per user, and we don't store health data beyond what the user explicitly provides. Full compliance review is a pre-launch step.

**"What's real vs. planned?"**
Everything in the demo is live: real Firebase auth, real Google Maps clinic data, real Anthropic API calls, real email delivery via Resend, real Google Calendar sync, real PDF parsing. Phase two features — clinic direct booking, rescheduling, HR dashboard, mobile — are roadmap.

**"How does this scale technically?"**
Stateless FastAPI backend, containerizable, horizontally scalable. Firebase scales to millions of users. The AI layer is a proxy to Anthropic — no custom model, no compute burden on our side. The architecture has no single point of failure at team scale.

---

## Rubric Checklist — Before You Walk In

**Business Strategy (45 pts)**
- [ ] Problem statement is specific and scoped (not "healthcare is broken")
- [ ] Socioeconomic angle named: lower-income / newcomer populations underserved even with coverage
- [ ] Solution explained with clear logic for why it works
- [ ] Business model has two tracks, named revenue sources, and phase two
- [ ] Impact is quantified: $88B, 42%, 67%

**Technical Implementation (45 pts)**
- [ ] Full stack named on slides and spoken aloud
- [ ] 26-tool AI agent explained — not "we used AI", but what it actually does
- [ ] Server-side API key handling called out explicitly
- [ ] Scalability addressed: stateless backend, consumption-based costs
- [ ] Innovation named: agentic health assistant with live data grounding
- [ ] Tech demo on Devpost submitted (2-3 min screencast)

**Presentation (10 pts)**
- [ ] Each speaker has one clean block — no cross-talk
- [ ] Handoffs are smooth and practiced
- [ ] No one reads the slides
- [ ] Q&A answers are 2-3 sentences max — confident, not defensive
