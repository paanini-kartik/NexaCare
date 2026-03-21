import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

function CategoryEditor({ categories, onChange }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Coverage (0–1)</th>
            <th>Annual limit</th>
            <th>Used</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((row, idx) => (
            <tr key={row.name}>
              <td>{row.name}</td>
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
                    const next = categories.map((c, i) => (i === idx ? { ...c, coverage: v } : c));
                    onChange(next);
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
                    const next = categories.map((c, i) => (i === idx ? { ...c, annualLimit: v } : c));
                    onChange(next);
                  }}
                />
              </td>
              <td>
                <input
                  className="table-input"
                  type="number"
                  min="0"
                  value={row.used}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    const next = categories.map((c, i) => (i === idx ? { ...c, used: v } : c));
                    onChange(next);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

  if (!isEmployer || !org) {
    return (
      <div className="page-flow">
        <header className="page-hero page-hero--alive">
          <h1>Employer hub</h1>
          <p>
            At sign-up, choose <strong>Yes</strong> for <strong>Firm role manager (employer)</strong> to create an organization,
            define employee benefit roles, and push rate changes to every assignment—including household members on the same role.
          </p>
        </header>
        <section className="contained">
          <p className="page-section-lead" style={{ marginBottom: 0 }}>
            Employees can join from the Employee tab during signup and pick a role you define here. Family accounts can link
            to your organization from Benefits after an owner enables household sync.
          </p>
        </section>
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
          including dependents and contributors on a synced household.
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
                {activeRole.categories.map((c) => (
                  <li key={c.name}>
                    {c.name}: {Math.round(c.coverage * 100)}% coverage · ${c.annualLimit.toLocaleString()} annual · $
                    {c.used.toLocaleString()} used
                  </li>
                ))}
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
                Adjust limits for <strong>{role.name}</strong>. Assign this role during employee signup or when a family
                owner links a household—everyone on that assignment refreshes together.
              </p>
              <CategoryEditor
                categories={role.categories}
                onChange={(next) => updateEmployeeRoleCategories(org.id, role.id, next)}
              />
            </section>
          ))}

          <section className="contained employer-form-panel">
            <h2 className="page-section-title">Add role</h2>
            <p className="page-section-lead">Creates a new template with the same categories as your first role—edit values freely.</p>
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
