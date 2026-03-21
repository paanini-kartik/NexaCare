import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { clinicLocations } from "../../data/mockData";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "dental", label: "Dental" },
  { id: "vision", label: "Vision" },
  { id: "pharmacy", label: "Pharmacy" },
  { id: "hospital", label: "Hospital" },
];

function normalizeClinicType(clinic) {
  const typeText = (clinic.type || "").toLowerCase();
  const nameText = (clinic.name || "").toLowerCase();

  if (typeText.includes("optometry")) return "vision";
  if (typeText.includes("pharmacy")) return "pharmacy";
  if (typeText.includes("hospital")) return "hospital";
  if (typeText.includes("dental") || typeText.includes("clinic") || nameText.includes("dental")) return "dental";
  return "hospital";
}

function toCompassClinic(clinic, index) {
  const acceptedBenefits = Array.isArray(clinic.acceptedBenefits) ? clinic.acceptedBenefits : [];
  const fallbackId = `api-clinic-${index + 1}`;
  return {
    id: clinic.id ?? fallbackId,
    name: clinic.name ?? "Unknown clinic",
    type: clinic.type ?? "hospital",
    lat: Number(clinic.lat),
    lng: Number(clinic.lng),
    benefits: acceptedBenefits.length > 0,
    acceptedBenefits,
  };
}

function typeColor(type) {
  if (type === "dental") return "#059669";
  if (type === "vision") return "#2563eb";
  if (type === "pharmacy") return "#7c3aed";
  return "#dc2626";
}

function MapViewportController({ clinics, selectedClinic }) {
  const map = useMap();

  useEffect(() => {
    if (!clinics.length) return;

    if (selectedClinic) {
      map.flyTo([selectedClinic.lat, selectedClinic.lng], 14, { duration: 0.6 });
      return;
    }

    const bounds = clinics.map((clinic) => [clinic.lat, clinic.lng]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [map, clinics, selectedClinic]);

  return null;
}

export default function HealthCompass() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [clinicsSource, setClinicsSource] = useState(clinicLocations);
  const [isLoading, setIsLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadClinics() {
      setIsLoading(true);
      setLoadMessage("");

      try {
        const apiType = activeFilter === "vision" ? "optometry" : activeFilter;
        const response = await fetch(`/api/clinics/?lat=43.6532&lng=-79.3832&type=${apiType}`);
        if (!response.ok) {
          throw new Error(`Clinics API returned ${response.status}`);
        }

        const payload = await response.json();
        if (!Array.isArray(payload)) {
          throw new Error("Clinics API payload is not an array");
        }

        const mapped = payload
          .map((clinic, index) => toCompassClinic(clinic, index))
          .filter((clinic) => Number.isFinite(clinic.lat) && Number.isFinite(clinic.lng));

        if (!mapped.length) {
          throw new Error("Clinics API returned no valid coordinates");
        }

        if (!isCancelled) {
          setClinicsSource(mapped);
          setLoadMessage("Showing live clinics from API.");
        }
      } catch {
        if (!isCancelled) {
          setClinicsSource(clinicLocations);
          setLoadMessage("Using local mock clinics. Start backend to load live data.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadClinics();

    return () => {
      isCancelled = true;
    };
  }, [activeFilter]);

  const normalizedClinics = useMemo(
    () =>
      clinicsSource.map((clinic) => ({
        ...clinic,
        normalizedType: normalizeClinicType(clinic),
      })),
    [clinicsSource]
  );

  const filteredClinics = useMemo(() => {
    const search = query.trim().toLowerCase();
    return normalizedClinics.filter((clinic) => {
      const matchesType = activeFilter === "all" || clinic.normalizedType === activeFilter;
      const matchesQuery = !search || `${clinic.name} ${clinic.type}`.toLowerCase().includes(search);
      return matchesType && matchesQuery;
    });
  }, [activeFilter, query, normalizedClinics]);

  useEffect(() => {
    if (!filteredClinics.length) {
      setSelectedClinicId(null);
      return;
    }

    const selectedStillVisible = filteredClinics.some((clinic) => clinic.id === selectedClinicId);
    if (!selectedStillVisible) {
      setSelectedClinicId(filteredClinics[0].id);
    }
  }, [filteredClinics, selectedClinicId]);

  const selectedClinic = useMemo(
    () => filteredClinics.find((clinic) => clinic.id === selectedClinicId) || null,
    [filteredClinics, selectedClinicId]
  );

  return (
    <div className="health-compass-root">
      <div className="health-compass-toolbar">
        <input
          className="health-compass-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search clinics, pharmacies, hospitals..."
        />
        <div className="health-compass-filters">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              className={`compass-filter-btn ${activeFilter === filter.id ? "active" : ""}`}
              onClick={() => setActiveFilter(filter.id)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="health-compass-layout">
        <section className="card-surface health-compass-map">
          <h3>Health Compass Map</h3>
          <p>Tap a pin to view details and sync with the clinic panel.</p>
          {isLoading ? <p>Loading clinics...</p> : <p>{loadMessage}</p>}
          <div className="map-frame-wrap health-compass-map-live">
            <MapContainer center={[43.6532, -79.3832]} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapViewportController clinics={filteredClinics} selectedClinic={selectedClinic} />
              {filteredClinics.map((clinic) => {
                const isSelected = clinic.id === selectedClinicId;
                return (
                  <CircleMarker
                    key={clinic.id}
                    center={[clinic.lat, clinic.lng]}
                    radius={isSelected ? 11 : 8}
                    pathOptions={{
                      color: "#ffffff",
                      weight: 2,
                      fillColor: typeColor(clinic.normalizedType),
                      fillOpacity: isSelected ? 0.95 : 0.78,
                    }}
                    eventHandlers={{
                      click: () => setSelectedClinicId(clinic.id),
                    }}
                  >
                    <Popup>
                      <strong>{clinic.name}</strong>
                      <br />
                      {clinic.type}
                      <br />
                      {clinic.acceptedBenefits?.length ? `Benefits: ${clinic.acceptedBenefits.join(", ")}` : "No listed benefits"}
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </section>

        <section className="card-surface health-compass-side">
          <h3>Nearby Clinics</h3>
          <div className="list-stack">
            {filteredClinics.map((clinic) => (
              <article
                key={clinic.id}
                className={`list-card ${selectedClinicId === clinic.id ? "selected" : ""}`}
                onClick={() => setSelectedClinicId(clinic.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedClinicId(clinic.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div>
                  <strong>{clinic.name}</strong>
                  <p>{clinic.type}</p>
                </div>
                <span className={`pill ${clinic.benefits ? "ok" : "plain"}`}>{clinic.benefits ? "Benefits" : "Self-pay"}</span>
              </article>
            ))}
          </div>

          {selectedClinic ? (
            <article className="health-compass-selected">
              <h4>{selectedClinic.name}</h4>
              <p>{selectedClinic.type}</p>
              <p>
                Coordinates: {selectedClinic.lat}, {selectedClinic.lng}
              </p>
              {selectedClinic.acceptedBenefits?.length ? (
                <p>Accepted: {selectedClinic.acceptedBenefits.join(", ")}</p>
              ) : (
                <p>No accepted benefits listed.</p>
              )}
              <span className={`pill ${selectedClinic.benefits ? "ok" : "plain"}`}>
                {selectedClinic.benefits ? "Accepts benefits" : "No benefits listed"}
              </span>
            </article>
          ) : (
            <p>No clinics match your filter.</p>
          )}
        </section>
      </div>
    </div>
  );
}
