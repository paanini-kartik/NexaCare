import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const defaultForm = {
  fullName: "",
  email: "",
  password: "",
  companyName: "",
  isEmployer: false,
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, authReady } = useAuth();
  const [isSignup, setIsSignup] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!authReady) {
    return (
      <section className="auth-page">
        <div className="auth-panel contained auth-contained">
          <p className="page-section-lead">Loading…</p>
        </div>
      </section>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");

    try {
      if (isSignup) {
        await login(
          {
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            companyName: form.companyName,
            isEmployer: form.isEmployer,
          },
          { isSignup: true }
        );
      } else {
        await login(
          {
            email: form.email,
            password: form.password,
          },
          { isSignup: false }
        );
      }
    } catch (err) {
      const code = err?.code || "";
      const map = {
        "auth/email-already-in-use": "That email is already registered. Try logging in.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/weak-password": "Password should be at least 6 characters.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/user-not-found": "No account found for that email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
      };
      setAuthError(map[code] || err?.message || "Something went wrong. Try again.");
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-panel contained auth-contained">
        <div className="auth-top-row">
          <Link className="ghost-btn" to="/landing">
            Back to NexaCare overview
          </Link>
        </div>
        <div className="auth-header">
          <span className="status-dot" />
          <p>
            {import.meta.env.VITE_FIREBASE_API_KEY
              ? "Firebase Auth + Firestore (configure rules in production)"
              : "Local browser auth (no Firebase env — data stays in this browser only)"}
          </p>
        </div>
        <h1>{isSignup ? "Create account" : "Log in"}</h1>
        <p>
          {isSignup
            ? "Anyone can join NexaCare. Use one choice below only if you will manage benefit roles for a firm; otherwise leave it on No and set family or employee access later in Settings."
            : "Welcome back. Open Settings anytime to connect as a family member or employee."}
        </p>

        <form className="auth-form" onSubmit={onSubmit}>
          {isSignup ? (
            <>
              <label className="form-field">
                Full name
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </label>

              <div className="auth-employer-block">
                <span className="auth-employer-label" id="employer-toggle-label">
                  Firm role manager (employer)?
                </span>
                <p className="auth-hint" style={{ marginTop: 0 }}>
                  <strong>Yes</strong> — you administer benefit roles for your organization (Employer Hub).{" "}
                  <strong>No</strong> — you use the app like any member; switch family vs employee in Settings.
                </p>
                <div
                  className="employer-yesno"
                  role="group"
                  aria-labelledby="employer-toggle-label"
                >
                  <button
                    type="button"
                    className={`employer-yesno-btn ${!form.isEmployer ? "employer-yesno-btn--active" : ""}`}
                    onClick={() => setForm((prev) => ({ ...prev, isEmployer: false }))}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    className={`employer-yesno-btn ${form.isEmployer ? "employer-yesno-btn--active" : ""}`}
                    onClick={() => setForm((prev) => ({ ...prev, isEmployer: true }))}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {form.isEmployer ? (
                <label className="form-field">
                  Organization name
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g. Northwind Health"
                    required
                  />
                </label>
              ) : null}
            </>
          ) : null}

          <label className="form-field">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </label>

          <label className="form-field">
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </label>

          <button className="primary-btn pulse-glow" type="submit">
            {isSignup ? "Create account" : "Log in"}
          </button>

          {authError ? (
            <p className="auth-hint" role="alert">
              {authError}
            </p>
          ) : null}

          <div className="auth-switch-row">
            <span>{isSignup ? "Already have an account?" : "Need an account?"}</span>
            <button
              className="ghost-btn"
              type="button"
              onClick={() => {
                setIsSignup((s) => !s);
                setForm(defaultForm);
              }}
            >
              {isSignup ? "Log in" : "Sign up"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
