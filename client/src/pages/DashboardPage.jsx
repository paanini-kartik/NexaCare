import {
  CalendarCheck,
  HeartPulse,
  ShieldCheck,
  UserRoundCog,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { healthNews, insurers, onboardingSteps, quickActions } from "../data/mockData";

const iconMap = {
  calendar: CalendarCheck,
  shield: ShieldCheck,
  heart: HeartPulse,
  user: UserRoundCog,
};

function BenefitsSummaryCard() {
  const flat = insurers.flatMap((i) => i.categories);
  const totalLimit = flat.reduce((sum, c) => sum + c.annualLimit, 0);
  const totalUsed = flat.reduce((sum, c) => sum + c.used, 0);
  const remaining = totalLimit - totalUsed;
  const avgCoverage = Math.round((flat.reduce((sum, c) => sum + c.coverage, 0) / flat.length) * 100);

  return (
    <section className="wallet-card">
      <p>Total Active Benefits</p>
      <h3>${remaining.toLocaleString()}</h3>
      <div className="wallet-metrics">
        <span>Average Coverage: {avgCoverage}%</span>
        <span>Total Remaining: ${remaining.toLocaleString()}</span>
      </div>
    </section>
  );
}

function OnboardingBanner() {
  const navigate = useNavigate();
  return (
    <section className="card-surface banner-card">
      <h2>Onboarding Checklist</h2>
      <p>Complete each step to unlock the most accurate health and scheduling guidance.</p>
      <div className="step-cards">
        {onboardingSteps.map((step, index) => (
          <button key={step.id} type="button" className="step-card" onClick={() => navigate(step.route)}>
            <span>{index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function QuickActionsGrid() {
  const navigate = useNavigate();
  return (
    <section className="card-surface section-card">
      <h3>Quick Actions</h3>
      <div className="actions-grid">
        {quickActions.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <button key={item.id} type="button" className="action-card" onClick={() => navigate(item.route)}>
              <span className="action-icon"><Icon size={24} /></span>
              <strong>{item.label}</strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EmptyTransactions() {
  return (
    <section className="card-surface empty-state">
      <div className="empty-icon"><Wallet size={30} /></div>
      <h3>No claims activity yet</h3>
      <p>Once appointments and claims are processed, detailed insurance transactions appear here.</p>
    </section>
  );
}

function NewsFeed() {
  return (
    <section className="card-surface section-card">
      <h3>Health Insights</h3>
      <div className="news-list">
        {healthNews.map((item) => (
          <article key={item.id} className="news-item">
            <div className="news-image-wrap"><img src={item.image} alt={item.title} /></div>
            <div>
              <span>{item.tag}</span>
              <h4>{item.title}</h4>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <div className="dashboard-grid">
      <OnboardingBanner />
      <BenefitsSummaryCard />
      <QuickActionsGrid />
      <EmptyTransactions />
      <NewsFeed />
    </div>
  );
}
