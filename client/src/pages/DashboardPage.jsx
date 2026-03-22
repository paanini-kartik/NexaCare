import {
  CalendarCheck,
  Check,
  HeartPulse,
  ShieldCheck,
  UserRoundCog,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CheckupDashboardSection from "../components/CheckupDashboardSection";
import { useAuth } from "../contexts/AuthContext";
import { isMemberDashboardOnboardingDismissedSession } from "../lib/memberDashboardOnboarding";
import {
  employerOnboardingSteps,
  employerQuickActions,
  onboardingSteps,
  quickActions,
} from "../data/mockData";

const iconMap = {
  calendar: CalendarCheck,
  shield: ShieldCheck,
  heart: HeartPulse,
  user: UserRoundCog,
};

const actionTones = ["mint", "sky", "amber", "violet"];

function memberProfileAgeComplete(age) {
  const s = String(age ?? "").trim();
  if (!s) return false;
  const n = Number(s);
  return !Number.isNaN(n) && n >= 0 && n <= 130;
}

function MemberBenefitsSummaryCard() {
  const { benefitDashboardSummary, benefitContextDescription, effectiveInsurers } = useAuth();
  const { remaining, avgCoverage } = benefitDashboardSummary;
  const hasCategories = effectiveInsurers.some((i) => (i.categories || []).length > 0);

  return (
    <section className="wallet-card dashboard-benefits-hero" aria-label="Benefits summary">
      <p className="wallet-eyebrow">Total active benefits</p>
      {hasCategories ? (
        <>
          <h3>${remaining.toLocaleString()}</h3>
          <div className="wallet-metrics">
            <span>Average coverage {avgCoverage}%</span>
            <span>Remaining across plans ${remaining.toLocaleString()}</span>
          </div>
        </>
      ) : (
        <>
          <h3>—</h3>
          <div className="wallet-metrics">
            <span>No plan categories yet</span>
            <span>Add employer keys or manual providers in Settings, or define roles in Employer Hub.</span>
          </div>
        </>
      )}
      {benefitContextDescription ? (
        <p className="wallet-footnote">{benefitContextDescription}</p>
      ) : (
        <p className="wallet-footnote">Nothing linked until you add benefit sources.</p>
      )}
    </section>
  );
}

function EmployerProgramSummaryCard() {
  const { employerProgramSummary, myEnterprise } = useAuth();
  const summary = employerProgramSummary || {
    totalAnnualLimit: 0,
    byLine: { Optometry: 0, Dental: 0, Physical: 0 },
    roleCount: 0,
  };

  return (
    <section className="wallet-card dashboard-benefits-hero" aria-label="Worker benefit program totals">
      <p className="wallet-eyebrow">Benefits offered to workers</p>
      <h3>${summary.totalAnnualLimit.toLocaleString()}</h3>
      <div className="wallet-metrics">
        <span>
          Total annual limits across <strong>{summary.roleCount}</strong> job role
          {summary.roleCount === 1 ? "" : "s"} (summed plan design, not personal usage)
        </span>
      </div>
      <ul className="wallet-footnote" style={{ margin: "0.75rem 0 0", paddingLeft: "1.1rem" }}>
        <li>Optometry: ${summary.byLine.Optometry.toLocaleString()}</li>
        <li>Dental: ${summary.byLine.Dental.toLocaleString()}</li>
        <li>Physical: ${summary.byLine.Physical.toLocaleString()}</li>
      </ul>
      <p className="wallet-footnote" style={{ marginTop: "0.5rem" }}>
        {myEnterprise?.name ? (
          <>
            Configured in <strong>Employer Hub</strong> for <strong>{myEnterprise.name}</strong>. You do not have a
            personal member benefit wallet.
          </>
        ) : (
          <>Link an organization in Employer Hub to configure role templates.</>
        )}
      </p>
    </section>
  );
}

function OnboardingRibbon({ steps, stepComplete }) {
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
        {steps.map((step, index) => {
          const done = Boolean(stepComplete?.[index]);
          return (
            <button
              key={step.id}
              type="button"
              className={`step-chip step-chip--matte step-chip--matte-${index % 3} ${index === 2 ? "step-chip--span-bottom" : ""} ${done ? "step-chip--complete" : ""}`}
              onClick={() => navigate(step.route)}
              aria-label={`${step.title}${done ? " — completed" : ""}`}
            >
              <span className="step-chip-topline">
                <span className={`step-chip-num ${done ? "step-chip-num--complete" : ""}`}>
                  {done ? <Check size={18} strokeWidth={2.75} aria-hidden /> : index + 1}
                </span>
                {done ? (
                  <span className="step-chip-done-label" aria-hidden>
                    Done
                  </span>
                ) : null}
              </span>
              <span className="step-chip-title">{step.title}</span>
              <span className="step-chip-desc">{step.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function QuickActionsVivid({ items }) {
  const navigate = useNavigate();
  return (
    <section className="quick-actions-vibe" aria-labelledby="dash-actions-heading">
      <h2 id="dash-actions-heading" className="title-vibe">
        Quick actions
      </h2>
      <p className="quick-actions-lead">Jump in with color—same routes, more energy.</p>
      <div className="action-vibe-grid">
        {items.map((item, i) => {
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

function NewsFeed({ employerMode }) {
  return (
    <section className="insights-vibe" aria-labelledby="dash-insights-heading">
      <h2 id="dash-insights-heading" className="title-vibe">
        {employerMode ? "Organization" : "Health insights"}
      </h2>
      <p className="insights-vibe-lead">
        {employerMode
          ? "Member-facing health tools stay on employee accounts. You manage benefit templates and keys from Employer Hub and Settings."
          : "Your own notes and care context will live here as you use the app."}
      </p>
      <div className="empty-vibe" aria-live="polite">
        <div className="empty-vibe-inner">
          <h3>No feed items</h3>
          <p>
            {employerMode
              ? "We do not show sample data—configure roles and share invite keys when you are ready."
              : "We do not inject sample articles—complete your health profile and benefits to keep everything personal."}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { user, healthProfile } = useAuth();
  const isEmployer = user?.accountType === "employer";
  const sessionDismissed = !isEmployer && isMemberDashboardOnboardingDismissedSession();
  const memberOnboardingDismissed =
    !isEmployer &&
    (sessionDismissed || Boolean(healthProfile.dashboardOnboardingDismissed));
  const memberStepComplete = [
    memberProfileAgeComplete(healthProfile.age),
    Boolean(healthProfile.onboardingCalendarConnected),
    false,
  ];

  return (
    <div className="page-flow dashboard-flow">
      <header className="page-hero page-hero--alive dashboard-page-intro">
        <p className="page-hero-eyebrow">Today</p>
        <h1>Dashboard</h1>
        <p>
          {isEmployer
            ? "Organization overview: totals from the benefit templates you offer workers—not a personal member wallet."
            : "Benefits, next steps, and care navigation in one flow. We kept the structure where data needs it and let everything else stay loose."}
        </p>
      </header>

      <div
        className={`dashboard-benefits-onboard${memberOnboardingDismissed ? " dashboard-benefits-onboard--full" : ""}`}
      >
        {isEmployer ? <EmployerProgramSummaryCard /> : <MemberBenefitsSummaryCard />}
        {isEmployer ? (
          <OnboardingRibbon steps={employerOnboardingSteps} />
        ) : memberOnboardingDismissed ? null : (
          <OnboardingRibbon steps={onboardingSteps} stepComplete={memberStepComplete} />
        )}
      </div>

      <QuickActionsVivid items={isEmployer ? employerQuickActions : quickActions} />

      {isEmployer ? null : <CheckupDashboardSection />}

      <div className="dashboard-lower dashboard-lower--alive">
        <EmptyTransactions />
        <NewsFeed employerMode={isEmployer} />
      </div>
    </div>
  );
}
