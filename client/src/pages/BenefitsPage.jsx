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
    <div className="page-flow">
      <header className="page-hero page-hero--alive">
        <h1>Benefits</h1>
        <p>
          Your plans, rolled into one readable view. The table below is intentionally contained—numbers need a grid.
          Everything else stays in the open so you can scan like a human, not a spreadsheet.
        </p>
      </header>

      <section className="page-section">
        <h2 className="title-vibe">Synthesized across carriers</h2>
        <p className="page-section-lead">
          Dummy data stands in for multiple insurers; the same layout works when you wire real APIs.
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
          {insurers.map((insurer) => (
            <article key={insurer.id} className="provider-block contained">
              <header className="provider-block-head">
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
