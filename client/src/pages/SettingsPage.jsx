import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const SETTINGS_TABS = [
  { id: "access", label: "Access & roles" },
  { id: "connections", label: "Connections" },
  { id: "profile", label: "Profile" },
];

export default function SettingsPage() {
  const { user, enterprises, household, updateUser, updateHousehold } = useAuth();

  const [tab, setTab] = useState("access");

  const [localFamilyRole, setLocalFamilyRole] = useState(user?.familyRole || "owner");
  const [joinEnterpriseId, setJoinEnterpriseId] = useState(user?.enterpriseId || "");
  const [joinRoleId, setJoinRoleId] = useState(user?.employeeRoleTemplateId || "");
  const [hhEnterpriseId, setHhEnterpriseId] = useState(household.enterpriseId || "");
  const [hhRoleId, setHhRoleId] = useState(household.sharedBenefitRoleId || "");
  const [familyLinkCode, setFamilyLinkCode] = useState(household?.familyLinkCode || "");
  const [companyLinkCode, setCompanyLinkCode] = useState(user?.companyLinkCode || "");
  const [displayName, setDisplayName] = useState(user?.fullName || "");

  useEffect(() => {
    if (!user) return;
    setLocalFamilyRole(user.familyRole || "owner");
    setJoinEnterpriseId(user.enterpriseId || "");
    setJoinRoleId(user.employeeRoleTemplateId || "");
    setDisplayName(user.fullName || "");
    setCompanyLinkCode(user.companyLinkCode || "");
  }, [user]);

  useEffect(() => {
    setHhEnterpriseId(household.enterpriseId || "");
    setHhRoleId(household.sharedBenefitRoleId || "");
    setFamilyLinkCode(household.familyLinkCode || "");
  }, [household.enterpriseId, household.sharedBenefitRoleId, household.familyLinkCode]);

  const selectedWorkOrg = useMemo(
    () => enterprises.find((e) => e.id === joinEnterpriseId),
    [enterprises, joinEnterpriseId]
  );

  const selectedHhOrg = useMemo(
    () => enterprises.find((e) => e.id === hhEnterpriseId),
    [enterprises, hhEnterpriseId]
  );

  const isEmployer = user?.accountType === "employer";

  const saveAccess = (e) => {
    e.preventDefault();
    if (!user || isEmployer) return;
    const workOrg = joinEnterpriseId.trim() || null;
    const workRole = workOrg && joinRoleId ? joinRoleId : null;
    updateUser({
      familyRole: localFamilyRole,
      enterpriseId: workOrg,
      employeeRoleTemplateId: workRole,
    });
  };

  const saveConnections = (e) => {
    e.preventDefault();
    if (!user || isEmployer) return;
    updateHousehold({
      enterpriseId: hhEnterpriseId || null,
      sharedBenefitRoleId: hhRoleId || null,
      familyLinkCode: familyLinkCode.trim(),
    });
    updateUser({
      companyLinkCode: companyLinkCode.trim() || null,
    });
  };

  const saveProfile = (e) => {
    e.preventDefault();
    if (!user) return;
    updateUser({ fullName: displayName.trim() || user.fullName });
  };

  const canEditHouseholdSync = user?.accountType !== "employer" && user?.familyRole === "owner";

  return (
    <div className="page-flow settings-flow">
      <header className="page-hero page-hero--alive">
        <h1>Settings</h1>
        <p>
          You can be in a <strong>family</strong> and connected as an <strong>employee</strong> at the same time—benefits
          can show both household and work schedules. If you chose <strong>Yes</strong> for firm role manager at sign-up,
          manage benefit roles in <strong>Employer Hub</strong>.
        </p>
      </header>

      <div className="settings-bar tab-strip tab-strip--page" role="tablist" aria-label="Settings sections">
        {SETTINGS_TABS.map((t) => (
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

      {tab === "access" ? (
        <section className="contained settings-section">
          <h2 className="page-section-title">Access & roles</h2>
          {isEmployer ? (
            <p className="page-section-lead">
              You are signed in as an <strong>enterprise employer</strong>. Member and employee fields are not used here—use{" "}
              <strong>Employer Hub</strong> to define job roles and benefit rates for your organization.
            </p>
          ) : (
            <>
              <p className="page-section-lead">
                Set your <strong>family role</strong> and, if you have a job-based plan, your <strong>work</strong>{" "}
                organization and role. Both can be active together with household links on the Connections tab.
              </p>
              <form className="settings-form" onSubmit={saveAccess}>
                <h3 className="settings-subhead">Family</h3>
                <label className="form-field">
                  Family role
                  <select value={localFamilyRole} onChange={(e) => setLocalFamilyRole(e.target.value)}>
                    <option value="owner">Owner</option>
                    <option value="contributor">Contributor</option>
                    <option value="dependent">Dependent</option>
                  </select>
                </label>

                <h3 className="settings-subhead">Work (optional)</h3>
                <p className="page-section-lead" style={{ marginBottom: "0.65rem" }}>
                  Your employer-assigned benefit role. Leave organization empty if you only use household benefits.
                </p>
                <div className="form-grid">
                  <label className="form-field">
                    Employer organization
                    <select
                      value={joinEnterpriseId}
                      onChange={(e) => {
                        setJoinEnterpriseId(e.target.value);
                        setJoinRoleId("");
                      }}
                    >
                      <option value="">None</option>
                      {enterprises.map((ent) => (
                        <option key={ent.id} value={ent.id}>
                          {ent.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    Employee benefit role
                    <select
                      value={joinRoleId}
                      onChange={(e) => setJoinRoleId(e.target.value)}
                      disabled={!selectedWorkOrg}
                    >
                      <option value="">Select role</option>
                      {selectedWorkOrg?.employeeRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="button-row">
                  <button className="primary-btn" type="submit">
                    Save access
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      ) : null}

      {tab === "connections" ? (
        <section className="contained settings-section">
          <h2 className="page-section-title">Connections</h2>
          {isEmployer ? (
            <p className="page-section-lead">
              Your organization is tied to this account. Invite flows and SSO would live here in a production build.
            </p>
          ) : (
            <>
              <p className="page-section-lead">
                Link your <strong>household</strong> to an employer schedule (family owners). This is separate from your{" "}
                <strong>work</strong> assignment—you can use both.
              </p>

              <form className="settings-form" onSubmit={saveConnections}>
                <h3 className="settings-subhead">Household → employer schedule</h3>
                <p className="page-section-lead" style={{ marginBottom: "0.75rem" }}>
                  When you are a family <strong>owner</strong>, pick an organization and benefit role so contributors and
                  dependents inherit the same propagated rates.
                </p>
                {canEditHouseholdSync ? (
                  <div className="form-grid">
                    <label className="form-field">
                      Organization
                      <select
                        value={hhEnterpriseId}
                        onChange={(e) => {
                          setHhEnterpriseId(e.target.value);
                          setHhRoleId("");
                        }}
                      >
                        <option value="">None</option>
                        {enterprises.map((ent) => (
                          <option key={ent.id} value={ent.id}>
                            {ent.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field">
                      Household benefit role
                      <select value={hhRoleId} onChange={(e) => setHhRoleId(e.target.value)} disabled={!selectedHhOrg}>
                        <option value="">Select role</option>
                        {selectedHhOrg?.employeeRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : (
                  <p className="page-section-lead" style={{ marginBottom: "0.75rem" }}>
                    Only the family <strong>owner</strong> can change household-to-employer links. Current household sync
                    uses organization <strong>{hhEnterpriseId ? "selected" : "none"}</strong>.
                  </p>
                )}

                <h3 className="settings-subhead">Other families &amp; companies</h3>
                <div className="form-grid">
                  <label className="form-field">
                    Family link code
                    <input
                      value={familyLinkCode}
                      onChange={(e) => setFamilyLinkCode(e.target.value)}
                      placeholder="e.g. FAM-7K2Q (demo)"
                    />
                  </label>
                  <label className="form-field">
                    Company / HR join code
                    <input
                      value={companyLinkCode}
                      onChange={(e) => setCompanyLinkCode(e.target.value)}
                      placeholder="e.g. ORG-ACME-2026"
                    />
                  </label>
                </div>
                <p className="auth-hint">
                  Mock fields only—use them to remember who you are connected to until real invites and directory sync
                  ship.
                </p>

                <div className="button-row">
                  <button className="primary-btn" type="submit">
                    Save connections
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      ) : null}

      {tab === "profile" ? (
        <section className="contained settings-section">
          <h2 className="page-section-title">Profile</h2>
          <p className="page-section-lead">Full name appears in the header and across the portal.</p>
          <form className="settings-form" onSubmit={saveProfile}>
            <label className="form-field">
              Full name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </label>
            <div className="button-row">
              <button className="primary-btn" type="submit">
                Save profile
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
