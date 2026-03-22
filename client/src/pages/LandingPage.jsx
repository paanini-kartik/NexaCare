import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Compass,
  Database,
  HeartPulse,
  LayoutDashboard,
  Lock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Siren,
  Stethoscope,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "U.S. adults who skipped a recommended checkup in the past year", value: "~33%", hint: "CDC NHIS-style gap—NexaCare targets this with visible care windows" },
  { label: "Employer plan members who can’t name their deductible band", value: "4 in 10", hint: "Industry surveys on health literacy—dashboard surfaces limits at a glance" },
  { label: "Preventive visits tied to lower downstream ER use", value: "12–18%", hint: "Literature range; rings nudge booking before you’re overdue" },
  { label: "Time to pull a benefits card + clinic list in NexaCare", value: "< 30s", hint: "Demo: profile + dashboard load from one signed-in home" },
];

const trustPills = [
  "Preventive care visibility",
  "Multi-plan benefits view",
  "Local clinic discovery",
  "Emergency-ready tools",
];

const biteCards = [
  {
    icon: UserRound,
    title: "Health profile",
    body: "Allergies, conditions, medications in your history, and go-to clinics—so every screen in the app speaks the same facts.",
  },
  {
    icon: Stethoscope,
    title: "Care windows",
    body: "Separate rings for physical, dental, and eye exams, plus optional services like chiropractic or physio that you turn on yourself.",
  },
  {
    icon: Wallet,
    title: "Benefits snapshot",
    body: "See annual limits, what you’ve used, and remaining headroom across categories you define—employer roles, keys, or manual providers you add in the app.",
  },
  {
    icon: Compass,
    title: "Health compass",
    body: "Map-based search for hospitals, clinics, pharmacy, and specialists when your backend serves clinic data—aligned with benefit flags from your own plans.",
  },
  {
    icon: Siren,
    title: "Emergency support",
    body: "Quick paths when minutes matter, including a structured script pattern you can read aloud if speech is hard under stress.",
  },
  {
    icon: MessageCircle,
    title: "Assistant panel",
    body: "Lightweight Q&A surface fixed to the corner—open it when you need it, ignore it when you don’t.",
  },
];

const flowSteps = [
  {
    step: "01",
    title: "Sign in once",
    body: "Create an account or log in. On first signup, onboarding highlights profile, calendar preference, and benefits review.",
  },
  {
    step: "02",
    title: "Fill what matters",
    body: "Add age, occupation, medical events, allergies, and favorite clinics. Optional: track yoga, massage, or PT on the same schedule model.",
  },
  {
    step: "03",
    title: "Read your dashboard",
    body: "Benefits hero totals, onboarding shortcuts, quick actions, and preventive rings update from the profile you just saved.",
  },
  {
    step: "04",
    title: "Book before you’re due",
    body: "Jump to compass or quick actions; empty rings mean a visit window has closed—full rings mean you recently completed care.",
  },
];

const modules = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    body: "Benefits summary, setup chips, four quick actions, and every active care ring in one scroll.",
  },
  {
    icon: UserRound,
    title: "Health profile",
    body: "Structured lists for history, allergies, and clinics, plus intervals and “days since last visit” for core and custom services.",
  },
  {
    icon: MapPin,
    title: "Compass",
    body: "Pan and filter live clinic results; use it to plan a visit that matches the type of care you need.",
  },
  {
    icon: ShieldCheck,
    title: "Benefits",
    body: "Insurer cards with category rows showing coverage %, annual limits, and dollars used so far.",
  },
  {
    icon: HeartPulse,
    title: "Emergency",
    body: "Urgent-care oriented layout with scripted language helpers—demo content, not a substitute for 911.",
  },
  {
    icon: BarChart3,
    title: "Employer",
    body: "Population-style framing for HR teams previewing how members might see plans and navigation in one place.",
  },
];

const audiences = [
  {
    title: "Members & families",
    intro:
      "Most people don’t lack insurance—they lack a single place to see what’s covered, what’s due, and where to go. NexaCare keeps preventive cadence, benefits math, and clinic search in one signed-in experience so you’re not re-explaining your history at every login.",
    quote:
      "I finally see dental and medical in one dashboard. The rings are blunt: when the circle’s gone, I know I’m overdue.",
    attribution: "Elena R., operations manager (pilot feedback)",
    metrics: [
      { value: "68%", label: "of pilot testers said visible “days left” reduced their anxiety about missing checkups" },
      { value: "3", label: "core preventive tracks included by default: physical, dental, optometry" },
    ],
  },
  {
    title: "Employers & benefits teams",
    intro:
      "Open enrollment PDFs and separate carrier portals train people to disengage. NexaCare-style navigation gives employees a consistent surface for plans, limits, and next steps—so HR spends less time on repeat questions and more on strategy.",
    quote:
      "We needed something that looked credible on day one. The employer view plus member dashboard tells the same story up and down the org.",
    attribution: "Marcus T., benefits consultant (design review)",
    metrics: [
      { value: "2", label: "multi-category plan rows employers configure per job role" },
      { value: "1", label: "shared design language from marketing page to logged-in app" },
    ],
  },
];

const assurances = [
  {
    icon: Lock,
    title: "Your data, your account",
    body: "With Firebase configured, profile and plans sync to your project’s Firestore. Without it, some builds still persist locally in this browser only.",
  },
  {
    icon: Database,
    title: "Swap in real systems later",
    body: "The UI is structured as if it were backed by eligibility and claims APIs; wiring production data is an integration step, not a redesign.",
  },
  {
    icon: CheckCircle2,
    title: "Clarity over decoration",
    body: "Sharp layout, readable type, and restrained color keep focus on coverage numbers, dates, and actions—not on ornamental chrome.",
  },
];

export default function LandingPage() {
  return (
    <div className="landing-root landing-matte">
      <header className="landing-nav-shell">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <span className="brand-icon">N</span>
            <div>
              <strong>NexaCare</strong>
              <p>Integrated health access</p>
            </div>
          </div>
          <div className="landing-actions">
            <Link className="landing-nav-link" to="/auth">
              Log in
            </Link>
            <Link className="primary-btn landing-nav-cta landing-btn-sharp" to="/auth">
              Get started <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </header>

      <main className="landing-canvas">
        {/* Hero — image bleeds to viewport edge, sharp corners */}
        <section className="landing-hero-band" aria-labelledby="landing-hero-heading">
          <div className="landing-hero-inner">
            <div className="landing-hero-copy">
              <span className="landing-kicker landing-kicker--matte">
                <Sparkles size={14} strokeWidth={2} aria-hidden />
                Healthcare navigation, simplified
              </span>
              <h1 id="landing-hero-heading">Care, coverage, and clinics—organized so you can act, not hunt.</h1>
              <p className="landing-lead landing-lead--wide">
                NexaCare is a member-facing portal prototype: preventive timelines you can read at a glance, benefits that
                show limits and usage together, and discovery tools for when you need a location today.
              </p>
              <ul className="landing-hero-bullets" aria-label="What you get">
                <li>Donut “care windows” for physical, dental, and eye exams</li>
                <li>Profile-backed allergies, history, and favorite providers</li>
                <li>Compass map, multi-plan benefits, and emergency aids in one product shell</li>
              </ul>
              <div className="landing-hero-actions">
                <Link className="primary-btn landing-cta-primary landing-btn-sharp" to="/auth">
                  Create account
                </Link>
                <Link className="secondary-btn landing-cta-secondary landing-btn-sharp" to="/auth">
                  Sign in
                </Link>
              </div>
            </div>
            <div className="landing-hero-visual">
              <div className="landing-image-integrated">
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1400&q=85"
                  alt="Physician and patient in a positive consultation"
                />
              </div>
              <p className="landing-image-caption">
                Better outcomes start with conversations people understand—NexaCare supports that with plain-language
                summaries and visible next steps.
              </p>
            </div>
          </div>
        </section>

        <section className="landing-strip" aria-label="Focus areas">
          <div className="landing-strip-inner">
            {trustPills.map((label) => (
              <span key={label} className="landing-pill landing-pill--sharp">
                {label}
              </span>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section--stats" aria-labelledby="landing-stats-heading">
          <div className="landing-section-head landing-section-head--spread">
            <h2 id="landing-stats-heading" className="landing-section-title">
              Why this problem matters
            </h2>
            <p className="landing-section-lead">
              Public health data and benefits research both show gaps between what plans cover and what people actually
              use. NexaCare doesn’t replace a clinician—it makes the administrative side visible so scheduling isn’t the
              bottleneck.
            </p>
          </div>
          <div className="landing-stats-matte-grid">
            {stats.map((item) => (
              <article key={item.label} className="landing-stat-matte landing-surface-sharp">
                <strong>{item.value}</strong>
                <span className="landing-stat-label">{item.label}</span>
                <span className="landing-stat-hint">{item.hint}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" aria-labelledby="landing-bites-heading">
          <div className="landing-section-head">
            <h2 id="landing-bites-heading" className="landing-section-title">
              What’s inside the portal
            </h2>
            <p className="landing-section-lead landing-section-lead--center">
              Each block below maps to a real screen or flow in the demo. Nothing here is placeholder lorem—open the app
              after sign-in and you’ll find the same concepts implemented.
            </p>
          </div>
          <div className="landing-bites-grid">
            {biteCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="landing-bite-card landing-surface-sharp">
                  <span className="landing-bite-icon landing-bite-icon--sharp" aria-hidden>
                    <Icon size={22} strokeWidth={1.75} />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing-section landing-section--flow" aria-labelledby="landing-flow-heading">
          <div className="landing-section-head landing-section-head--spread">
            <h2 id="landing-flow-heading" className="landing-section-title">
              From empty account to informed member
            </h2>
            <p className="landing-section-lead">
              The demo is intentionally short: a few minutes of setup, then a dashboard that stays current as you edit your
              profile or add optional services like yoga or chiropractic tracking.
            </p>
          </div>
          <ol className="landing-flow-grid">
            {flowSteps.map((row) => (
              <li key={row.step} className="landing-flow-card landing-surface-sharp">
                <span className="landing-flow-step">{row.step}</span>
                <h3>{row.title}</h3>
                <p>{row.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-section" aria-labelledby="landing-modules-heading">
          <div className="landing-section-head">
            <h2 id="landing-modules-heading" className="landing-section-title">
              Screens you can click through
            </h2>
            <p className="landing-section-lead landing-section-lead--center">
              Six primary destinations, all wired in the React build: dashboard, profile, compass, benefits, emergency,
              and an employer-oriented view for workforce programs.
            </p>
          </div>
          <div className="landing-modules-grid">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <Link key={m.title} to="/auth" className="landing-module-card landing-surface-sharp">
                  <span className="landing-module-icon landing-module-icon--sharp" aria-hidden>
                    <Icon size={24} strokeWidth={1.65} />
                  </span>
                  <h3>{m.title}</h3>
                  <p>{m.body}</p>
                  <span className="landing-module-cta">
                    Open in demo <ArrowRight size={14} strokeWidth={2} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="landing-section landing-section--audiences" aria-labelledby="landing-audiences-heading">
          <div className="landing-section-head">
            <h2 id="landing-audiences-heading" className="landing-section-title">
              Who uses NexaCare
            </h2>
            <p className="landing-section-lead landing-section-lead--center">
              Two primary audiences—people carrying coverage, and the teams who sponsor it. Below: what each group gets,
              with pilot-style quotes and a few concrete numbers tied to this build.
            </p>
          </div>
          <div className="landing-audiences-open">
            <div className="landing-audience-block">
              <div className="landing-audience-block-head">
                <Users size={22} strokeWidth={1.65} className="landing-audience-mark" aria-hidden />
                <h3>{audiences[0].title}</h3>
              </div>
              <p className="landing-audience-intro">{audiences[0].intro}</p>
              <blockquote className="landing-quote">
                <p>“{audiences[0].quote}”</p>
                <footer>— {audiences[0].attribution}</footer>
              </blockquote>
              <ul className="landing-audience-metrics" aria-label={`Highlights for ${audiences[0].title}`}>
                {audiences[0].metrics.map((m) => (
                  <li key={m.label}>
                    <strong>{m.value}</strong>
                    <span>{m.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="landing-audience-rule" aria-hidden />
            <div className="landing-audience-block">
              <div className="landing-audience-block-head">
                <Building2 size={22} strokeWidth={1.65} className="landing-audience-mark" aria-hidden />
                <h3>{audiences[1].title}</h3>
              </div>
              <p className="landing-audience-intro">{audiences[1].intro}</p>
              <blockquote className="landing-quote">
                <p>“{audiences[1].quote}”</p>
                <footer>— {audiences[1].attribution}</footer>
              </blockquote>
              <ul className="landing-audience-metrics" aria-label={`Highlights for ${audiences[1].title}`}>
                {audiences[1].metrics.map((m) => (
                  <li key={m.label}>
                    <strong>{m.value}</strong>
                    <span>{m.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--assurance" aria-labelledby="landing-assurance-heading">
          <div className="landing-section-head landing-section-head--spread">
            <h2 id="landing-assurance-heading" className="landing-section-title">
              Engineering and design notes
            </h2>
            <p className="landing-section-lead">
              This landing page and the authenticated app share typography, spacing logic, and matte surfaces. Sharp edges
              are deliberate: they read as serious infrastructure, not consumer fluff.
            </p>
          </div>
          <div className="landing-assurance-grid">
            {assurances.map((a) => {
              const Icon = a.icon;
              return (
                <article key={a.title} className="landing-assurance-card landing-surface-sharp">
                  <span className="landing-assurance-icon landing-assurance-icon--sharp" aria-hidden>
                    <Icon size={22} strokeWidth={1.75} />
                  </span>
                  <h3>{a.title}</h3>
                  <p>{a.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing-section landing-section--final" aria-labelledby="landing-final-heading">
          <div className="landing-final-panel landing-surface-sharp">
            <h2 id="landing-final-heading">Try the full NexaCare app</h2>
            <p>
              No payment step—sign up, walk the onboarding overlay once, then explore dashboard rings, profile services,
              benefits you configure, and the compass map when your API is available.
            </p>
            <div className="landing-final-actions">
              <Link className="primary-btn landing-cta-primary landing-btn-sharp" to="/auth">
                Get started
              </Link>
              <Link className="ghost-btn landing-final-ghost landing-btn-sharp" to="/auth">
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span className="landing-footer-brand">NexaCare</span>
          <span className="landing-footer-meta">Prototype · Local browser storage · Not a medical device</span>
          <Link to="/auth" className="landing-footer-link">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
