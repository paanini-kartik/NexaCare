import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function CategoryEditor({ categories, onChange }) {
  const rows = Array.isArray(categories) ? categories : [];
  const patch = (next) => onChange(next);

  return (
    <div>
      {rows.length === 0 ? (
        <p className="page-section-lead">No benefit categories yet—add a row for each line of coverage.</p>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Coverage (0–1)</th>
              <th>Annual limit</th>
              <th aria-label="Remove category" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`cat-${idx}`}>
                <td>
                  <input
                    className="table-input"
                    value={row.name}
                    onChange={(e) => {
                      const next = rows.map((c, i) => (i === idx ? { ...c, name: e.target.value } : c));
                      patch(next);
                    }}
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={row.coverage}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      const next = rows.map((c, i) => (i === idx ? { ...c, coverage: v, used: 0 } : c));
                      patch(next);
                    }}
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    min="0"
                    value={row.annualLimit}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      const next = rows.map((c, i) => (i === idx ? { ...c, annualLimit: v, used: 0 } : c));
                      patch(next);
                    }}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => patch(rows.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="button-row" style={{ marginTop: "0.75rem" }}>
        <button
          type="button"
          className="secondary-btn"
          onClick={() =>
            patch([...rows, { name: "New category", coverage: 0, annualLimit: 0, used: 0 }])
          }
        >
          Add category
        </button>
      </div>
    </div>
  );
}

export default function EmployerPage() {
  const {
    user,
    myEnterprise,
    enterprises,
    updateEmployeeRoleCategories,
    addEmployeeRole,
    renameEmployeeRole,
    setEmployerPreviewRole,
    ensureEmployerInviteKeysForMyOrg,
  } = useAuth();

  const [tab, setTab] = useState("overview");
  const [newRoleName, setNewRoleName] = useState("");

  const org = useMemo(() => {
    if (user?.accountType === "employer" && user.enterpriseId) {
      return enterprises.find((e) => e.id === user.enterpriseId) || null;
    }
    return myEnterprise;
  }, [user, enterprises, myEnterprise]);

  const isEmployer = user?.accountType === "employer";

  useEffect(() => {
    if (org?.id) ensureEmployerInviteKeysForMyOrg();
  }, [org?.id, ensureEmployerInviteKeysForMyOrg]);

  if (!isEmployer) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!org) {
    return (
      <div className="page-flow">
        <header className="page-hero page-hero--alive">
          <h1>Employer hub</h1>
          <p>
            No organization is linked to this employer account yet. At sign-up, choosing <strong>Yes</strong> for{" "}
            <strong>Firm role manager (employer)</strong> creates one automatically.
          </p>
        </header>
      </div>
    );
  }

  const previewRoleId = org.employerPreviewRoleId || org.employeeRoles[0]?.id;
  const activeRole = org.employeeRoles.find((r) => r.id === previewRoleId) || org.employeeRoles[0];

  return (
    <div className="page-flow">
      <header className="page-hero page-hero--alive">
        <h1>Employer hub</h1>
        <p>
          {org.name} — manage job roles and employer-set benefit rates. Edits apply everywhere that role is assigned,
          including dependents and contributors on a synced household. Invite keys are created automatically for each role;
          copy them from <strong>Settings → Connections</strong>.
        </p>
      </header>

      <div className="tab-strip tab-strip--page" role="tablist" aria-label="Employer sections">
        {[
          { id: "overview", label: "Overview" },
          { id: "roles", label: "Job roles & rates" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab-strip-btn ${tab === t.id ? "tab-strip-btn--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <section className="contained employer-form-panel">
          <h2 className="page-section-title">Organization</h2>
          <p className="page-section-lead">Preview how members see benefits when they use a specific role.</p>
          <div className="form-grid">
            <label className="form-field">
              Benefit preview role
              <select
                value={previewRoleId || ""}
                onChange={(e) => setEmployerPreviewRole(org.id, e.target.value)}
              >
                {org.employeeRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {activeRole ? (
            <div className="employer-preview-mini">
              <h3 className="title-vibe" style={{ marginTop: "1rem" }}>
                Snapshot — {activeRole.name}
              </h3>
              <ul className="checklist-open">
                {(activeRole.categories || []).length ? (
                  activeRole.categories.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      {c.name}: {Math.round((c.coverage || 0) * 100)}% coverage · $
                      {(c.annualLimit || 0).toLocaleString()} annual limit
                    </li>
                  ))
                ) : (
                  <li className="page-section-lead" style={{ listStyle: "none", margin: 0 }}>
                    No categories defined for this role yet.
                  </li>
                )}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "roles" ? (
        <div className="employer-roles-stack">
          {org.employeeRoles.map((role) => (
            <section key={role.id} className="contained employer-form-panel">
              <div className="employer-role-head">
                <label className="form-field employer-role-title">
                  Role name
                  <input
                    value={role.name}
                    onChange={(e) => renameEmployeeRole(org.id, role.id, e.target.value)}
                  />
                </label>
              </div>
              <p className="page-section-lead">
                Set coverage and annual limits for <strong>{role.name}</strong>. Member usage starts at $0; this table is
                only the plan design. Assign roles via invite keys (auto-created per role).
              </p>
              <CategoryEditor
                categories={role.categories}
                onChange={(next) => updateEmployeeRoleCategories(org.id, role.id, next)}
              />
            </section>
          ))}

          <section className="contained employer-form-panel">
            <h2 className="page-section-title">Add role</h2>
            <p className="page-section-lead">
              Creates a new template (categories start empty or copy from your first role if it has rows). An invite key
              is created automatically.
            </p>
            <div className="form-grid form-grid--inline">
              <label className="form-field">
                Name
                <input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. Contract" />
              </label>
              <div className="button-row" style={{ alignSelf: "end" }}>
                <button className="primary-btn" type="button" onClick={() => addEmployeeRole(org.id, newRoleName || "New role")}>
                  Add employee role
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
