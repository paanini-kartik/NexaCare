import { insurers } from "../data/mockData";

function currency(amount) {
  return `$${amount.toLocaleString()}`;
}

export default function BenefitsPage() {
  const allCategories = insurers.flatMap((insurer) =>
    insurer.categories.map((c) => ({ ...c, provider: insurer.provider, plan: insurer.plan }))
  );

  const summaryByCategory = Object.values(
    allCategories.reduce((acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = { name: item.name, limit: 0, used: 0, weightedCoverage: 0, count: 0 };
      }
      acc[item.name].limit += item.annualLimit;
      acc[item.name].used += item.used;
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
    <div className="grid-stack">
      <section className="card-surface section-card">
        <h2>Multi-Provider Benefits Overview</h2>
        <p>Your benefits are synthesized across all connected insurance plans.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Avg Coverage</th>
                <th>Annual Limit</th>
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
      </section>

      <section className="card-surface section-card">
        <h3>Provider Breakdown</h3>
        <div className="provider-grid">
          {insurers.map((insurer) => (
            <article key={insurer.id} className="provider-card">
              <header>
                <strong>{insurer.provider}</strong>
                <span>{insurer.plan}</span>
              </header>
              {insurer.categories.map((category) => {
                const remaining = category.annualLimit - category.used;
                const pct = Math.max(0, Math.min(100, Math.round((remaining / category.annualLimit) * 100)));
                return (
                  <div key={category.name} className="benefit-row">
                    <div className="benefit-top">
                      <span>{category.name}</span>
                      <span>{Math.round(category.coverage * 100)}% coverage</span>
                    </div>
                    <div className="progress-track"><div style={{ width: `${pct}%` }} /></div>
                    <small>{currency(remaining)} remaining of {currency(category.annualLimit)}</small>
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
