import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

function normEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
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
    generateEmployerInviteKey,
    applyEmployerInviteKey,
    dissolveFamily,
    transferFamilyOwnership,
    leaveFamily,
  } = useAuth();

  const showConnectionsTab = (user?.connectionKeysCount || 0) > 0;

  const baseTabs = useMemo(() => {
    const t = [
      { id: "profile", label: "Profile" },
      { id: "access", label: "Access & roles" },
    ];
    if (showConnectionsTab) t.push({ id: "connections", label: "Connections" });
    return t;
  }, [showConnectionsTab]);

  const [tab, setTab] = useState("profile");

  useEffect(() => {
    if (tab === "connections" && !showConnectionsTab) setTab("profile");
  }, [tab, showConnectionsTab]);

  const [displayName, setDisplayName] = useState(user?.fullName || "");

  const [familyJoinInput, setFamilyJoinInput] = useState("");
  const [familyJoinRole, setFamilyJoinRole] = useState("contributor");
  const [familyMsg, setFamilyMsg] = useState("");
  const [transferPick, setTransferPick] = useState("");

  const [employerKeyInput, setEmployerKeyInput] = useState("");
  const [employerKeyMsg, setEmployerKeyMsg] = useState("");
  const [newEmployerRoleId, setNewEmployerRoleId] = useState("");

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.fullName || "");
  }, [user]);

  useEffect(() => {
    if (myEnterprise?.employeeRoles?.length && !newEmployerRoleId) {
      setNewEmployerRoleId(myEnterprise.employeeRoles[0].id);
    }
  }, [myEnterprise, newEmployerRoleId]);

  const isEmployer = user?.accountType === "employer";
  const isMember = user?.accountType === "member";
  const isOwner = user?.familyRole === "owner";
  const isDependent = user?.familyRole === "dependent";
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

  const onJoinFamily = (e) => {
    e.preventDefault();
    setFamilyMsg("");
    const res = joinFamilyWithKey(familyJoinInput, familyJoinRole);
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

  const onApplyEmployerKey = (e) => {
    e.preventDefault();
    setEmployerKeyMsg("");
    const res = applyEmployerInviteKey(employerKeyInput);
    setEmployerKeyMsg(res.ok ? "Employer assignment applied — your work role is locked." : res.error || "Invalid key");
    if (res.ok) setEmployerKeyInput("");
  };

  const onGenerateEmployerKey = (e) => {
    e.preventDefault();
    if (!newEmployerRoleId) return;
    const key = generateEmployerInviteKey(newEmployerRoleId);
    setEmployerKeyMsg(key ? `New key: ${key} (Connections tab unlocked)` : "Could not generate");
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
          Profile first, then access and roles. Work and household benefit schedules are <strong>not edited here</strong>—they
          follow <strong>employer keys</strong> (and, for family owners, automatically mirror your assignment for the rest of
          the family). The <strong>Connections</strong> tab appears only after you generate a key.
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
                Generate an <strong>employer invite key</strong> tied to a benefit role. When someone enters it, their work
                role and benefits update and <strong>lock</strong> so they cannot override what you assigned.
              </p>
              <form className="settings-form" onSubmit={onGenerateEmployerKey}>
                <label className="form-field">
                  Role for this key
                  <select value={newEmployerRoleId} onChange={(e) => setNewEmployerRoleId(e.target.value)}>
                    {myEnterprise?.employeeRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="button-row">
                  <button className="primary-btn" type="submit">
                    Generate employer key
                  </button>
                </div>
              </form>
              {employerKeyMsg ? <p className="auth-hint">{employerKeyMsg}</p> : null}
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
                    Family ID: <code>{currentFamily.id}</code> · Your role: <strong>{user.familyRole}</strong>
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
                        <span className="settings-member-role">{m.familyRole}</span>
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
                                {m.email} ({m.familyRole})
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

              <h3 className="settings-subhead">Employer key</h3>
              <p className="page-section-lead">
                Apply an <strong>EMP-…</strong> key from your employer to set your work benefits (locked afterward).{" "}
                {isOwner ? (
                  <>
                    As <strong>family owner</strong>, that same assignment automatically drives the <strong>household</strong>{" "}
                    benefit schedule your dependents see—no separate form.
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
                    disabled={workLocked || isDependent}
                  />
                </label>
                <div className="button-row">
                  <button className="primary-btn" type="submit" disabled={workLocked || isDependent}>
                    Apply employer key
                  </button>
                </div>
              </form>
              {employerKeyMsg ? <p className="auth-hint">{employerKeyMsg}</p> : null}
              {workLocked ? (
                <p className="page-section-lead">Work assignment is locked by your employer key.</p>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      {tab === "connections" && showConnectionsTab ? (
        <section className="contained settings-section">
          <h2 className="page-section-title">Connections</h2>
          <p className="page-section-lead">Keys you have generated. Share these securely—this is a mock environment.</p>

          {isEmployer ? (
            <div className="settings-key-list">
              <h3 className="settings-subhead">Employer invite keys</h3>
              {employerKeysForOrg.length ? (
                <ul className="settings-key-items">
                  {employerKeysForOrg.map((k) => (
                    <li key={k.key}>
                      <code>{k.key}</code>
                      <span className="settings-key-meta">
                        Role ID: {k.roleTemplateId} · org: {k.orgId}
                      </span>
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
