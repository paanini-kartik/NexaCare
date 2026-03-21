import { Bell, Search, Settings } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ChatbotWidget from "./ChatbotWidget";
import OnboardingOverlay from "./OnboardingOverlay";

const navItems = [
  { to: "/dashboard", label: "Dashboard", enabled: true },
  { to: "/health-profile", label: "Health Profile", enabled: true },
  { to: "/health-compass", label: "Health Compass", enabled: true },
  { to: "/benefits", label: "Benefits", enabled: true },
  { to: "/employer", label: "Employer Hub", enabled: true, employerOnly: true },
  { to: "/settings", label: "Settings", enabled: true },
  { to: "/emergency", label: "Emergency", enabled: true },
  { to: "/soon", label: "Labs (Soon)", enabled: false },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, enterprises, logout, showOnboardingOverlay } = useAuth();
  const [appointments, setAppointments] = useState([
    { id: "apt_01", type: "Annual Dental Checkup",  clinicName: "Smile Dental Studio",    date: "2026-04-02T10:00:00Z", duration: 60, status: "upcoming" },
    { id: "apt_02", type: "Physiotherapy Session",  clinicName: "ActiveCare Physio",       date: "2026-04-10T14:30:00Z", duration: 45, status: "upcoming" },
    { id: "apt_03", type: "General Checkup",        clinicName: "Bayview Family Medicine", date: "2026-04-18T09:00:00Z", duration: 30, status: "upcoming" },
    { id: "apt_04", type: "Vision Test",            clinicName: "ClearView Optometry",     date: "2025-12-15T11:00:00Z", duration: 45, status: "past"     },
    { id: "apt_05", type: "Dental Cleaning",        clinicName: "Smile Dental Studio",     date: "2025-10-03T10:00:00Z", duration: 45, status: "past"     },
  ]);
  const [notification, setNotification] = useState(null);

  const workOrgLabel = useMemo(() => {
    if (!user?.enterpriseId || !user?.employeeRoleTemplateId) return null;
    return enterprises.find((e) => e.id === user.enterpriseId)?.name || "Work";
  }, [user?.enterpriseId, user?.employeeRoleTemplateId, enterprises]);

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => !item.employerOnly || user?.accountType === "employer"),
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
            <p>Patient Portal</p>
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
                <p>
                  {user?.accountType === "employer" ? (
                    "Employer · organization owner"
                  ) : (
                    <>
                      Family · {user?.familyRole || "member"}
                      {workOrgLabel ? ` · Work · ${workOrgLabel}` : ""}
                    </>
                  )}
                </p>
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
