import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  Check,
  Clock,
  Eye,
  HeartPulse,
  MapPin,
  Paperclip,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UserRoundCog,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CheckupDashboardSection from "../components/CheckupDashboardSection";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch, apiUrl } from "../lib/api";
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

// ── Greeting ────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ appointments, benefits }) {
  const upcoming = (appointments ?? [])
    .filter((a) => a.status === "upcoming")
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const nextAppt = upcoming[0];
  const nextApptLabel = nextAppt
    ? new Date(nextAppt.date).toLocaleDateString("en-CA", { month: "short", day: "numeric" })
    : "None booked";

  const totalRemaining = benefits?.hasAny
    ? (benefits.dental.total - benefits.dental.used) +
      (benefits.vision.total - benefits.vision.used) +
      (benefits.physio.total - benefits.physio.used)
    : null;

  return (
    <div className="dash-stats-bar">
      <div className="dash-stat">
        <CalendarDays size={15} strokeWidth={1.75} className="dash-stat-icon" />
        <div>
          <span className="dash-stat-label">Next appointment</span>
          <span className="dash-stat-value">{nextApptLabel}</span>
        </div>
      </div>
      <div className="dash-stat-divider" />
      <div className="dash-stat">
        <Wallet size={15} strokeWidth={1.75} className="dash-stat-icon" />
        <div>
          <span className="dash-stat-label">Benefits remaining</span>
          <span className="dash-stat-value">
            {totalRemaining !== null ? `$${totalRemaining.toLocaleString()}` : "—"}
          </span>
        </div>
      </div>
      <div className="dash-stat-divider" />
      <div className="dash-stat">
        <Clock size={15} strokeWidth={1.75} className="dash-stat-icon" />
        <div>
          <span className="dash-stat-label">Appointments this month</span>
          <span className="dash-stat-value">
            {upcoming.filter((a) => {
              const d = new Date(a.date);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Visual benefits summary card ─────────────────────────────────────────────
function MemberBenefitsSummaryCard({ benefits }) {
  const { benefitContextDescription, effectiveInsurers } = useAuth();
  const hasCategories = effectiveInsurers.some((i) => (i.categories || []).length > 0);

  const rows = [
    { label: "Dental",  key: "dental",  Icon: Stethoscope },
    { label: "Vision",  key: "vision",  Icon: Eye },
    { label: "Physio",  key: "physio",  Icon: Activity },
  ];

  return (
    <section className="wallet-card dashboard-benefits-hero" aria-label="Benefits summary">
      <p className="wallet-eyebrow">Active benefits</p>
      {hasCategories && benefits?.hasAny ? (
        <>
          <div className="dash-benefit-bars">
            {rows.map(({ label, key, Icon }) => {
              const used  = benefits[key]?.used  ?? 0;
              const total = benefits[key]?.total ?? 0;
              if (!total) return null;
              const pct   = Math.min((used / total) * 100, 100);
              const rem   = total - used;
              const color = pct > 80 ? "#dc2626" : pct > 50 ? "#d97706" : "var(--primary)";
              return (
                <div key={key} className="dash-benefit-bar-row">
                  <div className="dash-benefit-bar-label">
                    <span className="dash-benefit-bar-icon">
                      <Icon size={13} strokeWidth={1.75} style={{ color }} />
                    </span>
                    <span>{label}</span>
                    <span className="dash-benefit-bar-rem" style={{ color }}>${rem.toLocaleString()} left</span>
                  </div>
                  <div className="dash-benefit-bar-track">
                    <div className="dash-benefit-bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
          {benefitContextDescription && (
            <p className="wallet-footnote" style={{ marginTop: "1rem" }}>{benefitContextDescription}</p>
          )}
        </>
      ) : (
        <>
          <h3 style={{ marginBottom: "0.5rem" }}>—</h3>
          <div className="wallet-metrics">
            <span>No plan categories yet</span>
            <span>Add employer keys or manual providers in Settings to see your coverage here.</span>
          </div>
        </>
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
          {summary.roleCount === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="wallet-footnote" style={{ margin: "0.75rem 0 0", paddingLeft: "1.1rem" }}>
        <li>Optometry: ${summary.byLine.Optometry.toLocaleString()}</li>
        <li>Dental: ${summary.byLine.Dental.toLocaleString()}</li>
        <li>Physical: ${summary.byLine.Physical.toLocaleString()}</li>
      </ul>
      <p className="wallet-footnote" style={{ marginTop: "0.5rem" }}>
        {myEnterprise?.name
          ? <>Configured in <strong>Employer Hub</strong> for <strong>{myEnterprise.name}</strong>.</>
          : <>Link an organization in Employer Hub to configure role templates.</>}
      </p>
    </section>
  );
}

// ── Onboarding ribbon ────────────────────────────────────────────────────────
function OnboardingRibbon({ steps, stepComplete }) {
  const navigate = useNavigate();
  return (
    <section className="onboarding-vibe onboarding-vibe--beside-benefits" aria-labelledby="dash-onboard-heading">
      <div className="onboarding-vibe-head">
        <h2 id="dash-onboard-heading" className="title-vibe">Get set up</h2>
        <p>Tap a step to continue.</p>
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
                {done && <span className="step-chip-done-label" aria-hidden>Done</span>}
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

// ── Quick actions ─────────────────────────────────────────────────────────────
function QuickActionsVivid({ items, extraActions }) {
  const navigate = useNavigate();
  const allItems = [...items, ...(extraActions ?? [])];
  return (
    <section className="quick-actions-vibe" aria-labelledby="dash-actions-heading">
      <h2 id="dash-actions-heading" className="title-vibe">Quick actions</h2>
      <div className="action-vibe-grid action-vibe-grid--wide">
        {allItems.map((item, i) => {
          const Icon = item.IconComponent ?? iconMap[item.icon] ?? CalendarCheck;
          const tone = actionTones[i % actionTones.length];
          return (
            <button
              key={item.id}
              type="button"
              className={`action-vibe-tile action-vibe-tile--${tone}`}
              onClick={() => item.onClick ? item.onClick() : navigate(item.route)}
            >
              <span className="action-vibe-icon"><Icon size={26} strokeWidth={1.65} /></span>
              <span className="action-vibe-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Upcoming appointments ─────────────────────────────────────────────────────
function UpcomingAppointments({ appointments, userEmail }) {
  const navigate = useNavigate();
  const upcoming = (appointments ?? [])
    .filter((a) => a.status === "upcoming")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const [cancelling, setCancelling] = useState(null);

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await apiFetch(`/api/appointments/${id}`, { method: "DELETE" });
      window.location.reload();
    } catch {
      setCancelling(null);
    }
  };

  const typeIcon = (type = "") => {
    const t = type.toLowerCase();
    if (t.includes("dental") || t.includes("cleaning")) return <Stethoscope size={16} strokeWidth={1.75} />;
    if (t.includes("vision") || t.includes("eye") || t.includes("optom")) return <Eye size={16} strokeWidth={1.75} />;
    if (t.includes("physio")) return <Activity size={16} strokeWidth={1.75} />;
    return <CalendarDays size={16} strokeWidth={1.75} />;
  };

  return (
    <section className="dash-appointments-section" aria-labelledby="dash-appts-heading">
      <div className="dash-section-head">
        <h2 id="dash-appts-heading" className="title-vibe">Upcoming appointments</h2>
        <button className="dash-section-link" type="button" onClick={() => navigate("/health-compass")}>
          Book new
        </button>
      </div>

      {upcoming.length === 0 ? (
        <div className="dash-empty-card">
          <CalendarDays size={28} strokeWidth={1.5} />
          <div>
            <strong>No upcoming appointments</strong>
            <p>Ask the AI assistant to book one, or browse clinics on the Health Compass.</p>
          </div>
          <button className="primary-btn" type="button" onClick={() => navigate("/health-compass")}>
            Find a clinic
          </button>
        </div>
      ) : (
        <div className="dash-appt-list">
          {upcoming.map((a) => {
            const date = new Date(a.date);
            const day  = date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
            const time = date.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={a.id} className="dash-appt-card">
                <div className="dash-appt-date-block">
                  <span className="dash-appt-month">{date.toLocaleDateString("en-CA", { month: "short" })}</span>
                  <span className="dash-appt-day">{date.getDate()}</span>
                </div>
                <div className="dash-appt-icon-wrap">{typeIcon(a.type)}</div>
                <div className="dash-appt-info">
                  <strong>{a.type}</strong>
                  <span>{a.clinicName}</span>
                  <span className="dash-appt-time">{day} · {time} · {a.duration} min</span>
                </div>
                <button
                  className="dash-appt-cancel"
                  type="button"
                  disabled={cancelling === a.id}
                  onClick={() => handleCancel(a.id)}
                  aria-label="Cancel appointment"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── AI recommendations feed ──────────────────────────────────────────────────
function AIRecommendations({ user, benefits, appointments }) {
  const [recs, setRecs]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    const key = `nexacare:recs:${user.email}:${new Date().toDateString()}`;
    const cached = sessionStorage.getItem(key);
    if (cached) { setRecs(JSON.parse(cached)); setLoading(false); return; }

    const past = (appointments ?? []).filter((a) => a.status === "past");
    const lastDental = past.find((a) => a.type?.toLowerCase().includes("dental"))?.date ?? "never";
    const lastEye    = past.find((a) => a.type?.toLowerCase().includes("vision") || a.type?.toLowerCase().includes("eye"))?.date ?? "never";
    const lastCheckup= past.find((a) => a.type?.toLowerCase().includes("checkup") || a.type?.toLowerCase().includes("general"))?.date ?? "never";

    apiFetch("/api/ai/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: user.age ?? null,
        occupation: user.occupation ?? "unknown",
        lastDental,
        lastEye,
        lastCheckup,
        unusedDental: (benefits?.dental?.total ?? 0) - (benefits?.dental?.used ?? 0),
        unusedVision: (benefits?.vision?.total ?? 0) - (benefits?.vision?.used ?? 0),
      }),
    })
      .then((r) => r.json())
      .then((parsed) => {
        sessionStorage.setItem(key, JSON.stringify(parsed));
        setRecs(parsed);
      })
      .catch(() => setRecs([]))
      .finally(() => setLoading(false));
  }, [user?.email]);

  const urgencyConfig = {
    high:   { color: "#dc2626", bg: "#fee2e2", Icon: AlertTriangle },
    medium: { color: "#d97706", bg: "#fef3c7", Icon: TrendingUp },
    low:    { color: "#16a34a", bg: "#dcfce7", Icon: ShieldCheck },
  };

  return (
    <section className="dash-recs-section" aria-labelledby="dash-recs-heading">
      <div className="dash-section-head">
        <h2 id="dash-recs-heading" className="title-vibe">Suggested for you</h2>
        <span className="dash-ai-badge">AI</span>
      </div>

      {loading ? (
        <div className="dash-recs-loading">
          <div className="dash-rec-skeleton" />
          <div className="dash-rec-skeleton" />
          <div className="dash-rec-skeleton" />
        </div>
      ) : !recs?.length ? (
        <div className="dash-empty-card">
          <ShieldCheck size={28} strokeWidth={1.5} />
          <div>
            <strong>You're all caught up</strong>
            <p>Complete your health profile to get personalized checkup recommendations.</p>
          </div>
        </div>
      ) : (
        <div className="dash-recs-list">
          {recs.map((rec, i) => {
            const cfg = urgencyConfig[rec.urgency] ?? urgencyConfig.low;
            const { Icon } = cfg;
            return (
              <div key={i} className="dash-rec-card">
                <div className="dash-rec-icon-wrap" style={{ background: cfg.bg, color: cfg.color }}>
                  <Icon size={18} strokeWidth={1.75} />
                </div>
                <div className="dash-rec-body">
                  <strong>{rec.type}</strong>
                  <p>{rec.reason}</p>
                </div>
                <span className="dash-rec-urgency" style={{ color: cfg.color, background: cfg.bg }}>
                  {rec.urgency}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Main dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, healthProfile, effectiveInsurers } = useAuth();
  const navigate = useNavigate();

  const isEmployer = user?.accountType === "employer";
  const sessionDismissed = !isEmployer && isMemberDashboardOnboardingDismissedSession();
  const memberOnboardingDismissed =
    !isEmployer && (sessionDismissed || Boolean(healthProfile.dashboardOnboardingDismissed));

  const memberStepComplete = [
    memberProfileAgeComplete(healthProfile.age),
    Boolean(healthProfile.onboardingCalendarConnected),
    false,
  ];

  // Fetch real appointments
  const [appointments, setAppointments] = useState([]);
  useEffect(() => {
    if (!user?.email) return;
    apiFetch(`/api/appointments/${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setAppointments(d); })
      .catch(() => {});
  }, [user?.email]);

  // Map benefits from effectiveInsurers
  const benefits = (() => {
    const allCats = (effectiveInsurers ?? []).flatMap((i) => i.categories ?? []);
    if (!allCats.length) return null;
    const find = (...keys) => allCats.find((c) =>
      keys.some((k) => String(c.name ?? "").toLowerCase().includes(k))
    );
    const dental = find("dental");
    const vision = find("vision", "optometry", "eye");
    const physio  = find("physio", "physical");
    const hasAny  = [dental, vision, physio].some((c) => c && (c.annualLimit ?? 0) > 0);
    return {
      dental: { total: dental?.annualLimit ?? 0, used: dental?.used ?? 0 },
      vision: { total: vision?.annualLimit ?? 0, used: vision?.used ?? 0 },
      physio:  { total: physio?.annualLimit  ?? 0, used: physio?.used  ?? 0 },
      hasAny,
    };
  })();

  const firstName = (user?.fullName || user?.name || "there").split(" ")[0];
  const greeting  = getGreeting();

  const upcoming = appointments.filter((a) => a.status === "upcoming")
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextAppt = upcoming[0];
  const contextLine = nextAppt
    ? `Your next appointment is ${new Date(nextAppt.date).toLocaleDateString("en-CA", { month: "long", day: "numeric" })} at ${nextAppt.clinicName}.`
    : "No upcoming appointments — ask the AI assistant to book one.";

  const memberExtraActions = [
    { id: "upload", label: "Upload Insurance PDF", IconComponent: Paperclip, onClick: () => {} },
    { id: "compass", label: "Find Nearby Clinic",  IconComponent: MapPin,    route: "/health-compass" },
  ];

  return (
    <div className="page-flow dashboard-flow">
      {/* ── Hero ── */}
      <header className="page-hero page-hero--alive dashboard-page-intro">
        <p className="page-hero-eyebrow">
          {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1>{greeting}, {firstName}</h1>
        <p>{isEmployer
          ? "Organization overview — benefit templates and role keys for your workers."
          : contextLine}
        </p>
      </header>

      {/* ── Stats bar ── */}
      {!isEmployer && <StatsBar appointments={appointments} benefits={benefits} />}

      {/* ── Benefits + onboarding ── */}
      <div className={`dashboard-benefits-onboard${memberOnboardingDismissed ? " dashboard-benefits-onboard--full" : ""}`}>
        {isEmployer
          ? <EmployerProgramSummaryCard />
          : <MemberBenefitsSummaryCard benefits={benefits} />}
        {isEmployer
          ? <OnboardingRibbon steps={employerOnboardingSteps} />
          : memberOnboardingDismissed ? null
          : <OnboardingRibbon steps={onboardingSteps} stepComplete={memberStepComplete} />}
      </div>

      {/* ── Quick actions ── */}
      <QuickActionsVivid
        items={isEmployer ? employerQuickActions : quickActions}
        extraActions={isEmployer ? [] : memberExtraActions}
      />

      {/* ── Upcoming appointments ── */}
      {!isEmployer && (
        <UpcomingAppointments appointments={appointments} userEmail={user?.email} />
      )}

      {/* ── Checkup section ── */}
      {!isEmployer && <CheckupDashboardSection />}

      {/* ── AI Recommendations + empty lower ── */}
      <div className="dashboard-lower dashboard-lower--alive">
        {!isEmployer && (
          <AIRecommendations
            user={{ email: user?.email, age: healthProfile?.age, occupation: healthProfile?.occupation }}
            benefits={benefits}
            appointments={appointments}
          />
        )}
        {isEmployer && (
          <section className="insights-vibe" aria-labelledby="dash-insights-heading">
            <h2 id="dash-insights-heading" className="title-vibe">Organization</h2>
            <p className="insights-vibe-lead">Member-facing health tools stay on employee accounts. Manage benefit templates and keys from Employer Hub and Settings.</p>
          </section>
        )}
      </div>
    </div>
  );
}
