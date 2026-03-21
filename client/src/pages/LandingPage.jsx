import { ArrowRight, BarChart3, CalendarClock, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Preventive care reminders delivered", value: "125K+" },
  { label: "Clinics and hospitals discoverable", value: "8,400+" },
  { label: "Average onboarding completion", value: "94%" },
  { label: "Emergency support response readiness", value: "24/7" },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Secure Health Profile",
    body: "Capture health events, allergies, and preferences in a structured profile you can keep up to date.",
  },
  {
    icon: CalendarClock,
    title: "Smart Scheduling",
    body: "Coordinate recommended checkups, appointments, and clinic preferences from one dashboard.",
  },
  {
    icon: BarChart3,
    title: "Benefits Intelligence",
    body: "Track multi-provider coverage and balances so members can make informed decisions faster.",
  },
];

export default function LandingPage() {
  return (
    <div className="landing-root">
      <header className="landing-nav">
        <div className="landing-brand">
          <span className="brand-icon">N</span>
          <div>
            <strong>NexaCare</strong>
            <p>Integrated Health Access</p>
          </div>
        </div>

        <div className="landing-actions">
          <Link className="ghost-btn" to="/auth">
            Log in
          </Link>
          <Link className="primary-btn" to="/auth">
            Get started <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero card-surface">
          <div>
            <span className="landing-kicker">
              <Sparkles size={14} /> Healthcare Navigation, Simplified
            </span>
            <h1>One modern portal for preventive care, benefits, and emergency readiness.</h1>
            <p>
              NexaCare helps individuals and employers coordinate checkups, understand coverage, and access urgent
              support through one professional, easy-to-use experience.
            </p>
            <div className="button-row">
              <Link className="primary-btn pulse-glow" to="/auth">
                Create account
              </Link>
              <Link className="secondary-btn" to="/auth">
                Sign in
              </Link>
            </div>
          </div>

          <div className="landing-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1200&q=80"
              alt="Medical professional reviewing patient data"
            />
          </div>
        </section>

        <section className="landing-stats">
          {stats.map((item) => (
            <article key={item.label} className="card-surface stat-card">
              <strong>{item.value}</strong>
              <p>{item.label}</p>
            </article>
          ))}
        </section>

        <section className="landing-features card-surface">
          <h2>Why teams and families choose NexaCare</h2>
          <div className="feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="feature-card">
                  <span className="feature-icon">
                    <Icon size={20} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
