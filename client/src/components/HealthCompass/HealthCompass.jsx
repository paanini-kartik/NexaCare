import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Clock, MapPin, Phone, Globe, Star, Navigation } from "lucide-react";
import { clinicLocations } from "../../data/mockData";

const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const FILTERS = [
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
  const [activeFilter, setActiveFilter] = useState("dental");
  const [query, setQuery] = useState("");
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [clinicsSource, setClinicsSource] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState("");
  const [clinicDetails, setClinicDetails] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setUserLocation({ lat: 43.6532, lng: -79.3832 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setLocationError("Please enable location services or using default location.");
        setUserLocation({ lat: 43.6532, lng: -79.3832 }); // fallback
      },
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    let isCancelled = false;

    async function loadClinics() {
      setIsLoading(true);
      setLoadMessage("");
      setClinicsSource([]);

      try {
        const apiType = activeFilter === "vision" ? "optometry" : activeFilter;
        const response = await fetch(`/api/clinics/?lat=${userLocation.lat}&lng=${userLocation.lng}&type=${apiType}`);
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
  }, [activeFilter, userLocation]);

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

  useEffect(() => {
    if (!selectedClinicId) {
      setClinicDetails(null);
      return;
    }

    let isCancelled = false;
    async function fetchDetails() {
      setIsDetailsLoading(true);
      try {
        const response = await fetch(`/api/clinics/${selectedClinicId}`);
        if (!response.ok) throw new Error("Details fetch failed");
        const data = await response.json();
        if (!isCancelled) {
          setClinicDetails(Object.keys(data).length > 0 ? data : null);
        }
      } catch {
        if (!isCancelled) setClinicDetails(null);
      } finally {
        if (!isCancelled) setIsDetailsLoading(false);
      }
    }

    fetchDetails();
    return () => { isCancelled = true; };
  }, [selectedClinicId]);

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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {isLoading ? (
              <p>Loading {activeFilter === "pharmacy" ? "pharmacies" : activeFilter === "hospital" ? "hospitals" : activeFilter === "dental" ? "dental clinics" : activeFilter === "vision" ? "vision centers" : "locations"}...</p>
            ) : (
              <p>{loadMessage}</p>
            )}
            {locationError && <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0 }}>📍 {locationError}</p>}
          </div>
          
          <div className="map-frame-wrap health-compass-map-live">
            {!userLocation ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", background: "#f1f5f9", borderRadius: "12px" }}>
                <p style={{ color: "#64748b", fontWeight: "500" }}>Finding your location...</p>
              </div>
            ) : (
              <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapViewportController clinics={filteredClinics} selectedClinic={selectedClinic} />
                
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                  <Popup>
                  <strong>You are here</strong>
                </Popup>
              </Marker>

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
            )}
          </div>

          {selectedClinic ? (
            <article className="health-compass-selected" style={{ marginTop: "1.5rem" }}>
              <h4>{selectedClinic.name}</h4>
              <p style={{ textTransform: "capitalize", color: "var(--text-secondary, #64748b)" }}>
                {selectedClinic.type}
              </p>

              {userLocation && (
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedClinic.lat},${selectedClinic.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "0.75rem",
                    padding: "0.5rem 1rem",
                    backgroundColor: "#2563eb",
                    color: "white",
                    borderRadius: "8px",
                    fontWeight: "500",
                    textDecoration: "none",
                    boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
                    fontSize: "0.95rem",
                    width: "fit-content",
                    transition: "opacity 0.2s ease"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                  onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
                >
                  <Navigation size={18} />
                  Get Directions
                </a>
              )}
              
              {isDetailsLoading ? (
                <div style={{ padding: "1rem 0", color: "#64748b", fontSize: "0.9rem" }}>Loading place details...</div>
              ) : clinicDetails ? (
                <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {clinicDetails.editorial_summary?.overview && (
                    <p style={{ fontStyle: "italic", fontSize: "0.95rem", lineHeight: "1.4" }}>
                      "{clinicDetails.editorial_summary.overview}"
                    </p>
                  )}
                  
                  {clinicDetails.opening_hours?.weekday_text && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <Clock size={18} color="#64748b" style={{ marginTop: "2px" }} />
                      <span style={{ fontSize: "0.95rem", color: "#64748b" }}>
                        {clinicDetails.opening_hours.weekday_text[(new Date().getDay() + 6) % 7]}
                      </span>
                    </div>
                  )}
                  
                  {clinicDetails.formatted_address && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <MapPin size={18} color="#64748b" style={{ minWidth: "18px", marginTop: "2px" }} />
                      <span style={{ fontSize: "0.95rem", color: "#334155" }}>{clinicDetails.formatted_address}</span>
                    </div>
                  )}
                  
                  {clinicDetails.formatted_phone_number && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Phone size={18} color="#64748b" style={{ minWidth: "18px" }} />
                      <a href={`tel:${clinicDetails.formatted_phone_number.replace(/\D/g,'')}`} style={{ fontSize: "0.95rem", color: "#2563eb", textDecoration: "none", fontWeight: "500" }}>
                        {clinicDetails.formatted_phone_number}
                      </a>
                    </div>
                  )}
                  
                  {clinicDetails.website && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Globe size={18} color="#64748b" style={{ minWidth: "18px" }} />
                      <a href={clinicDetails.website} target="_blank" rel="noreferrer" style={{ fontSize: "0.95rem", color: "#2563eb", textDecoration: "none", fontWeight: "500" }}>
                        Visit Website
                      </a>
                    </div>
                  )}
                  
                  {(clinicDetails.rating) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <Star size={18} color="#eab308" fill="#eab308" style={{ minWidth: "18px" }} />
                      <span style={{ color: "#334155", fontWeight: "600" }}>{clinicDetails.rating}</span>
                      <span style={{ color: "#64748b", fontSize: "0.85rem" }}>({clinicDetails.user_ratings_total} reviews)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: "1rem" }}>
                   <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No extended details available for this location.</p>
                </div>
              )}

              <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                <span className={`pill ${selectedClinic.benefits ? "ok" : "plain"}`}>
                  {selectedClinic.benefits ? "Accepts NexaCare Benefits" : "Self-pay / Out of network"}
                </span>
                {selectedClinic.acceptedBenefits?.length > 0 && (
                  <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.5rem" }}>
                    Eligible for: <span style={{ textTransform: "capitalize" }}>{selectedClinic.acceptedBenefits.join(", ")}</span>
                  </p>
                )}
              </div>
            </article>
          ) : null}
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
                  <p style={{ textTransform: "capitalize" }}>{clinic.type}</p>
                </div>
                <span className={`pill ${clinic.benefits ? "ok" : "plain"}`}>{clinic.benefits ? "Benefits" : "Self-pay"}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
