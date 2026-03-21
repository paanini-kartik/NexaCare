import { useMemo, useState } from "react";
import { clinicLocations } from "../data/mockData";

export default function CompassPage() {
  const [query, setQuery] = useState("");
  const [benefitsOnly, setBenefitsOnly] = useState(false);

  const filtered = useMemo(
    () =>
      clinicLocations.filter((loc) => {
        const text = `${loc.name} ${loc.type}`.toLowerCase();
        const okText = text.includes(query.toLowerCase());
        const okBenefits = benefitsOnly ? loc.benefits : true;
        return okText && okBenefits;
      }),
    [query, benefitsOnly]
  );

  return (
    <div className="two-col-grid">
      <section className="card-surface section-card">
        <h2>Health Compass</h2>
        <p>Locate nearby care facilities and filter by benefit eligibility.</p>
        <div className="map-frame-wrap">
          <iframe
            title="Health compass map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-79.42%2C43.63%2C-79.34%2C43.69&layer=mapnik"
            loading="lazy"
          />
        </div>
      </section>

      <section className="card-surface section-card">
        <h3>Find Clinics</h3>
        <label className="form-field">
          Search
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="hospital, clinic, pharmacy" />
        </label>

        <label className="toggle-row">
          <input type="checkbox" checked={benefitsOnly} onChange={(e) => setBenefitsOnly(e.target.checked)} />
          Show locations with active benefits only
        </label>

        <div className="list-stack">
          {filtered.map((loc) => (
            <article key={loc.id} className="list-card">
              <div>
                <strong>{loc.name}</strong>
                <p>{loc.type}</p>
              </div>
              <span className={`pill ${loc.benefits ? "ok" : "plain"}`}>{loc.benefits ? "Benefits" : "Self-pay"}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
