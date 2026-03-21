import { useState } from "react";

export default function EmployerPage() {
  const [company, setCompany] = useState("");
  const [planName, setPlanName] = useState("");
  const [employeeCount, setEmployeeCount] = useState("50");

  return (
    <div className="two-col-grid">
      <section className="card-surface section-card">
        <h2>Employer Plan Setup</h2>
        <p>Register your organization and configure employee benefit distribution.</p>
        <div className="form-grid">
          <label className="form-field">Company name<input value={company} onChange={(e) => setCompany(e.target.value)} /></label>
          <label className="form-field">Plan name<input value={planName} onChange={(e) => setPlanName(e.target.value)} /></label>
          <label className="form-field">Employees<input type="number" min="1" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} /></label>
        </div>
        <button className="primary-btn" type="button">Register employer plan</button>
      </section>

      <section className="card-surface section-card">
        <h3>Bulk Operations</h3>
        <ul className="clean-list">
          <li>Import employee roster (CSV)</li>
          <li>Assign default coverage bundles</li>
          <li>Send onboarding links automatically</li>
          <li>Monitor utilization trends by category</li>
        </ul>
      </section>
    </div>
  );
}
