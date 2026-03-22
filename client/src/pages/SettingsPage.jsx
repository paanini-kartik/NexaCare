import { useEffect, useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { createDefaultManualProvider } from "../lib/manualBenefitDefaults";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";

function normEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function roleLabelForKey(roleTemplateId, enterprise) {
  const r = enterprise?.employeeRoles?.find((x) => x.id === roleTemplateId);
  return r?.name || roleTemplateId;
}

function describeWorkPosition(wa, enterprisesList) {
  const ent = enterprisesList.find((e) => e.id === wa.enterpriseId);
  const role = ent?.employeeRoles?.find((r) => r.id === wa.roleTemplateId);
  return {
    orgName: ent?.name || wa.enterpriseId,
    roleName: role?.name || wa.roleTemplateId,
  };
}

/** Editable category rows for a manual benefit provider (name, coverage, limit, add/remove). */
function EditableManualCategories({ categories, onApply }) {
  const rows = Array.isArray(categories) ? categories : [];
  const commit = (next) => onApply(next.map((c) => ({ ...c, used: 0 })));

  return (
    <div>
      {rows.length === 0 ? (
        <p className="page-section-lead" style={{ marginTop: "0.5rem" }}>
          No categories yet—add one for each line of coverage.
        </p>
      ) : null}
      <div className="table-wrap" style={{ marginTop: "0.5rem" }}>
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
            {rows.map((c, idx) => (
              <tr key={`mcat-${idx}`}>
                <td>
                  <input
                    className="table-input"
                    value={c.name}
                    onChange={(e) => {
                      const next = rows.map((row, i) => (i === idx ? { ...row, name: e.target.value } : row));
                      commit(next);
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
                    value={c.coverage}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      const next = rows.map((row, i) => (i === idx ? { ...row, coverage: v, used: 0 } : row));
                      commit(next);
                    }}
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    min="0"
                    value={c.annualLimit}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      const next = rows.map((row, i) => (i === idx ? { ...row, annualLimit: v, used: 0 } : row));
                      commit(next);
                    }}
                  />
                </td>
                <td>
                  <button type="button" className="secondary-btn" onClick={() => commit(rows.filter((_, i) => i !== idx))}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="button-row" style={{ marginTop: "0.5rem" }}>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => commit([...rows, { name: "New category", coverage: 0, annualLimit: 0, used: 0 }])}
        >
          Add category
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    user,
    sessionMeta,
    myEnterprise,
    currentFamily,
    updateUser,
    createFamilyGroup,
    joinFamilyWithKey,
    ownerSetFamilyMemberRole,
    applyEmployerInviteKey,
    removeWorkPosition,
    resolvedEnterprises,
    updateFamilyManualProviders,
    updatePersonalManualProviders,
    dissolveFamily,
    transferFamilyOwnership,
    leaveFamily,
  } = useAuth();

  const showConnectionsTab = (user?.connectionKeysCount || 0) > 0;

  const baseTabs = useMemo(() => {
    const t = [
      { id: "profile", label: "Profile" },
      { id: "access", label: "Access & roles" },
      { id: "integrations", label: "Integrations" },
    ];
    if (showConnectionsTab) t.push({ id: "connections", label: "Connections" });
    return t;
  }, [showConnectionsTab]);

  const [tab, setTab] = useState("profile");

  useEffect(() => {
    if (tab === "connections" && !showConnectionsTab) setTab("profile");
  }, [tab, showConnectionsTab]);

  const [searchParams] = useSearchParams();
  const [calendarConnected, setCalendarConnected] = useState(null); // null=loading, true/false
  const [calendarMsg, setCalendarMsg] = useState("");

  // Check calendar status on mount + handle redirect-back from Google
  useEffect(() => {
    if (!user?.email) return;
    const calParam = searchParams.get("calendar");
    if (calParam === "connected") {
      setCalendarConnected(true);
      setCalendarMsg("✅ Google Calendar connected! Appointments will be added automatically.");
      setTab("integrations");
    } else if (calParam === "error") {
      setCalendarMsg(`❌ Connection failed: ${searchParams.get("reason") || "unknown error"}`);
      setTab("integrations");
    }
    // Check current status from backend
    apiFetch(`/api/calendar/status?user_email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((d) => setCalendarConnected(d.connected))
      .catch(() => setCalendarConnected(false));
  }, [user?.email]);

  const connectCalendar = async () => {
    if (!user?.email) return;
    try {
      const res  = await apiFetch(`/api/calendar/auth-url?user_email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCalendarMsg("⚠️ " + (data.detail || "Could not get auth URL"));
      }
    } catch {
      setCalendarMsg("⚠️ Backend unavailable — make sure the server is running");
    }
  };

  const disconnectCalendar = async () => {
    if (!user?.email) return;
    await apiFetch(`/api/calendar/disconnect?user_email=${encodeURIComponent(user.email)}`, { method: "DELETE" });
    setCalendarConnected(false);
    setCalendarMsg("Google Calendar disconnected.");
  };

  const [displayName, setDisplayName] = useState(user?.fullName || "");

  const [familyJoinInput, setFamilyJoinInput] = useState("");
  const [familyJoinRole, setFamilyJoinRole] = useState("contributor");
  const [familyMsg, setFamilyMsg] = useState("");
  const [transferPick, setTransferPick] = useState("");

  const [employerKeyInput, setEmployerKeyInput] = useState("");
  const [employerKeyMsg, setEmployerKeyMsg] = useState("");
  const [newManualProvider, setNewManualProvider] = useState("");
  const [newManualPlan, setNewManualPlan] = useState("");

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.fullName || "");
  }, [user]);

  const isEmployer = user?.accountType === "employer";
  const isMember = user?.accountType === "member";
  const isOwner = user?.familyRole === "owner";
  const isContributor = user?.familyRole === "contributor";
  const isDependent = user?.familyRole === "dependent";
  const canEditFamilyManualProviders = isOwner || isContributor;
  const workLocked = Boolean(user?.employerAssignmentLocked);

  const transferCandidates = useMemo(() => {
    if (!currentFamily || !user?.email) return [];
    return currentFamily.members.filter(
      (m) => m.familyRole !== "owner" && normEmail(m.email) !== normEmail(user.email)
    );
  }, [currentFamily, user?.email]);

  useEffect(() => {
    if (!transferCandidates.length) {
      setTransferPick("");
      return;
    }
    setTransferPick((prev) => {
      const stillValid = transferCandidates.some((m) => normEmail(m.email) === normEmail(prev));
      return stillValid ? prev : transferCandidates[0].email;
    });
  }, [transferCandidates]);

  const saveProfile = (e) => {
    e.preventDefault();
    if (!user) return;
    updateUser({ fullName: displayName.trim() || user.fullName });
  };

  const onCreateFamily = () => {
    setFamilyMsg("");
    const res = createFamilyGroup();
    if (res.ok) {
      setFamilyMsg(`Family created. Share this join key: ${res.joinKey}`);
    } else {
      setFamilyMsg(res.error || "Could not create family");
    }
  };

  const onJoinFamily = async (e) => {
    e.preventDefault();
    setFamilyMsg("");
    const res = await joinFamilyWithKey(familyJoinInput, familyJoinRole);
    setFamilyMsg(res.ok ? "Joined family." : res.error || "Could not join");
  };

  const onDissolveFamily = () => {
    setFamilyMsg("");
    if (!window.confirm("Remove this family for everyone? This cannot be undone.")) return;
    const res = dissolveFamily();
    setFamilyMsg(res.ok ? "Family removed." : res.error || "Could not remove family");
  };

  const onTransferOwnership = () => {
    setFamilyMsg("");
    const res = transferFamilyOwnership(transferPick);
    setFamilyMsg(res.ok ? "Ownership transferred. You are now a contributor—you can leave the family if you want." : res.error || "Could not transfer");
  };

  const onLeaveFamily = () => {
    setFamilyMsg("");
    if (!window.confirm("Leave this family? You will need a new invite to rejoin.")) return;
    const res = leaveFamily();
    setFamilyMsg(res.ok ? "You left the family." : res.error || "Could not leave");
  };

  const onApplyEmployerKey = async (e) => {
    e.preventDefault();
    setEmployerKeyMsg("");
    const res = await applyEmployerInviteKey(employerKeyInput);
    setEmployerKeyMsg(res.ok ? "Employer assignment applied — your work role is locked." : res.error || "Invalid key");
    if (res.ok) setEmployerKeyInput("");
  };

  const employerKeysForOrg = useMemo(
    () => sessionMeta.employerKeys.filter((k) => k.orgId === user?.enterpriseId),
    [sessionMeta.employerKeys, user?.enterpriseId]
  );

  return (
    <div className="page-flow settings-flow">
      <header className="page-hero page-hero--alive">
        <h1>Settings</h1>
        <p>
          Profile first, then access and roles. Employer invite keys are created automatically for each job role; copy them
          under <strong>Connections</strong>. Family owners and contributors share one benefit-provider list that applies to
          everyone in the family.
        </p>
      </header>

      <div className="settings-bar tab-strip tab-strip--page" role="tablist" aria-label="Settings sections">
        {baseTabs.map((t) => (
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

      {tab === "access" ? (
        <section className="contained settings-section">
          <h2 className="page-section-title">Access &amp; roles</h2>

          {isEmployer ? (
            <>
              <p className="page-section-lead">
                Each <strong>job role</strong> gets an invite key automatically when the role is created (existing roles are
                backfilled when you open Employer Hub). When someone enters a key, their work benefits match that role and{" "}
                <strong>lock</strong>. Copy keys under <strong>Connections</strong>.
              </p>
              {employerKeysForOrg.length ? (
                <ul className="settings-key-items" style={{ marginTop: "0.75rem" }}>
                  {employerKeysForOrg.map((k) => (
                    <li key={k.key}>
                      <code>{k.key}</code>
                      <span className="settings-key-meta">
                        {roleLabelForKey(k.roleTemplateId, myEnterprise)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="page-section-lead">Open <strong>Employer Hub</strong> once to create keys for your roles.</p>
              )}
              <p className="page-section-lead" style={{ marginTop: "1.25rem" }}>
                Manage rate tables in <strong>Employer Hub</strong>.
              </p>
            </>
          ) : null}

          {isMember ? (
            <>
              <h3 className="settings-subhead">Family</h3>
              <p className="page-section-lead">
                Create a family (you become sole owner) or join with a short key. Owners assign <strong>contributor</strong>{" "}
                or <strong>dependent</strong>.
              </p>

              {!user.familyId ? (
                <div className="settings-family-grid">
                  <div className="contained settings-nested">
                    <h4 className="settings-mini-title">Create a family</h4>
                    <p className="page-section-lead">Creates a join key and unlocks the Connections tab.</p>
                    <button className="primary-btn" type="button" onClick={onCreateFamily}>
                      Create family
                    </button>
                  </div>
                  <form className="contained settings-nested" onSubmit={onJoinFamily}>
                    <h4 className="settings-mini-title">Join a family</h4>
                    <label className="form-field">
                      Family key
                      <input
                        value={familyJoinInput}
                        onChange={(e) => setFamilyJoinInput(e.target.value)}
                        placeholder="FAM-XXXXX"
                        autoComplete="off"
                      />
                    </label>
                    <label className="form-field">
                      Join as
                      <select value={familyJoinRole} onChange={(e) => setFamilyJoinRole(e.target.value)}>
                        <option value="contributor">Contributor</option>
                        <option value="dependent">Dependent</option>
                      </select>
                    </label>
                    <button className="primary-btn" type="submit">
                      Join with key
                    </button>
                  </form>
                </div>
              ) : null}

              {familyMsg ? <p className="auth-hint">{familyMsg}</p> : null}

              {currentFamily ? (
                <div className="settings-family-board contained">
                  <h4 className="settings-mini-title">Family board</h4>
                  <p className="page-section-lead">
                    Family ID: <code>{currentFamily.id}</code>
                    {isOwner ? (
                      <>
                        {" "}
                        · Join key: <code>{currentFamily.joinKey}</code>
                      </>
                    ) : null}
                  </p>
                  <ul className="settings-member-list">
                    {currentFamily.members.map((m) => (
                      <li key={m.email}>
                        <span>{m.email}</span>
                        {isOwner && m.familyRole !== "owner" && normEmail(m.email) !== normEmail(user.email) ? (
                          <select
                            className="settings-role-select"
                            value={m.familyRole}
                            onChange={(e) => {
                              const r = ownerSetFamilyMemberRole(m.email, e.target.value);
                              if (!r.ok) setFamilyMsg(r.error || "");
                            }}
                          >
                            <option value="contributor">contributor</option>
                            <option value="dependent">dependent</option>
                          </select>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  <div className="settings-family-actions" style={{ marginTop: "1rem" }}>
                    <h4 className="settings-mini-title">Leave or remove family</h4>
                    <p className="page-section-lead" style={{ marginTop: "0.35rem" }}>
                      You can <strong>remove the whole family</strong> only when you are the sole member. If others are
                      listed, <strong>transfer ownership</strong> first—then you can leave as a regular member.
                    </p>
                    {isOwner && currentFamily.members.length === 1 ? (
                      <div className="button-row" style={{ marginTop: "0.5rem" }}>
                        <button className="secondary-btn" type="button" onClick={onDissolveFamily}>
                          Remove family
                        </button>
                      </div>
                    ) : null}
                    {isOwner && currentFamily.members.length > 1 ? (
                      <div className="settings-form" style={{ marginTop: "0.5rem" }}>
                        <label className="form-field">
                          New owner
                          <select
                            value={transferPick}
                            onChange={(e) => setTransferPick(e.target.value)}
                            disabled={!transferCandidates.length}
                          >
                            {transferCandidates.map((m) => (
                              <option key={m.email} value={m.email}>
                                {m.email}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="button-row">
                          <button
                            className="primary-btn"
                            type="button"
                            onClick={onTransferOwnership}
                            disabled={!transferPick}
                          >
                            Transfer ownership
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {!isOwner ? (
                      <div className="button-row" style={{ marginTop: "0.5rem" }}>
                        <button className="secondary-btn" type="button" onClick={onLeaveFamily}>
                          Leave family
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {isMember && user.familyId ? (
                <>
                  <h3 className="settings-subhead">Benefit providers (family)</h3>
                  <p className="page-section-lead">
                    Everyone in this family sees the same providers—<strong>owners and contributors</strong> can add or edit
                    them. Usage starts at <strong>$0</strong>. Employer plans from work keys still merge in automatically.
                  </p>
                  {canEditFamilyManualProviders ? (
                    <div className="contained settings-nested" style={{ marginTop: "0.5rem" }}>
                      <div className="form-grid form-grid--inline" style={{ marginBottom: "1rem" }}>
                        <label className="form-field">
                          Provider name
                          <input
                            value={newManualProvider}
                            onChange={(e) => setNewManualProvider(e.target.value)}
                            placeholder="e.g. Regional Health Co-op"
                          />
                        </label>
                        <label className="form-field">
                          Plan name
                          <input
                            value={newManualPlan}
                            onChange={(e) => setNewManualPlan(e.target.value)}
                            placeholder="e.g. Bronze"
                          />
                        </label>
                        <div className="button-row" style={{ alignSelf: "end" }}>
                          <button
                            className="primary-btn"
                            type="button"
                            onClick={() => {
                              const list = currentFamily?.manualProviders || [];
                              const row = createDefaultManualProvider(newManualProvider, newManualPlan);
                              const r = updateFamilyManualProviders([...list, row]);
                              if (!r.ok) setFamilyMsg(r.error || "");
                              else {
                                setNewManualProvider("");
                                setNewManualPlan("");
                              }
                            }}
                          >
                            Add provider
                          </button>
                        </div>
                      </div>
                      {(currentFamily?.manualProviders || []).map((p) => (
                        <div key={p.id} className="settings-family-board" style={{ marginBottom: "1rem" }}>
                          <div className="employer-role-head" style={{ alignItems: "center" }}>
                            <strong>
                              {p.provider} — {p.plan}
                            </strong>
                            <button
                              className="secondary-btn"
                              type="button"
                              onClick={() => {
                                const list = currentFamily?.manualProviders || [];
                                const r = updateFamilyManualProviders(list.filter((x) => x.id !== p.id));
                                if (!r.ok) setFamilyMsg(r.error || "");
                              }}
                            >
                              Remove
                            </button>
                          </div>
                          <EditableManualCategories
                            categories={p.categories}
                            onApply={(next) => {
                              const list = currentFamily?.manualProviders || [];
                              const merged = list.map((pp) =>
                                pp.id !== p.id ? pp : { ...pp, categories: next }
                              );
                              const r = updateFamilyManualProviders(merged);
                              if (!r.ok) setFamilyMsg(r.error || "");
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="contained settings-nested">
                      {(currentFamily?.manualProviders || []).length ? (
                        <ul className="checklist-open">
                          {(currentFamily.manualProviders || []).map((p) => (
                            <li key={p.id}>
                              <strong>
                                {p.provider} — {p.plan}
                              </strong>
                              <ul>
                                {(p.categories || []).map((c, ci) => (
                                  <li key={`${p.id}-c-${ci}`}>
                                    {c.name}: {Math.round((c.coverage || 0) * 100)}% · $
                                    {(c.annualLimit || 0).toLocaleString()} limit
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="page-section-lead">
                          No extra providers yet—ask your family owner or a contributor to add them in Settings.
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : null}

              {isMember && !user.familyId && !workLocked ? (
                <>
                  <h3 className="settings-subhead">Benefit providers (personal)</h3>
                  <p className="page-section-lead">
                    Use this when you are <strong>not</strong> on an employer-linked work plan. Everything starts at $0
                    used.
                  </p>
                  <div className="contained settings-nested" style={{ marginTop: "0.5rem" }}>
                    <div className="form-grid form-grid--inline" style={{ marginBottom: "1rem" }}>
                      <label className="form-field">
                        Provider name
                        <input
                          value={newManualProvider}
                          onChange={(e) => setNewManualProvider(e.target.value)}
                          placeholder="e.g. Individual plan"
                        />
                      </label>
                      <label className="form-field">
                        Plan name
                        <input
                          value={newManualPlan}
                          onChange={(e) => setNewManualPlan(e.target.value)}
                          placeholder="e.g. Basic"
                        />
                      </label>
                      <div className="button-row" style={{ alignSelf: "end" }}>
                        <button
                          className="primary-btn"
                          type="button"
                          onClick={() => {
                            const list = user?.manualBenefitProviders || [];
                            const row = createDefaultManualProvider(newManualProvider, newManualPlan);
                            updatePersonalManualProviders([...list, row]);
                            setNewManualProvider("");
                            setNewManualPlan("");
                          }}
                        >
                          Add provider
                        </button>
                      </div>
                    </div>
                    {(user?.manualBenefitProviders || []).map((p) => (
                      <div key={p.id} className="settings-family-board" style={{ marginBottom: "1rem" }}>
                        <div className="employer-role-head" style={{ alignItems: "center" }}>
                          <strong>
                            {p.provider} — {p.plan}
                          </strong>
                          <button
                            className="secondary-btn"
                            type="button"
                            onClick={() => {
                              const list = user?.manualBenefitProviders || [];
                              updatePersonalManualProviders(list.filter((x) => x.id !== p.id));
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        <EditableManualCategories
                          categories={p.categories}
                          onApply={(next) => {
                            const list = user?.manualBenefitProviders || [];
                            updatePersonalManualProviders(
                              list.map((pp) => (pp.id !== p.id ? pp : { ...pp, categories: next }))
                            );
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {!isDependent ? (
                <>
                  <h3 className="settings-subhead">Work positions</h3>
                  <p className="page-section-lead">
                    Employer invite keys you apply show up here. You can hold multiple positions; totals combine each
                    distinct work plan once. Removing a position unlinks that employer from your benefits.
                  </p>
                  {(user?.workAssignments || []).length ? (
                    <ul className="settings-key-items" style={{ marginTop: "0.5rem" }}>
                      {(user.workAssignments || []).map((wa) => {
                        const { orgName, roleName } = describeWorkPosition(wa, resolvedEnterprises);
                        return (
                          <li key={wa.id} className="settings-work-position-row">
                            <div>
                              <strong>{orgName}</strong>
                              <span className="settings-key-meta" style={{ display: "block", marginTop: "0.2rem" }}>
                                {roleName}
                                {wa.locked ? " · Key-linked" : ""}
                              </span>
                            </div>
                            <button
                              className="secondary-btn"
                              type="button"
                              onClick={() => {
                                if (!window.confirm(`Remove work position at ${orgName} (${roleName})?`)) return;
                                const r = removeWorkPosition(wa.id);
                                if (!r.ok) setEmployerKeyMsg(r.error || "Could not remove");
                                else setEmployerKeyMsg("Work position removed.");
                              }}
                            >
                              Remove
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="page-section-lead">You have no linked work positions yet.</p>
                  )}
                </>
              ) : null}

              <h3 className="settings-subhead">Employer key</h3>
              <p className="page-section-lead">
                Apply an <strong>EMP-…</strong> key to add a work position (you can link more than one).{" "}
                {isOwner ? (
                  <>
                    As <strong>family owner</strong>, your work positions are shared into the family record so dependents
                    see the same plans—each assignment is counted once in your totals.
                  </>
                ) : isDependent ? (
                  <>
                    As a <strong>dependent</strong>, you only use the family schedule the owner provides (from their key).
                  </>
                ) : (
                  <>
                    As a <strong>contributor</strong>, apply your own employer key—your work plan is included in the family
                    benefit pool.
                  </>
                )}
              </p>
              <form className="settings-form" onSubmit={onApplyEmployerKey}>
                <label className="form-field">
                  Employer key
                  <input
                    value={employerKeyInput}
                    onChange={(e) => setEmployerKeyInput(e.target.value)}
                    placeholder="EMP-XXXXX"
                    disabled={isDependent}
                  />
                </label>
                <div className="button-row">
                  <button className="primary-btn" type="submit" disabled={isDependent}>
                    Apply employer key
                  </button>
                </div>
              </form>
              {employerKeyMsg ? <p className="auth-hint">{employerKeyMsg}</p> : null}
              {workLocked ? (
                <p className="page-section-lead">At least one position is key-linked; remove it above if you need to disconnect.</p>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      {tab === "integrations" ? (
        <section className="contained settings-section">
          <h2 className="page-section-title">Integrations</h2>
          <p className="page-section-lead">
            Connect external services. When connected, appointments booked through NexaCare are added automatically.
          </p>

          <div className="contained settings-nested" style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <strong style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Calendar size={18} strokeWidth={1.75} />
                  Google Calendar
                </strong>
                <p className="page-section-lead" style={{ marginTop: "0.25rem", marginBottom: 0 }}>
                  {calendarConnected === null
                    ? "Checking status…"
                    : calendarConnected
                    ? "Connected — new appointments are added to your calendar automatically."
                    : "Not connected — connect to auto-add bookings to your Google Calendar."}
                </p>
              </div>
              <div className="button-row">
                {calendarConnected ? (
                  <button className="secondary-btn" type="button" onClick={disconnectCalendar}>
                    Disconnect
                  </button>
                ) : (
                  <button className="primary-btn" type="button" onClick={connectCalendar}>
                    Connect Google Calendar
                  </button>
                )}
              </div>
            </div>
            {calendarMsg ? <p className="auth-hint" style={{ marginTop: "0.75rem" }}>{calendarMsg}</p> : null}
          </div>
        </section>
      ) : null}

      {tab === "connections" && showConnectionsTab ? (
        <section className="contained settings-section">
          <h2 className="page-section-title">Connections</h2>
          <p className="page-section-lead">Keys you have generated. Share these securely with intended recipients only.</p>

          {isEmployer ? (
            <div className="settings-key-list">
              <h3 className="settings-subhead">Employer invite keys</h3>
              {employerKeysForOrg.length ? (
                <ul className="settings-key-items">
                  {employerKeysForOrg.map((k) => (
                    <li key={k.key}>
                      <code>{k.key}</code>
                      <span className="settings-key-meta">{roleLabelForKey(k.roleTemplateId, myEnterprise)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="page-section-lead">No keys yet.</p>
              )}
            </div>
          ) : null}

          {isMember && isOwner && currentFamily ? (
            <div className="settings-key-list">
              <h3 className="settings-subhead">Family join key</h3>
              <p className="page-section-lead">
                <code className="settings-key-code">{currentFamily.joinKey}</code>
              </p>
            </div>
          ) : null}

          {!isEmployer && !(isMember && isOwner && currentFamily) ? (
            <p className="page-section-lead">
              Keys you create (employer invites or family creation) will be listed here.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
