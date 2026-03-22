import { Bell, Search, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ChatbotWidget from "./ChatbotWidget";
import OnboardingOverlay from "./OnboardingOverlay";
import { apiFetch } from "../lib/api";

const navItems = [
  { to: "/dashboard", label: "Dashboard", enabled: true },
  { to: "/health-profile", label: "Health Profile", enabled: true, memberOnly: true },
  { to: "/health-compass", label: "Health Compass", enabled: true },
  { to: "/benefits", label: "Benefits", enabled: true, memberOnly: true },
  { to: "/employer", label: "Employer Hub", enabled: true, employerOnly: true },
  { to: "/settings", label: "Settings", enabled: true },
  { to: "/emergency", label: "Emergency", enabled: true },
];

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHealthCompass = pathname.startsWith("/health-compass");
  const { user, logout, showOnboardingOverlay, effectiveInsurers } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [notification, setNotification] = useState(null);

  const refreshAppointments = useCallback(async () => {
    // Must match `userId` stored on appointment docs (Firebase uid preferred; email for local-only accounts)
    const ownerKey = user?.uid || user?.email;
    if (!ownerKey) {
      setAppointments([]);
      return [];
    }

    try {
      const response = await apiFetch(`/api/appointments/${encodeURIComponent(ownerKey)}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setAppointments(data);
        return data;
      }
    } catch {
      // Keep the current UI state if the backend is temporarily unavailable.
    }

    return null;
  }, [user?.uid, user?.email]);

  useEffect(() => {
    void refreshAppointments();
  }, [refreshAppointments]);

  // Map real benefits from effectiveInsurers (flatten all categories)
  // Category names are: "Dental", "Optometry", "Physical" (from employerBenefitTemplates)
  const mappedBenefits = useMemo(() => {
    const allCats = (effectiveInsurers ?? []).flatMap((i) => i.categories ?? []);
    if (!allCats.length) return null;
    const find = (...keys) =>
      allCats.find((c) =>
        keys.some((k) => String(c.name ?? c.label ?? c.key ?? "").toLowerCase().includes(k))
      );
    const dental = find("dental");
    const vision = find("vision", "optometry", "eye");
    const physio = find("physio", "physical", "physiotherapy");
    // Return null only if ALL three are missing AND have zero limit
    const hasAny = [dental, vision, physio].some((c) => c && (c.annualLimit ?? 0) > 0);
    return {
      dental: { total: dental?.annualLimit ?? 0, used: dental?.used ?? 0 },
      vision: { total: vision?.annualLimit ?? 0, used: vision?.used ?? 0 },
      physio: { total: physio?.annualLimit ?? 0, used: physio?.used ?? 0 },
      hasAny,
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
    if (!appt?.id) return;
    setAppointments((prev) => {
      if (appt._cancelled) {
        return prev.filter((existing) => existing.id !== appt.id);
      }

      const next = prev.filter((existing) => existing.id !== appt.id);
      return [...next, appt];
    });
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
    <>
      <div className="portal-shell">
        <aside className="sidebar-fixed">
          <div className="sidebar-body">
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
          </div>

          <button className="secondary-btn sidebar-logout" type="button" onClick={onLogout}>
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

          <main className={`main-content${isHealthCompass ? " main-content--compass-bleed" : ""}`}>
            <div className="content-container">
              <Outlet context={{ appointments, refreshAppointments }} />
            </div>
          </main>
        </div>

        {notification && (
          <div className={`agent-toast agent-toast--${notification.type}`} role="alert">
            {notification.message}
          </div>
        )}
        {showOnboardingOverlay ? <OnboardingOverlay /> : null}
      </div>
      {/* Zero-size anchor so fixed UI doesn’t add a flex/grid row (sidebar stays full height) */}
      <div className="layout-fixed-layer">
        <ChatbotWidget
          appointments={appointments}
          benefits={mappedBenefits}
          onBookAppointment={handleBookAppointment}
          onRefreshAppointments={refreshAppointments}
          onShowNotification={handleShowNotification}
        />
      </div>
    </>
  );
}
