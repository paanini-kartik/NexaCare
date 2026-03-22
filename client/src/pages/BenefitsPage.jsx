import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { markMemberDashboardOnboardingDismissedSession } from "../lib/memberDashboardOnboarding";

function currency(amount) {
  return `$${amount.toLocaleString()}`;
}

/** 0–100: higher coverage → greener; lower → redder (red = worse, green = better). */
function coverageHeatColor(percent) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0)) / 100;
  const h = 142 * p;
  const s = 58 + 22 * p;
  const l = 34 - 8 * p;
  return `hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${l.toFixed(0)}%)`;
}

export default function BenefitsPage() {
  const { effectiveInsurers, benefitContextDescription, user, healthProfile, updateProfile } = useAuth();

  /** Visiting Benefits (members) dismisses the dashboard onboarding strip. */
  useEffect(() => {
    if (user?.accountType === "employer") return;
    // Immediate (no Firestore round-trip) so returning to Dashboard hides the strip right away.
    markMemberDashboardOnboardingDismissedSession();
    if (healthProfile.dashboardOnboardingDismissed) return;
    updateProfile({ dashboardOnboardingDismissed: true });
  }, [user?.accountType, healthProfile.dashboardOnboardingDismissed, updateProfile]);

  if (!effectiveInsurers.length) {
    return (
      <div className="page-flow benefits-page-flow">
        <header className="page-hero page-hero--alive">
          <h1>Benefits</h1>
          <p>
            Connect a plan to see your coverage here. Use your <strong>work invite code</strong> in{" "}
            <Link to="/settings">Settings</Link>, or—if you manage benefits for a company—set things up in{" "}
            <Link to="/employer">Employer hub</Link>.
          </p>
        </header>
        <section className="contained" style={{ marginTop: "1.5rem" }}>
          <p className="page-section-lead">
            Once a plan is linked, you’ll see totals by category and a breakdown for each carrier.
          </p>
        </section>
      </div>
    );
  }

  const allCategories = effectiveInsurers.flatMap((insurer) =>
    insurer.categories.map((c) => ({ ...c, provider: insurer.provider, plan: insurer.plan }))
  );

  const summaryByCategory = Object.values(
    allCategories.reduce((acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = { name: item.name, limit: 0, used: 0, weightedCoverage: 0, count: 0 };
      }
      acc[item.name].limit += item.annualLimit;
      acc[item.name].used += item.used || 0;
      acc[item.name].weightedCoverage += item.coverage;
      acc[item.name].count += 1;
      return acc;
    }, {})
  ).map((item) => ({
    ...item,
    avgCoverage: Math.round((item.weightedCoverage / item.count) * 100),
    remaining: item.limit - item.used,
  }));

  return (
    <div className="page-flow benefits-page-flow">
      <header className="page-hero page-hero--alive">
        <h1>Benefits</h1>
        <p>
          Annual limits, what you’ve spent, and what’s left—by category and by plan. Usage starts at <strong>$0</strong> until
          you or your employer updates it. Family accounts share one provider list; manage it in{" "}
          <Link to="/settings">Settings</Link>.
          {benefitContextDescription ? (
            <>
              {" "}
              <strong>Connected:</strong> {benefitContextDescription}.
            </>
          ) : null}
        </p>
      </header>

      <section className="page-section">
        <h2 className="title-vibe">Across your plans</h2>
        <p className="page-section-lead">
          Combined view by category, no matter how many carriers you have.
        </p>
        <div className="contained">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Avg coverage</th>
                  <th>Annual limit</th>
                  <th>Used</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {summaryByCategory.map((row) => {
                  const covColor = coverageHeatColor(row.avgCoverage);
                  return (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>
                        <span className="benefit-coverage-pill" style={{ color: covColor, background: `${covColor}18` }}>
                          {row.avgCoverage}%
                        </span>
                      </td>
                      <td>{currency(row.limit)}</td>
                      <td>{currency(row.used)}</td>
                      <td>{currency(row.remaining)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="page-divider" role="presentation" />

      <section className="page-section">
        <h2 className="title-vibe">By carrier</h2>
        <p className="page-section-lead">Each plan listed separately with its categories and balances.</p>
        <div className="provider-stack">
          {effectiveInsurers.map((insurer) => (
            <article key={insurer.id} className="provider-block contained">
              <header className="provider-block-head">
                <strong>{insurer.provider}</strong>
                <span>{insurer.plan}</span>
              </header>
              {insurer.categories.map((category, cidx) => {
                const remaining = category.annualLimit - (category.used || 0);
                const denom = category.annualLimit || 1;
                const pct = Math.max(0, Math.min(100, Math.round((remaining / denom) * 100)));
                const covPct = Math.round((category.coverage || 0) * 100);
                const heat = coverageHeatColor(covPct);
                return (
                  <div key={`${insurer.id}-${cidx}`} className="benefit-row">
                    <div className="benefit-top">
                      <span>{category.name}</span>
                      <span className="benefit-coverage-label" style={{ color: heat }}>
                        {covPct}% coverage
                      </span>
                    </div>
                    <div className="progress-track progress-track--heat">
                      <div style={{ width: `${pct}%`, background: heat }} />
                    </div>
                    <small>
                      {currency(remaining)} remaining of {currency(category.annualLimit)}
                    </small>
                  </div>
                );
              })}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
