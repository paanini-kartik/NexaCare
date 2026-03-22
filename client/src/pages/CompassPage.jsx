import { useOutletContext } from "react-router-dom";
import HealthCompass from "../components/HealthCompass/HealthCompass";

export default function CompassPage() {
  const outletContext = useOutletContext() ?? {};
  const { refreshAppointments } = outletContext;

  return (
    <div className="page-flow compass-page-flow">
      <header className="page-hero page-hero--alive">
        <h1>Health Compass</h1>
        <p>Search by name or type, then explore clinics on the map and open details when you find a match.</p>
      </header>

      <HealthCompass onBookingComplete={refreshAppointments} />
    </div>
  );
}
