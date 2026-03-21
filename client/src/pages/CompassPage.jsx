import HealthCompass from "../components/HealthCompass/HealthCompass";

export default function CompassPage() {
  return (
    <div className="page-flow">
      <header className="page-hero page-hero--alive">
        <h1>Health Compass</h1>
        <p>
          Find care near you—search, filter by type, and explore clinics on the map with live pins and details.
        </p>
      </header>

      <HealthCompass />
    </div>
  );
}
