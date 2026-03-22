import { Bell, Search, Settings } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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
  const { user, logout, showOnboardingOverlay } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [notification, setNotification] = useState(null);

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
