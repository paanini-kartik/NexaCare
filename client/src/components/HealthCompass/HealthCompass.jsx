import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Clock, MapPin, Phone, Globe, Star, Navigation } from "lucide-react";
import { clinicLocations } from "../../data/mockData";
import { apiFetch } from "../../lib/api";
import { localDateAndTimeToIsoUtc } from "../../lib/datetime";
import { useAuth } from "../../contexts/AuthContext";
import { DEFAULT_LOCATION } from "../../config/defaults";


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



/** Map uses a fixed viewport height; one paint + debounced window resize avoids jittery invalidateSize bursts. */
function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    let debounceTimer;
    const fix = () => {
      try {
        map.invalidateSize({ animate: false });
      } catch {
        /* map may be unmounting */
      }
    };
    const onResize = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fix, 150);
    };
    fix();
    const raf = requestAnimationFrame(fix);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(debounceTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);
  return null;
}

export default function HealthCompass({ onBookingComplete }) {
  const { user } = useAuth();
  const { refreshAppointments } = useOutletContext() ?? {};
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
  
  // Booking state
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("09:00");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    apiFetch(`/api/calendar/status?user_email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((d) => setCalendarConnected(Boolean(d.connected)))
      .catch(() => setCalendarConnected(false));
  }, [user?.email]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setUserLocation(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setLocationError("Please enable location services or using default location.");
        setUserLocation(DEFAULT_LOCATION); // fallback
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
        const response = await apiFetch(`/api/clinics/?lat=${userLocation.lat}&lng=${userLocation.lng}&type=${apiType}`);
        if (!response.ok) {
          throw new Error(`Clinics API returned ${response.status}`);
        }

        const payload = await response.json();
        const mapped = payload
          .map((clinic, index) => toCompassClinic(clinic, index))
          .filter((clinic) => Number.isFinite(clinic.lat) && Number.isFinite(clinic.lng));

        if (!isCancelled) {
          setClinicsSource(mapped.length ? mapped : clinicLocations);
          setLoadMessage(mapped.length ? "Showing live clinics from API." : "No clinics found nearby. Using mock data.");
        }
      } catch {
        if (!isCancelled) {
          setClinicsSource(clinicLocations);
          setLoadMessage("Using local mock clinics. Start backend for live data.");
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadClinics();
    return () => { isCancelled = true; };
  }, [activeFilter, userLocation]);

  const normalizedClinics = useMemo(
    () => clinicsSource.map((clinic) => ({
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
        const response = await apiFetch(`/api/clinics/${selectedClinicId}`);
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
          <p>Tap a pin to view details and selection.</p>
          <div className="health-compass-map-meta">
            {isLoading ? (
              <p>Loading {activeFilter === "pharmacy" ? "pharmacies" : activeFilter === "hospital" ? "hospitals" : activeFilter === "dental" ? "dental clinics" : activeFilter === "vision" ? "vision centers" : "locations"}...</p>
            ) : (
              <p>{loadMessage}</p>
            )}
            {locationError && <p className="error-text">📍 {locationError}</p>}
          </div>
          
          <div className="map-frame-wrap health-compass-map-live">
            {!userLocation ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", background: "#f1f5f9", borderRadius: "12px" }}>
                <p>Finding location...</p>
              </div>
            ) : (
              <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapResizeFix />
                <MapViewportController clinics={filteredClinics} selectedClinic={selectedClinic} />
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
                {filteredClinics.map((clinic) => (
                  <CircleMarker
                    key={clinic.id}
                    center={[clinic.lat, clinic.lng]}
                    radius={clinic.id === selectedClinicId ? 11 : 8}
                    pathOptions={{ color: "#fff", weight: 2, fillColor: typeColor(clinic.normalizedType), fillOpacity: 0.8 }}
                    eventHandlers={{ click: () => setSelectedClinicId(clinic.id) }}
                  >
                    <Popup><strong>{clinic.name}</strong><br/>{clinic.type}</Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>

          {selectedClinic && (
            <article className="health-compass-selected" style={{ marginTop: "1.5rem" }}>
              <h4>{selectedClinic.name}</h4>
              <p style={{ textTransform: "capitalize", color: "#64748b" }}>{selectedClinic.type}</p>
              
              {userLocation && (
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedClinic.lat},${selectedClinic.lng}`}
                  target="_blank" rel="noreferrer" className="primary-btn" style={{ marginTop: "0.75rem", textDecoration: "none", display: "inline-flex" }}
                >
                  <Navigation size={18} style={{ marginRight: "0.5rem" }} /> Get Directions
                </a>
              )}

              {isDetailsLoading ? (
                <p>Loading details...</p>
              ) : clinicDetails ? (
                <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {clinicDetails.formatted_address && (
                    <div style={{ display: "flex", gap: "0.5rem" }}><MapPin size={18} color="#64748b" /><span>{clinicDetails.formatted_address}</span></div>
                  )}
                  {clinicDetails.formatted_phone_number && (
                    <div style={{ display: "flex", gap: "0.5rem" }}><Phone size={18} color="#64748b" /><a href={`tel:${clinicDetails.formatted_phone_number}`}>{clinicDetails.formatted_phone_number}</a></div>
                  )}
                  {clinicDetails.rating && (
                    <div style={{ display: "flex", gap: "0.5rem" }}><Star size={18} color="#eab308" fill="#eab308" /><span>{clinicDetails.rating} ({clinicDetails.user_ratings_total} reviews)</span></div>
                  )}
                  <button className="primary-btn" style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }} onClick={() => setShowBookingModal(true)}>
                    Book Appointment
                  </button>
                </div>
              ) : (
                <button className="primary-btn" style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }} onClick={() => setShowBookingModal(true)}>
                  Book Appointment
                </button>
              )}
            </article>
          )}
        </section>

        <section className="card-surface health-compass-side">
          <h3>Nearby Clinics</h3>
          <div className="health-compass-clinic-scroll list-stack" role="region" aria-label="Scrollable clinic list">
            {isLoading ? (
              <p style={{ padding: "1rem", color: "#64748b" }}>Loading clinics…</p>
            ) : filteredClinics.length === 0 ? (
              <p style={{ padding: "1rem", color: "#64748b" }}>No clinics found for this filter.</p>
            ) : (
              filteredClinics.map((clinic) => (
                <article key={clinic.id} className={`list-card ${selectedClinicId === clinic.id ? "selected" : ""}`} onClick={() => setSelectedClinicId(clinic.id)}>
                  <div><strong>{clinic.name}</strong><p style={{ textTransform: "capitalize" }}>{clinic.type}</p></div>
                  <span className={`pill ${clinic.benefits ? "ok" : "plain"}`}>{clinic.benefits ? "Benefits" : "Self-pay"}</span>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {showBookingModal && (
        <div className="overlay-backdrop" onClick={() => setShowBookingModal(false)}>
          <div className="card-surface contained modal-anim" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px", width: "95%" }}>
            <h3>Book at {selectedClinic?.name}</h3>
            <p className="page-section-lead">Select a preferred date and time.{calendarConnected ? " We'll sync this with your Google Calendar." : " If you've connected Google Calendar in Settings, this will be synced automatically."}</p>
            <form style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }} onSubmit={async (e) => {
              e.preventDefault();
              setIsBookingLoading(true);
              setBookingMsg("");
              try {
                const res = await apiFetch("/api/appointments/", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: user?.uid || user?.email || "guest",
                    userEmail: user?.email || "demo@example.com",
                    userName: user?.fullName || "Patient",
                    clinicName: selectedClinic.name,
                    type: selectedClinic.type === "dental" ? "Dental Appointment"
                        : selectedClinic.type === "optometry" ? "Optometry / Eye Exam"
                        : selectedClinic.type === "pharmacy" ? "Pharmacy Visit"
                        : selectedClinic.type === "hospital" ? "Medical Appointment"
                        : "Appointment",
                    date: localDateAndTimeToIsoUtc(apptDate, apptTime),
                    duration: 45,
                  }),

                });
                const data = await res.json();
                if (data.success) {
                  if (typeof refreshAppointments === "function") {
                    void refreshAppointments();
                  }
                  setBookingMsg("✅ Appointment booked! It’ll show on your dashboard and in your calendar.");
                  setTimeout(() => { setShowBookingModal(false); setBookingMsg(""); }, 2500);
                } else {
                  setBookingMsg(`⚠️ Booking failed: ${data.detail || "Error"}`);
                }
              } catch {
                setBookingMsg("⚠️ Server error. Is the backend running?");
              } finally {
                setIsBookingLoading(false);
              }
            }}>
              <label className="form-field">Date <input type="date" required value={apptDate} onChange={e => setApptDate(e.target.value)} min={new Date().toISOString().split("T")[0]} /></label>
              <label className="form-field">Time <input type="time" required value={apptTime} onChange={e => setApptTime(e.target.value)} /></label>
              {bookingMsg && <p style={{ textAlign: "center", fontSize: "0.9rem" }}>{bookingMsg}</p>}
              <div className="button-row" style={{ marginTop: "1rem" }}>
                <button className="secondary-btn" type="button" onClick={() => setShowBookingModal(false)}>Cancel</button>
                <button className="primary-btn" type="submit" disabled={isBookingLoading}>{isBookingLoading ? "Booking..." : "Confirm Booking"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

