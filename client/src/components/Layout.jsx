import { Bell, Search, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ChatbotWidget from "./ChatbotWidget";
import OnboardingOverlay from "./OnboardingOverlay";

const navItems = [
  { to: "/dashboard", label: "Dashboard", enabled: true },
  { to: "/health-profile", label: "Health Profile", enabled: true, memberOnly: true },
  { to: "/health-compass", label: "Health Compass", enabled: true },
  { to: "/benefits", label: "Benefits", enabled: true, memberOnly: true },
  { to: "/employer", label: "Employer Hub", enabled: true, employerOnly: true },
  { to: "/settings", label: "Settings", enabled: true },
  { to: "/emergency", label: "Emergency", enabled: true },
  { to: "/soon", label: "Labs (Soon)", enabled: false },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout, showOnboardingOverlay, effectiveInsurers } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [notification, setNotification] = useState(null);

  // Fetch real appointments from backend on login
  useEffect(() => {
    if (!user?.email) return;
    fetch(`http://localhost:8000/api/appointments/${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAppointments(data); })
      .catch(() => {});
  }, [user?.email]);

  // Map real benefits from effectiveInsurers (flatten all categories)
  const mappedBenefits = useMemo(() => {
    const allCats = (effectiveInsurers ?? []).flatMap((i) => i.categories ?? []);
    if (!allCats.length) return null;
    const find = (key) =>
      allCats.find((c) =>
        (c.key ?? c.label ?? "").toLowerCase().includes(key)
      );
    const dental = find("dental");
    const vision = find("vision");
    const physio = find("physio") || find("physiotherapy");
    if (!dental && !vision && !physio) return null;
    return {
      dental: { total: dental?.annualLimit ?? 0, used: dental?.used ?? 0 },
      vision: { total: vision?.annualLimit ?? 0, used: vision?.used ?? 0 },
      physio: { total: physio?.annualLimit ?? 0, used: physio?.used ?? 0 },
    };
  }, [effectiveInsurers]);

  const visibleNavItems = useMemo(
    () =>
      navItems.filter((item) => {
        if (item.employerOnly && user?.accountType !== "employer") return false;
        if (item.memberOnly && user?.accountType === "employer") return false;
        return true;
      }),
    [user?.accountType]
  );

  const handleBookAppointment = useCallback((appt) => {
    setAppointments((prev) => [...prev, appt]);
  }, []);

  const handleShowNotification = useCallback((message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const onLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="portal-shell">
      <aside className="sidebar-fixed">
        <div className="brand-wrap">
          <div className="brand-icon">N</div>
          <div>
            <strong>NexaCare</strong>
            <p>{user?.accountType === "employer" ? "Organization" : "Patient Portal"}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleNavItems.map((item) =>
            item.enabled ? (
              <NavLink key={item.to} to={item.to} className="nav-item">
                {item.label}
              </NavLink>
            ) : (
              <span key={item.to} className="nav-item disabled">
                {item.label}
              </span>
            )
          )}
        </nav>

        <button className="secondary-btn" type="button" onClick={onLogout}>
          Log out
        </button>
      </aside>

      <div className="content-wrap vibe-canvas">
        <header className="sticky-header">
          <div className="search-pill">
            <Search size={16} />
            <input placeholder="Search appointments, clinics, support" />
          </div>
          <div className="header-right">
            <button
              className="icon-btn"
              type="button"
              aria-label="Settings"
              onClick={() => navigate("/settings")}
            >
              <Settings size={16} />
            </button>
            <button className="icon-btn" type="button" aria-label="Notifications">
              <Bell size={16} />
            </button>
            <div className="profile-stack">
              <div className="avatar">{(user?.fullName || "U").slice(0, 1).toUpperCase()}</div>
              <div>
                <strong>{user?.fullName || "User"}</strong>
              </div>
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="content-container">
            <Outlet />
          </div>
        </main>
      </div>

      <ChatbotWidget
        appointments={appointments}
        benefits={mappedBenefits}
        onBookAppointment={handleBookAppointment}
        onShowNotification={handleShowNotification}
      />
      {notification && (
        <div className={`agent-toast agent-toast--${notification.type}`} role="alert">
          {notification.message}
        </div>
      )}
      {showOnboardingOverlay ? <OnboardingOverlay /> : null}
    </div>
  );
}
