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
    <div className="page-flow">
      <header className="page-hero page-hero--alive">
        <h1>Health Compass</h1>
        <p>
          Find care near you. The map is a contained tool; the story around it stays open—search, filter, and results
          read like a normal page.
        </p>
      </header>

      <div className="compass-layout">
        <section className="compass-map-area">
          <div className="map-frame-wrap contained-map">
            <iframe
              title="Health compass map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-79.42%2C43.63%2C-79.34%2C43.69&layer=mapnik"
              loading="lazy"
            />
          </div>
        </section>

        <aside className="compass-side contained">
          <h2 className="page-section-title">Find clinics</h2>
          <label className="form-field">
            Search
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Hospital, clinic, pharmacy" />
          </label>

          <label className="toggle-row">
            <input type="checkbox" checked={benefitsOnly} onChange={(e) => setBenefitsOnly(e.target.checked)} />
            Only locations with active benefits
          </label>

          <ul className="clinic-plain-list">
            {filtered.map((loc) => (
              <li key={loc.id} className="clinic-plain-row">
                <div>
                  <strong>{loc.name}</strong>
                  <span className="clinic-plain-meta">{loc.type}</span>
                </div>
                <span className={`pill ${loc.benefits ? "ok" : "plain"}`}>{loc.benefits ? "Benefits" : "Self-pay"}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
