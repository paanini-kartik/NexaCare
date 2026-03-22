import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function currency(amount) {
  return `$${amount.toLocaleString()}`;
}

export default function BenefitsPage() {
  const { effectiveInsurers, benefitContextDescription } = useAuth();

  if (!effectiveInsurers.length) {
    return (
      <div className="page-flow">
        <header className="page-hero page-hero--alive">
          <h1>Benefits</h1>
          <p>
            No benefit plans are linked yet. Add an <strong>employer invite key</strong>, set up your organization in{" "}
            <Link to="/employer">Employer Hub</Link>, or add <strong>manual providers</strong> in{" "}
            <Link to="/settings">Settings</Link>. Everything you see here will come from what you configure.
          </p>
        </header>
        <section className="contained" style={{ marginTop: "1.5rem" }}>
          <p className="page-section-lead">
            When at least one schedule exists, category totals and per-provider blocks will appear on this page.
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
    <div className="page-flow">
      <header className="page-hero page-hero--alive">
        <h1>Benefits</h1>
        <p>
          Your plans in one view. Schedules start at <strong>$0 used</strong>; work benefits fill in when you apply an
          employer key, and you can add benefit providers in{" "}
          <Link to="/settings">Settings</Link> (family owners and contributors share one provider list for the whole family).
          {benefitContextDescription ? (
            <>
              {" "}
              <strong>Active sources:</strong> {benefitContextDescription}.
            </>
          ) : null}
        </p>
      </header>

      <section className="page-section">
        <h2 className="title-vibe">Synthesized across carriers</h2>
        <p className="page-section-lead">
          Category rows aggregate every active provider. Usage stays at $0 until you track spend elsewhere.
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
                {summaryByCategory.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.avgCoverage}%</td>
                    <td>{currency(row.limit)}</td>
                    <td>{currency(row.used)}</td>
                    <td>{currency(row.remaining)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="page-divider" role="presentation" />

      <section className="page-section">
        <h2 className="title-vibe">By provider</h2>
        <p className="page-section-lead">Each block is a light frame around dense benefit rows—not a wall of identical cards.</p>
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
                return (
                  <div key={`${insurer.id}-${cidx}`} className="benefit-row">
                    <div className="benefit-top">
                      <span>{category.name}</span>
                      <span>{Math.round(category.coverage * 100)}% coverage</span>
                    </div>
                    <div className="progress-track">
                      <div style={{ width: `${pct}%` }} />
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
