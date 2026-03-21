import { Bell, Search, Settings } from "lucide-react";
import { useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ChatbotWidget from "./ChatbotWidget";
import OnboardingOverlay from "./OnboardingOverlay";

const navItems = [
  { to: "/dashboard", label: "Dashboard", enabled: true },
  { to: "/health-profile", label: "Health Profile", enabled: true },
  { to: "/health-compass", label: "Health Compass", enabled: true },
  { to: "/benefits", label: "Benefits", enabled: true },
  { to: "/employer", label: "Employer Hub", enabled: true },
  { to: "/settings", label: "Settings", enabled: true },
  { to: "/emergency", label: "Emergency", enabled: true },
  { to: "/soon", label: "Labs (Soon)", enabled: false },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, enterprises, logout, showOnboardingOverlay } = useAuth();

  const workOrgLabel = useMemo(() => {
    if (!user?.enterpriseId || !user?.employeeRoleTemplateId) return null;
    return enterprises.find((e) => e.id === user.enterpriseId)?.name || "Work";
  }, [user?.enterpriseId, user?.employeeRoleTemplateId, enterprises]);

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
          {navItems.map((item) =>
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

      <ChatbotWidget />
      {showOnboardingOverlay ? <OnboardingOverlay /> : null}
    </div>
  );
}
