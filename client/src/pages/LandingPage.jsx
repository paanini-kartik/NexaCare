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
  {
    label: "Canadian adults without a regular health care provider",
    value: "~15%",
    hint: "Statistics Canada’s Canadian Community Health Survey (CCHS) routinely finds that roughly one in seven Canadians don’t report having a regular family doctor or nurse practitioner—rates vary a lot by province and community.",
  },
  {
    label: "Canadians who find coordinating care or understanding costs and coverage difficult",
    value: "~4 in 10",
    hint: "Canadian Institute for Health Information (CIHI) patient-experience work and international surveys that include Canada show many people still struggle when hospital care, provincial plans, and work benefits overlap.",
  },
  {
    label: "Canadians who reported unmet or partly unmet health care needs",
    value: "~12%",
    hint: "CCHS tracks needs that weren’t met when people felt they should have been—national estimates are typically in the low teens, reflecting access, waits, and uncertainty about where to go next.",
  },
  {
    label: "Canadian internet users who looked up health or medical information online",
    value: "~9 in 10",
    hint: "Statistics Canada internet-use surveys show most connected Canadians search for symptoms, drugs, or providers—while annual maximums, co-pays, and reminders from insurers often stay in separate portals. NexaCare brings coverage, reminders, and local care into one workspace.",
  },
];

const trustPills = [
  "Preventive care at a glance",
  "Benefits in plain numbers",
  "Find care near you",
  "Emergency guidance",
];

const biteCards = [
  {
    icon: UserRound,
    title: "Health profile",
    body: "Keep allergies, history, and the clinics you trust in one profile so you’re not repeating the same story every time.",
  },
  {
    icon: Stethoscope,
    title: "Care reminders",
    body: "Simple rings for physical, dental, and vision care—plus optional services you choose to track.",
  },
  {
    icon: Wallet,
    title: "Benefits",
    body: "Annual limits, what you’ve used, and what’s left—pulled together from the plans you connect.",
  },
  {
    icon: Compass,
    title: "Health Compass",
    body: "Search and map nearby clinics, pharmacies, and hospitals by the type of care you need.",
  },
  {
    icon: Siren,
    title: "Emergency",
    body: "Direct steps when time matters, including words you can read aloud if it’s hard to speak.",
  },
  {
    icon: MessageCircle,
    title: "Assistant",
    body: "Ask questions about benefits and appointments from a single panel—there when you need it.",
  },
];

const flowSteps = [
  {
    step: "01",
    title: "Create an account",
    body: "Sign up in a minute. We’ll point you to the few things worth filling in first.",
  },
  {
    step: "02",
    title: "Add what you know",
    body: "Age, work, visits you remember, allergies, and favorite providers—all optional to start, easy to expand later.",
  },
  {
    step: "03",
    title: "See your dashboard",
    body: "Benefits, shortcuts, and care reminders update as your profile grows.",
  },
  {
    step: "04",
    title: "Stay ahead of care",
    body: "Book when you’re due, or find a clinic when something new comes up.",
  },
];

const modules = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    body: "Your home base: benefits snapshot, shortcuts, appointments, and care reminders.",
  },
  {
    icon: UserRound,
    title: "Health profile",
    body: "The details that should follow you—history, allergies, clinics, and visit tracking.",
  },
  {
    icon: MapPin,
    title: "Compass",
    body: "Explore providers on a map with filters for dental, vision, pharmacy, and more.",
  },
  {
    icon: ShieldCheck,
    title: "Benefits",
    body: "Coverage percentages, dollar limits, and usage—organized by plan and category.",
  },
  {
    icon: HeartPulse,
    title: "Emergency",
    body: "Call emergency services first—then use guides and a script if you need help communicating.",
  },
  {
    icon: BarChart3,
    title: "Employer",
    body: "For organizations: set roles, limits, and invite codes so employees see the right coverage.",
  },
];

const audiences = [
  {
    title: "Members & families",
    intro:
      "Coverage only helps if you can see what it includes, what you’ve used, and what’s next. NexaCare is built so everyday decisions—booking a cleaning, checking a limit, finding a clinic—don’t require a scavenger hunt.",
    quote:
      "When dental and medical live in one place, I actually look at it. The reminders are obvious without being noisy.",
    attribution: "Early member feedback",
    metrics: [
      { value: "3", label: "core preventive areas—physical, dental, and vision—on every account" },
      { value: "1", label: "shared profile for the facts you want every visit to use" },
    ],
  },
  {
    title: "Employers & HR teams",
    intro:
      "Employees engage with benefits when the experience feels consistent and calm. NexaCare gives them one familiar place for plans, limits, and care—so your team answers fewer one-off questions and spends more time on strategy.",
    quote:
      "We wanted something that felt serious on day one—clear enough for a new hire, detailed enough for someone managing a chronic condition.",
    attribution: "Benefits & HR partners",
    metrics: [
      { value: "Roles", label: "Job-based coverage templates your team controls" },
      { value: "Codes", label: "Simple invite flow so workers link work benefits without IT tickets" },
    ],
  },
];

const assurances = [
  {
    icon: Lock,
    title: "Your account, your information",
    body: "You decide what to save. Access is tied to your sign-in, and you can update or remove details anytime.",
  },
  {
    icon: Database,
    title: "Built to grow with you",
    body: "Whether you connect one plan or several, the same screens scale—no relearning a new tool every open enrollment.",
  },
  {
    icon: CheckCircle2,
    title: "Designed for clarity",
    body: "Straightforward layout and type so the important numbers—dates, dollars, coverage—stay in focus.",
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
              <p>Health & benefits in one place</p>
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
                Clearer care decisions
              </span>
              <h1 id="landing-hero-heading">Coverage you can read. Care you can plan.</h1>
              <p className="landing-lead landing-lead--wide">
                NexaCare turns dense benefits into clear numbers, nudges you before checkups slip, and helps you find the
                right kind of care nearby—so you’re not piecing it together from five different websites.
              </p>
              <ul className="landing-hero-bullets" aria-label="What you get">
                <li>At-a-glance reminders for physical, dental, and vision care</li>
                <li>A profile for allergies, history, and the providers you trust</li>
                <li>Maps, benefits, and emergency guidance in one sign-in</li>
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
                When people understand their plan and their options, they’re more likely to seek care at the right time.
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
              Why this matters
            </h2>
            <p className="landing-section-lead">
              Most friction around healthcare isn’t clinical—it’s administrative. NexaCare reduces that friction so booking,
              budgeting, and follow-up feel manageable.
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
              What you’ll find inside
            </h2>
            <p className="landing-section-lead landing-section-lead--center">
              Every item below matches a real part of the product after you sign in.
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
              From signup to a useful home screen
            </h2>
            <p className="landing-section-lead">
              A short setup, then a dashboard that stays useful as you add plans, visits, and optional services you care about.
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
              Main areas of the app
            </h2>
            <p className="landing-section-lead landing-section-lead--center">
              Dashboard, profile, Compass, benefits, emergency tools, and an employer view for organizations.
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
                    Open in app <ArrowRight size={14} strokeWidth={2} />
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
              Built for people who use their benefits—and for the teams responsible for offering them.
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
              Built for trust
            </h2>
            <p className="landing-section-lead">
              The same calm, direct experience runs from this page through every screen after you sign in.
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
            <h2 id="landing-final-heading">Get started with NexaCare</h2>
            <p>
              Create a free account, complete the short welcome steps, and explore your dashboard, profile, benefits, and
              Compass from one login.
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
          <span className="landing-footer-meta">Not for emergencies—call your local emergency number.</span>
          <Link to="/auth" className="landing-footer-link">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
