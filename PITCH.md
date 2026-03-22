# NexaCare — Pitch Script
**Hack the Globe 2026 · Health & Humanity Theme**
**10 min slot · target 9 min · P1 → P2 → P3 → P4 → Demo**

> Judging: 45% business strategy · 45% technical implementation · 10% presentation

---

## Slide Map (6 slides)

| Slide | Content | Speaker | Target |
|-------|---------|---------|--------|
| 1 | Hook — dashboard UI + team | P1 | 0:45 |
| 2 | Problem — stats + chaos map | P2 | 2:00 |
| 3 | Solution — 4 features + setup flow | P3 | 1:45 |
| 4 | Technical — stack + AI agent | P4 | 1:30 |
| 5 | Business model + close | P4 → P1 | 1:30 |
| 6 | Live demo | All | 1:30 |
| **Total** | | | **9:00** |

---

## Person 1 — Hook
*Slide 1 · 0:45*

When did you last book a routine checkup — not because something hurt, just because it was time?

Most people have to actually think about that.

It's not that people don't care. It's that using your benefits means three portals, a PDF from your onboarding email you never opened, and a reset date that comes every December whether you're ready or not.

NexaCare removes that friction. What you're seeing is the real app.

I'm [Name], I built the frontend — everything you're about to see.

---

## Person 2 — Problem + Impact
*Slide 2 · 2:00*
*(covers: Problem Scope 15 pts · Impact & Relevance 15 pts)*

Here's what using your benefits actually looks like today.

*(gesture to chaos map)* Five disconnected pieces — dental portal, vision portal, physio portal, a benefits PDF, an annual reset — and in the middle: you, trying to figure it out before year end.

So most people don't. And conditions that a routine checkup would catch get worse.

**42% of adults** skipped a preventive checkup last year — not because they couldn't afford it, because the friction was too high. **67% of employees** don't fully use the benefits in their compensation package. Canada spends **$88 billion annually** on conditions preventive care would have caught.

And it's not evenly distributed. Lower-income employees and newcomers are hit hardest — the people most likely to let coverage expire unused are exactly the people who need it most.

The coverage exists. The clinics exist. The layer connecting them doesn't.

I'm [Name], I built the backend.

---

## Person 3 — Solution + Tech Fit
*Slide 3 · 1:45*
*(covers: Solution Scope 15 pts · Tech-Problem Fit 10 pts)*

NexaCare is that layer. Four features.

**Smart Scheduling** — AI flags which checkups you're overdue for and books them in seconds. **Benefits Tracker** — live dental, vision, physio balances before your reset. **Health Compass** — a map of nearby clinics filtered by your actual coverage. And the **AI Assistant**, which [P4] will cover.

*(gesture to 4-step flow)* Setup: two minutes. Enter your age and history, add your employer invite code or upload your insurance PDF — we parse it — connect Google Calendar. After that: routine care on autopilot.

Why software? Because this is a fragmented information problem. The clinic data exists. The benefits data exists. NexaCare is the integration layer that makes it actionable.

I'm [Name], I built Health Compass.

---

## Person 4 — Technical + Business
*Slides 4 → 5 · 3:00*
*(covers: Technical Proficiency 10 pts · Innovation 10 pts · Scalability 10 pts · Business Operation Model 15 pts)*

*(advance to slide 4)*

Here's what's actually built.

React 19, FastAPI, Firebase, Leaflet with Google Maps, Anthropic Claude Haiku, Resend for email, Google Calendar OAuth2, and pypdf for parsing insurance documents — all running in production.

The AI agent has **26 tools**. It reads your live profile, benefits balance, appointments, allergies, and checkup history. It can book or cancel appointments, find clinics, update your health profile, and add events to Google Calendar — through conversation. Every Anthropic call is server-side: the API key never reaches the browser.

This is what makes it novel — most health apps are read-only. Ours acts, grounded in your real live data every turn.

On scale: stateless FastAPI backend, containerizable, horizontally scalable. Firebase and Anthropic handle compute at any volume. No bottlenecks.

*(advance to slide 5)*

Business model: two tracks.

Free for individuals — scheduling, the map, basic assistant. Premium at $8/month adds the full AI agent and PDF parsing.

**B2B employer plans are the revenue engine.** Per-seat. HR gets a utilization dashboard — for the first time they can see whether their benefit spend is actually being used. The ROI is direct: higher utilization, fewer wasted dollars, fewer sick days. Works for small teams and enterprise.

Cost structure is consumption-based — Anthropic, Firebase, Resend, Maps — scaling with revenue.

Phase two: clinic partnerships, live booking, referral revenue. NexaCare becomes the infrastructure layer for preventive care.

---

## Person 1 — Close
*Still Slide 5 · 0:10*

The problem has never been coverage. It's the friction between having it and using it.

Let us show you.

*(advance to slide 6)*

---

## Live Demo — Slide 6 · 1:30
*(Devpost Tech Demo — 5 pts)*

**One sentence per screen. Move fast. Don't read the slides.**

| Screen | Say |
|--------|-----|
| **Dashboard** | "Alex's dashboard — AI already flagged he's overdue for an eye exam with $600 of unused vision coverage." |
| **Benefits Tracker** | "Live balances — dental, vision, physio — color-coded by what's left." |
| **Health Compass** | "Filtered to dental clinics that accept his plan. Book directly from the pin." |
| **Book → confirm** | "Confirmation email sent, Google Calendar synced." |
| **AI Chatbot** *(type: "Do I have enough dental coverage for a cleaning?")* | "It knows the real number. It can book, cancel, update his profile — all through chat." |

---

## Handoffs

- **P1 → P2:** *"I'm [Name], I built the frontend."* [look at P2]
- **P2 → P3:** *"I'm [Name], I built the backend."* [look at P3]
- **P3 → P4:** *"[P4] will walk you through the technical layer and the business model."*
- **P4 → P1:** [sit, P1 stands]
- **P1 → Demo:** *"Let us show you."* [advance to slide 6]

---

## Judge Q&A (5 min — keep answers to 2 sentences max)

**"Why not just use your insurance app?"**
Insurance apps show your balance. NexaCare tells you what you're overdue for, finds the right clinic, and books it — the agent knows your real balance and can act on it.

**"How does the AI know my data?"**
Every call injects your live profile, benefits, and appointments server-side. The model reads from source on every turn — not stale chat history.

**"Go-to-market?"**
Freemium drives individual adoption, B2B employer contracts drive revenue. Clinic partnerships follow once we have volume.

**"Is health data safe?"**
Anthropic calls are server-side, Firebase rules are scoped per user. Designed for PIPEDA compliance from day one.

**"What's real vs. planned?"**
Everything in the demo is live — real Firebase, real Google Maps, real Anthropic, real Resend email, real Calendar sync, real PDF parsing. Clinic direct booking, rescheduling, and the HR dashboard are roadmap.

---

## Pre-Pitch Checklist

**Business (45 pts)**
- [ ] Problem scoped specifically — name the friction, not just "healthcare is broken"
- [ ] Socioeconomic angle: lower-income / newcomer populations named
- [ ] Solution logic is explicit — why software, why this approach
- [ ] Two revenue tracks + consumption-based cost structure mentioned
- [ ] Phase two (clinic partnerships) named as growth path
- [ ] Stats landed: $88B · 42% · 67%

**Technical (45 pts)**
- [ ] Full stack named on slide 4 and spoken aloud
- [ ] 26-tool agent explained with specifics — not just "we used AI"
- [ ] Server-side API key handling called out explicitly
- [ ] Scalability addressed: stateless, containerizable, consumption-based
- [ ] Innovation named: agentic, live-data-grounded, action-capable
- [ ] Devpost 2-3 min screencast submitted before 8AM March 22

**Presentation (10 pts)**
- [ ] Each speaker owns one block — no cross-talk
- [ ] Nobody reads the slides
- [ ] Handoffs practiced and clean
- [ ] Q&A answers stay under 2 sentences
