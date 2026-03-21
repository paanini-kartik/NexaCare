import {
  CalendarCheck,
  HeartPulse,
  ShieldCheck,
  UserRoundCog,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CheckupDashboardSection from "../components/CheckupDashboardSection";
import { healthNews, insurers, onboardingSteps, quickActions } from "../data/mockData";

const iconMap = {
  calendar: CalendarCheck,
  shield: ShieldCheck,
  heart: HeartPulse,
  user: UserRoundCog,
};

const actionTones = ["mint", "sky", "amber", "violet"];

function BenefitsSummaryCard() {
  const flat = insurers.flatMap((i) => i.categories);
  const totalLimit = flat.reduce((sum, c) => sum + c.annualLimit, 0);
  const totalUsed = flat.reduce((sum, c) => sum + c.used, 0);
  const remaining = totalLimit - totalUsed;
  const avgCoverage = Math.round((flat.reduce((sum, c) => sum + c.coverage, 0) / flat.length) * 100);

  return (
    <section className="wallet-card dashboard-benefits-hero" aria-label="Benefits summary">
      <p className="wallet-eyebrow">Total active benefits</p>
      <h3>${remaining.toLocaleString()}</h3>
      <div className="wallet-metrics">
        <span>Average coverage {avgCoverage}%</span>
        <span>Remaining across plans ${remaining.toLocaleString()}</span>
      </div>
    </section>
  );
}

function OnboardingRibbon() {
  const navigate = useNavigate();
  return (
    <section className="onboarding-vibe onboarding-vibe--beside-benefits" aria-labelledby="dash-onboard-heading">
      <div className="onboarding-vibe-head">
        <h2 id="dash-onboard-heading" className="title-vibe">
          Get set up
        </h2>
        <p>Tap a step to continue—two above, one stretched below.</p>
      </div>
      <div className="step-chip-track step-chip-track--grid">
        {onboardingSteps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={`step-chip step-chip--matte step-chip--matte-${index % 3} ${index === 2 ? "step-chip--span-bottom" : ""}`}
            onClick={() => navigate(step.route)}
          >
            <span className="step-chip-num">{index + 1}</span>
            <span className="step-chip-title">{step.title}</span>
            <span className="step-chip-desc">{step.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function QuickActionsVivid() {
  const navigate = useNavigate();
  return (
    <section className="quick-actions-vibe" aria-labelledby="dash-actions-heading">
      <h2 id="dash-actions-heading" className="title-vibe">
        Quick actions
      </h2>
      <p className="quick-actions-lead">Jump in with color—same routes, more energy.</p>
      <div className="action-vibe-grid">
        {quickActions.map((item, i) => {
          const Icon = iconMap[item.icon];
          const tone = actionTones[i % actionTones.length];
          return (
            <button
              key={item.id}
              type="button"
              className={`action-vibe-tile action-vibe-tile--${tone}`}
              onClick={() => navigate(item.route)}
            >
              <span className="action-vibe-icon">
                <Icon size={26} strokeWidth={1.65} />
              </span>
              <span className="action-vibe-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EmptyTransactions() {
  return (
    <section className="empty-vibe" aria-live="polite">
      <div className="empty-vibe-inner">
        <Wallet size={32} strokeWidth={1.5} className="empty-vibe-icon" />
        <h3>No claims yet</h3>
        <p>When things move, this area will fill in—think of it as breathing room for now.</p>
      </div>
    </section>
  );
}

function NewsFeed() {
  return (
    <section className="insights-vibe" aria-labelledby="dash-insights-heading">
      <h2 id="dash-insights-heading" className="title-vibe">
        Health insights
      </h2>
      <p className="insights-vibe-lead">Stories, not widgets.</p>
      <ul className="insight-list insight-list--vibe">
        {healthNews.map((item, i) => (
          <li key={item.id} className={`insight-row insight-row--${i === 0 ? "feature" : "std"}`}>
            <div className="insight-thumb">
              <img src={item.image} alt="" />
            </div>
            <div>
              <span className="insight-tag">{item.tag}</span>
              <h4>{item.title}</h4>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <div className="page-flow dashboard-flow">
      <header className="page-hero page-hero--alive dashboard-page-intro">
        <p className="page-hero-eyebrow">Today</p>
        <h1>Dashboard</h1>
        <p>
          Benefits, next steps, and care navigation in one flow. We kept the structure where data needs it and let
          everything else stay loose.
        </p>
      </header>

      <div className="dashboard-benefits-onboard">
        <BenefitsSummaryCard />
        <OnboardingRibbon />
      </div>

      <QuickActionsVivid />

      <CheckupDashboardSection />

      <div className="dashboard-lower dashboard-lower--alive">
        <EmptyTransactions />
        <NewsFeed />
      </div>
    </div>
  );
}
