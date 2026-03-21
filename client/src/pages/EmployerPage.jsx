import { useState } from "react";

export default function EmployerPage() {
  const [company, setCompany] = useState("");
  const [planName, setPlanName] = useState("");
  const [employeeCount, setEmployeeCount] = useState("50");

  return (
    <div className="page-flow">
      <header className="page-hero page-hero--alive">
        <h1>Employer hub</h1>
        <p>
          Register plans and think about rollout in one breath. User input lives in a single contained panel; the rest
          is just copy and a clear checklist.
        </p>
      </header>

      <div className="employer-layout">
        <section className="contained employer-form-panel">
          <h2 className="page-section-title">Plan setup</h2>
          <p className="page-section-lead">Dummy form—wire your backend when ready.</p>
          <div className="form-grid">
            <label className="form-field">
              Company name
              <input value={company} onChange={(e) => setCompany(e.target.value)} />
            </label>
            <label className="form-field">
              Plan name
              <input value={planName} onChange={(e) => setPlanName(e.target.value)} />
            </label>
            <label className="form-field">
              Employees
              <input type="number" min="1" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} />
            </label>
          </div>
          <div className="button-row">
            <button className="primary-btn" type="button">
              Register employer plan
            </button>
          </div>
        </section>

        <section className="employer-aside">
          <h2 className="page-section-title">Bulk operations</h2>
          <ul className="checklist-open">
            <li>Import employee roster (CSV)</li>
            <li>Assign default coverage bundles</li>
            <li>Send onboarding links automatically</li>
            <li>Monitor utilization trends by category</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
