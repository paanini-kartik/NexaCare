import { useState } from "react";
import { Link } from "react-router-dom";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const defaultForm = {
  fullName: "",
  email: "",
  password: "",
  role: "user",
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [isSignup, setIsSignup] = useState(true);
  const [form, setForm] = useState(defaultForm);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = (event) => {
    event.preventDefault();
    login(form, { isSignup });
    navigate(isSignup ? "/dashboard" : "/dashboard", { replace: true });
  };

  return (
    <section className="auth-page">
      <div className="auth-panel card-surface">
        <div className="auth-top-row">
          <Link className="ghost-btn" to="/landing">
            Back to NexaCare overview
          </Link>
        </div>
        <div className="auth-header">
          <span className="status-dot" />
          <p>Secure Dummy Environment (No backend connected)</p>
        </div>
        <h1>{isSignup ? "Create account" : "Log in"}</h1>
        <p>Professional mock flow for UX/testing. Firebase Auth integration is intentionally not enabled yet.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          {isSignup ? (
            <label className="form-field">
              Full name
              <input
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                required
              />
            </label>
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

          <label className="form-field">
            Account type
            <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}>
              <option value="user">Individual User</option>
              <option value="employer">Employer</option>
            </select>
          </label>

          <button className="primary-btn pulse-glow" type="submit">
            {isSignup ? "Create account" : "Log in"}
          </button>

          <div className="auth-switch-row">
            <span>{isSignup ? "Already have an account?" : "Need an account?"}</span>
            <button className="ghost-btn" type="button" onClick={() => setIsSignup((s) => !s)}>
              {isSignup ? "Log in" : "Sign up"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
