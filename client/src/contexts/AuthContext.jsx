/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CORE_CHECKUP_KEYS } from "../data/checkupConfig";
import { SEED_ENTERPRISES, createEnterpriseFromSignup } from "../data/enterpriseDefaults";
import { insurers as defaultInsurers } from "../data/mockData";
import { makeEmployerInviteKey, makeFamilyJoinKey } from "../lib/connectionKeys";
import { getEffectiveInsurers, resolveBenefitSources, summarizeInsurersForDashboard } from "../lib/enterpriseBenefits";

const USER_KEY = "nexacare:user";
const SESSION_META_KEY = "nexacare:session-meta";
const USER_REGISTRY_KEY = "nexacare:user-registry";
const PROFILE_KEY = "nexacare:profile";
const ONBOARDING_KEY = "nexacare:onboarding-complete";
const ENTERPRISES_KEY = "nexacare:enterprises";
const HOUSEHOLD_KEY = "nexacare:household";

function normEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function readRegistry() {
  const raw = readStorage(USER_REGISTRY_KEY, null);
  return raw && typeof raw === "object" ? raw : {};
}

function writeRegistry(registry) {
  localStorage.setItem(USER_REGISTRY_KEY, JSON.stringify(registry));
}

function saveUserToRegistry(user) {
  if (!user?.email) return;
  const key = normEmail(user.email);
  const registry = readRegistry();
  registry[key] = { ...user };
  writeRegistry(registry);
}

const AuthContext = createContext(null);

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function loadEnterprises() {
  const raw = readStorage(ENTERPRISES_KEY, null);
  if (Array.isArray(raw) && raw.length) return raw;
  localStorage.setItem(ENTERPRISES_KEY, JSON.stringify(SEED_ENTERPRISES));
  return [...SEED_ENTERPRISES];
}

function loadHousehold() {
  const raw = readStorage(HOUSEHOLD_KEY, null);
  if (raw && typeof raw === "object") {
    return {
      enterpriseId: raw.enterpriseId ?? null,
      sharedBenefitRoleId: raw.sharedBenefitRoleId ?? null,
      familyLinkCode: raw.familyLinkCode ?? "",
    };
  }
  return { enterpriseId: null, sharedBenefitRoleId: null, familyLinkCode: "" };
}

function loadSessionMeta() {
  const raw = readStorage(SESSION_META_KEY, null);
  return {
    families: raw?.families && typeof raw.families === "object" ? raw.families : {},
    employerKeys: Array.isArray(raw?.employerKeys) ? raw.employerKeys : [],
  };
}

function migrateLegacyUser(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.accountType) {
    const at =
      raw.accountType === "employer"
        ? "employer"
        : raw.accountType === "family" || raw.accountType === "employee" || raw.accountType === "member"
          ? "member"
          : "member";
    return {
      ...raw,
      accountType: at,
      familyRole: raw.familyRole || "owner",
      companyLinkCode: raw.companyLinkCode ?? null,
      familyId: raw.familyId ?? null,
      connectionKeysCount: typeof raw.connectionKeysCount === "number" ? raw.connectionKeysCount : 0,
      employerAssignmentLocked: Boolean(raw.employerAssignmentLocked),
    };
  }
  const legacy = raw.role === "employer" ? "employer" : "member";
  return {
    ...raw,
    accountType: legacy,
    familyRole: raw.familyRole || "owner",
    enterpriseId: raw.enterpriseId ?? null,
    employeeRoleTemplateId: raw.employeeRoleTemplateId ?? null,
    companyLinkCode: raw.companyLinkCode ?? null,
    familyId: raw.familyId ?? null,
    connectionKeysCount: typeof raw.connectionKeysCount === "number" ? raw.connectionKeysCount : 0,
    employerAssignmentLocked: Boolean(raw.employerAssignmentLocked),
  };
}

function migrateCoreRow(row) {
  if (!row || typeof row !== "object") return { lastVisitISO: null };
  if (row.lastVisitISO && typeof row.lastVisitISO === "string") {
    return { lastVisitISO: row.lastVisitISO.slice(0, 10) };
  }
  if (typeof row.daysSinceLastVisit === "number" && !Number.isNaN(row.daysSinceLastVisit)) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - row.daysSinceLastVisit);
    return { lastVisitISO: d.toISOString().slice(0, 10) };
  }
  return { lastVisitISO: null };
}

function normalizeCheckupSchedule(raw) {
  const next = {};
  for (const key of CORE_CHECKUP_KEYS) {
    const row = raw && typeof raw === "object" ? raw[key] : null;
    next[key] = migrateCoreRow(row);
  }
  return next;
}

function normalizeExtraCareServices(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && String(x.name || "").trim())
    .map((x, i) => {
      const name = String(x.name).trim();
      let lastVisitISO = null;
      if (x.lastVisitISO && typeof x.lastVisitISO === "string") {
        lastVisitISO = x.lastVisitISO.slice(0, 10);
      } else if (typeof x.daysSinceLastVisit === "number" && !Number.isNaN(x.daysSinceLastVisit)) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - x.daysSinceLastVisit);
        lastVisitISO = d.toISOString().slice(0, 10);
      }
      const kind = x.kind === "preset" || x.kind === "other" ? x.kind : "other";
      return {
        id: typeof x.id === "string" && x.id ? x.id : `extra-${i}-${name.slice(0, 24)}`,
        name,
        kind,
        lastVisitISO,
      };
    });
}

function normalizeProfile(rawProfile) {
  const medicalHistory = Array.isArray(rawProfile?.medicalHistory) ? rawProfile.medicalHistory : [];
  const allergies = Array.isArray(rawProfile?.allergies) ? rawProfile.allergies : [];
  const favoriteClinics = Array.isArray(rawProfile?.favoriteClinics) ? rawProfile.favoriteClinics : [];

  return {
    age: rawProfile?.age || "",
    occupation: rawProfile?.occupation || "",
    calendarProvider: rawProfile?.calendarProvider || "Google",
    medicalHistory,
    allergies,
    favoriteClinics,
    checkupSchedule: normalizeCheckupSchedule(rawProfile?.checkupSchedule),
    extraCareServices: normalizeExtraCareServices(rawProfile?.extraCareServices),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => migrateLegacyUser(readStorage(USER_KEY, null)));
  const [enterprises, setEnterprises] = useState(() => loadEnterprises());
  const [household, setHouseholdState] = useState(() => loadHousehold());
  const [sessionMeta, setSessionMeta] = useState(() => loadSessionMeta());
  const [healthProfile, setHealthProfile] = useState(() => normalizeProfile(readStorage(PROFILE_KEY, {})));
  const [showOnboardingOverlay, setShowOnboardingOverlay] = useState(false);

  const persistSessionMeta = useCallback((next) => {
    setSessionMeta(next);
    localStorage.setItem(SESSION_META_KEY, JSON.stringify(next));
  }, []);

  const persistEnterprises = useCallback((next) => {
    setEnterprises(next);
    localStorage.setItem(ENTERPRISES_KEY, JSON.stringify(next));
  }, []);

  const persistHousehold = useCallback((next) => {
    setHouseholdState(next);
    localStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(next));
  }, []);

  /** Family owners: household benefit schedule mirrors employer-key work assignment (no manual UI). */
  useEffect(() => {
    if (!user) return;
    if (user.accountType !== "member" || user.familyRole !== "owner") return;

    const hasWork = Boolean(user.enterpriseId && user.employeeRoleTemplateId);
    const nextEnterprise = hasWork ? user.enterpriseId : null;
    const nextRole = hasWork ? user.employeeRoleTemplateId : null;

    if (household.enterpriseId === nextEnterprise && household.sharedBenefitRoleId === nextRole) return;

    persistHousehold({
      ...household,
      enterpriseId: nextEnterprise,
      sharedBenefitRoleId: nextRole,
    });
  }, [
    user,
    user?.accountType,
    user?.familyRole,
    user?.enterpriseId,
    user?.employeeRoleTemplateId,
    household,
    persistHousehold,
  ]);

  const myEnterprise = useMemo(() => {
    if (!user?.enterpriseId) return null;
    return enterprises.find((e) => e.id === user.enterpriseId) || null;
  }, [user, enterprises]);

  const currentFamily = useMemo(() => {
    if (!user?.familyId || !sessionMeta.families[user.familyId]) return null;
    return sessionMeta.families[user.familyId];
  }, [user?.familyId, sessionMeta.families]);

  const benefitSources = useMemo(
    () => resolveBenefitSources(user, household, myEnterprise),
    [user, household, myEnterprise]
  );

  const effectiveInsurers = useMemo(
    () => getEffectiveInsurers(defaultInsurers, benefitSources, enterprises),
    [benefitSources, enterprises]
  );

  const benefitDashboardSummary = useMemo(() => summarizeInsurersForDashboard(effectiveInsurers), [effectiveInsurers]);

  const benefitContextDescription = useMemo(() => {
    if (!benefitSources.length) return "Combined mock carriers (default)";
    const parts = benefitSources
      .map((res) => {
        const ent = enterprises.find((e) => e.id === res.enterpriseId);
        const role = ent?.employeeRoles.find((r) => r.id === res.roleId);
        if (!ent || !role) return null;
        if (res.kind === "household") return `${ent.name} — ${role.name} (household · from keys)`;
        if (res.kind === "work") return `${ent.name} — ${role.name} (work)`;
        if (res.kind === "employer_preview") return `${ent.name} — ${role.name} (preview)`;
        return `${ent.name} — ${role.name}`;
      })
      .filter(Boolean);
    return parts.length ? parts.join(" · ") : "Combined mock carriers (default)";
  }, [benefitSources, enterprises]);

  const login = (identity, options = { isSignup: false }) => {
    const emailKey = normEmail(identity.email);
    const registry = readRegistry();
    const existing = registry[emailKey] ? migrateLegacyUser(registry[emailKey]) : null;

    if (options.isSignup) {
      const isEmployer = Boolean(identity.isEmployer);

      if (isEmployer) {
        const org = createEnterpriseFromSignup({
          name: identity.companyName || "Organization",
          ownerEmail: identity.email,
        });
        persistEnterprises([...enterprises, org]);
        const enterpriseId = org.id;
        const employeeRoleTemplateId = org.employeeRoles[0]?.id ?? null;

        const safeUser = migrateLegacyUser({
          fullName: identity.fullName || "User",
          email: identity.email,
          accountType: "employer",
          familyRole: "owner",
          enterpriseId,
          employeeRoleTemplateId,
          companyLinkCode: null,
          familyId: null,
          connectionKeysCount: 0,
          employerAssignmentLocked: false,
        });

        setUser(safeUser);
        localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
        saveUserToRegistry(safeUser);
      } else {
        const safeUser = migrateLegacyUser({
          fullName: identity.fullName || "User",
          email: identity.email,
          accountType: "member",
          familyRole: "owner",
          enterpriseId: null,
          employeeRoleTemplateId: null,
          companyLinkCode: null,
          familyId: null,
          connectionKeysCount: 0,
          employerAssignmentLocked: false,
        });

        setUser(safeUser);
        localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
        saveUserToRegistry(safeUser);
      }
    } else {
      let safeUser;
      if (existing) {
        safeUser = migrateLegacyUser({
          ...existing,
          fullName: existing.fullName || "User",
          email: identity.email,
        });
      } else {
        const fromEmail = String(identity.email || "").split("@")[0]?.trim() || "";
        safeUser = migrateLegacyUser({
          fullName: fromEmail || "User",
          email: identity.email,
          accountType: "member",
          familyRole: "owner",
          enterpriseId: null,
          employeeRoleTemplateId: null,
          companyLinkCode: null,
          familyId: null,
          connectionKeysCount: 0,
          employerAssignmentLocked: false,
        });
      }

      setUser(safeUser);
      localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
      saveUserToRegistry(safeUser);
    }

    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY) === "true";
    if (options.isSignup && !hasCompletedOnboarding) {
      setShowOnboardingOverlay(true);
    }
  };

  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = migrateLegacyUser({ ...prev, ...partial });
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      saveUserToRegistry(next);
      return next;
    });
  }, []);

  const createFamilyGroup = useCallback(() => {
    if (!user || user.accountType !== "member" || user.familyId) return { ok: false, error: "Already in a family" };
    const id = `fam-${Date.now().toString(36)}`;
    const joinKey = makeFamilyJoinKey();
    const nextMeta = {
      ...sessionMeta,
      families: {
        ...sessionMeta.families,
        [id]: {
          id,
          joinKey,
          ownerEmail: normEmail(user.email),
          members: [{ email: user.email, familyRole: "owner" }],
        },
      },
    };
    persistSessionMeta(nextMeta);
    updateUser({
      familyId: id,
      familyRole: "owner",
      connectionKeysCount: (user.connectionKeysCount || 0) + 1,
    });
    return { ok: true, joinKey };
  }, [user, sessionMeta, persistSessionMeta, updateUser]);

  const joinFamilyWithKey = useCallback(
    (joinKeyInput, joinRole) => {
      if (!user || user.accountType !== "member") return { ok: false, error: "Not available" };
      if (user.familyId) return { ok: false, error: "Already in a family" };
      if (!["contributor", "dependent"].includes(joinRole)) return { ok: false, error: "Choose contributor or dependent" };
      const k = String(joinKeyInput || "").trim().toUpperCase();
      const fam = Object.values(sessionMeta.families).find((f) => f.joinKey.toUpperCase() === k);
      if (!fam) return { ok: false, error: "Invalid family key" };
      if (fam.members.some((m) => normEmail(m.email) === normEmail(user.email))) {
        return { ok: false, error: "Already in this family" };
      }
      const nextMembers = [...fam.members, { email: user.email, familyRole: joinRole }];
      const nextMeta = {
        ...sessionMeta,
        families: {
          ...sessionMeta.families,
          [fam.id]: { ...fam, members: nextMembers },
        },
      };
      persistSessionMeta(nextMeta);
      updateUser({ familyId: fam.id, familyRole: joinRole });
      return { ok: true };
    },
    [user, sessionMeta, persistSessionMeta, updateUser]
  );

  const ownerSetFamilyMemberRole = useCallback(
    (targetEmail, newRole) => {
      if (!user?.familyId || user.familyRole !== "owner") return { ok: false, error: "Only the owner can assign roles" };
      if (!["contributor", "dependent"].includes(newRole)) return { ok: false, error: "Invalid role" };
      if (normEmail(targetEmail) === normEmail(user.email)) return { ok: false, error: "Cannot change your own role here" };
      const fam = sessionMeta.families[user.familyId];
      if (!fam) return { ok: false, error: "Family not found" };
      const idx = fam.members.findIndex((m) => normEmail(m.email) === normEmail(targetEmail));
      if (idx < 0) return { ok: false, error: "Member not in family" };
      const nextMembers = fam.members.map((m, i) => (i === idx ? { ...m, familyRole: newRole } : m));
      const nextMeta = {
        ...sessionMeta,
        families: {
          ...sessionMeta.families,
          [fam.id]: { ...fam, members: nextMembers },
        },
      };
      persistSessionMeta(nextMeta);
      const reg = readRegistry();
      const te = normEmail(targetEmail);
      if (reg[te]) {
        reg[te] = migrateLegacyUser({ ...reg[te], familyRole: newRole });
        writeRegistry(reg);
      }
      return { ok: true };
    },
    [user, sessionMeta, persistSessionMeta]
  );

  /** Solo owner only — deletes the family record. */
  const dissolveFamily = useCallback(() => {
    if (!user?.familyId || user.familyRole !== "owner") return { ok: false, error: "Only the owner can remove the family" };
    const fam = sessionMeta.families[user.familyId];
    if (!fam) return { ok: false, error: "Family not found" };
    if (fam.members.length !== 1) {
      return { ok: false, error: "Remove other members first, or transfer ownership—then you can leave or dissolve if alone" };
    }
    if (normEmail(fam.members[0].email) !== normEmail(user.email)) return { ok: false, error: "Invalid state" };
    const nextFamilies = { ...sessionMeta.families };
    delete nextFamilies[fam.id];
    persistSessionMeta({ ...sessionMeta, families: nextFamilies });
    updateUser({ familyId: null, familyRole: "owner" });
    const reg = readRegistry();
    const me = normEmail(user.email);
    if (reg[me]) {
      reg[me] = migrateLegacyUser({ ...reg[me], familyId: null, familyRole: "owner" });
      writeRegistry(reg);
    }
    return { ok: true };
  }, [user, sessionMeta, persistSessionMeta, updateUser]);

  /** Owner gives owner role to another member; previous owner becomes contributor. */
  const transferFamilyOwnership = useCallback(
    (newOwnerEmail) => {
      if (!user?.familyId || user.familyRole !== "owner") return { ok: false, error: "Only the owner can transfer" };
      const fam = sessionMeta.families[user.familyId];
      if (!fam || fam.members.length < 2) return { ok: false, error: "No other member to transfer to" };
      const ne = normEmail(newOwnerEmail);
      const target = fam.members.find((m) => normEmail(m.email) === ne);
      if (!target || target.familyRole === "owner") return { ok: false, error: "Pick a contributor or dependent" };
      if (ne === normEmail(user.email)) return { ok: false, error: "Choose someone else" };
      const me = normEmail(user.email);
      const nextMembers = fam.members.map((m) => {
        if (normEmail(m.email) === me) return { ...m, familyRole: "contributor" };
        if (normEmail(m.email) === ne) return { ...m, familyRole: "owner" };
        return m;
      });
      const nextMeta = {
        ...sessionMeta,
        families: {
          ...sessionMeta.families,
          [fam.id]: { ...fam, members: nextMembers, ownerEmail: ne },
        },
      };
      persistSessionMeta(nextMeta);
      updateUser({ familyRole: "contributor" });
      const reg = readRegistry();
      if (reg[me]) {
        reg[me] = migrateLegacyUser({ ...reg[me], familyRole: "contributor" });
      }
      if (reg[ne]) {
        reg[ne] = migrateLegacyUser({ ...reg[ne], familyRole: "owner" });
      }
      writeRegistry(reg);
      return { ok: true };
    },
    [user, sessionMeta, persistSessionMeta, updateUser]
  );

  /** Non-owners leave; owners must transfer first or use dissolve when alone. */
  const leaveFamily = useCallback(() => {
    if (!user?.familyId) return { ok: false, error: "Not in a family" };
    if (user.familyRole === "owner") {
      const fam = sessionMeta.families[user.familyId];
      if (fam?.members.length === 1) {
        return { ok: false, error: "Use Remove family when you are the only member" };
      }
      return { ok: false, error: "Transfer ownership first, then you can leave as a member" };
    }
    const fam = sessionMeta.families[user.familyId];
    if (!fam) return { ok: false, error: "Family not found" };
    const nextMembers = fam.members.filter((m) => normEmail(m.email) !== normEmail(user.email));
    const nextMeta = {
      ...sessionMeta,
      families: {
        ...sessionMeta.families,
        [fam.id]: { ...fam, members: nextMembers },
      },
    };
    persistSessionMeta(nextMeta);
    updateUser({ familyId: null, familyRole: "owner" });
    const reg = readRegistry();
    const me = normEmail(user.email);
    if (reg[me]) {
      reg[me] = migrateLegacyUser({ ...reg[me], familyId: null, familyRole: "owner" });
      writeRegistry(reg);
    }
    return { ok: true };
  }, [user, sessionMeta, persistSessionMeta, updateUser]);

  const generateEmployerInviteKey = useCallback(
    (roleTemplateId) => {
      if (!user || user.accountType !== "employer" || !user.enterpriseId || !roleTemplateId) return null;
      const key = makeEmployerInviteKey();
      const entry = {
        key,
        orgId: user.enterpriseId,
        roleTemplateId,
        createdByEmail: normEmail(user.email),
      };
      const nextMeta = {
        ...sessionMeta,
        employerKeys: [...sessionMeta.employerKeys, entry],
      };
      persistSessionMeta(nextMeta);
      updateUser({ connectionKeysCount: (user.connectionKeysCount || 0) + 1 });
      return key;
    },
    [user, sessionMeta, persistSessionMeta, updateUser]
  );

  const applyEmployerInviteKey = useCallback(
    (keyInput) => {
      if (!user || user.accountType !== "member") return { ok: false, error: "Not available" };
      if (user.employerAssignmentLocked) return { ok: false, error: "Your employer assignment is locked" };
      const k = String(keyInput || "").trim().toUpperCase();
      const found = sessionMeta.employerKeys.find((e) => e.key.toUpperCase() === k);
      if (!found) return { ok: false, error: "Invalid employer key" };
      updateUser({
        enterpriseId: found.orgId,
        employeeRoleTemplateId: found.roleTemplateId,
        employerAssignmentLocked: true,
      });
      return { ok: true };
    },
    [user, sessionMeta, updateUser]
  );

  const updateEnterprise = useCallback(
    (enterpriseId, updater) => {
      persistEnterprises(
        enterprises.map((e) => {
          if (e.id !== enterpriseId) return e;
          return typeof updater === "function" ? updater(e) : { ...e, ...updater };
        })
      );
    },
    [enterprises, persistEnterprises]
  );

  const addEmployeeRole = useCallback(
    (enterpriseId, name) => {
      updateEnterprise(enterpriseId, (e) => {
        const base = e.employeeRoles[0]?.categories?.length
          ? e.employeeRoles[0].categories.map((c) => ({ ...c }))
          : [];
        const newRole = {
          id: `${enterpriseId}-role-${Date.now().toString(36)}`,
          name: name.trim() || "New role",
          categories: base,
        };
        return { ...e, employeeRoles: [...e.employeeRoles, newRole] };
      });
    },
    [updateEnterprise]
  );

  const updateEmployeeRoleCategories = useCallback(
    (enterpriseId, roleId, categories) => {
      updateEnterprise(enterpriseId, (e) => ({
        ...e,
        employeeRoles: e.employeeRoles.map((r) => (r.id === roleId ? { ...r, categories } : r)),
      }));
    },
    [updateEnterprise]
  );

  const renameEmployeeRole = useCallback(
    (enterpriseId, roleId, name) => {
      updateEnterprise(enterpriseId, (e) => ({
        ...e,
        employeeRoles: e.employeeRoles.map((r) => (r.id === roleId ? { ...r, name: name.trim() || r.name } : r)),
      }));
    },
    [updateEnterprise]
  );

  const setEmployerPreviewRole = useCallback(
    (enterpriseId, roleId) => {
      updateEnterprise(enterpriseId, { employerPreviewRoleId: roleId });
    },
    [updateEnterprise]
  );

  const updateHousehold = useCallback(
    (partial) => {
      persistHousehold({ ...household, ...partial });
    },
    [household, persistHousehold]
  );

  const completeOnboardingOverlay = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboardingOverlay(false);
  };

  const dismissOnboardingOverlay = () => {
    setShowOnboardingOverlay(false);
  };

  const logout = () => {
    setUser(null);
    setShowOnboardingOverlay(false);
    localStorage.removeItem(USER_KEY);
  };

  const updateProfile = (updates) => {
    setHealthProfile((prev) => {
      const next = normalizeProfile({ ...prev, ...updates });
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo(
    () => ({
      user,
      healthProfile,
      isAuthenticated: Boolean(user),
      showOnboardingOverlay,
      enterprises,
      household,
      sessionMeta,
      myEnterprise,
      currentFamily,
      effectiveInsurers,
      benefitDashboardSummary,
      benefitContextDescription,
      login,
      logout,
      updateProfile,
      completeOnboardingOverlay,
      dismissOnboardingOverlay,
      updateEnterprise,
      addEmployeeRole,
      updateEmployeeRoleCategories,
      renameEmployeeRole,
      setEmployerPreviewRole,
      updateHousehold,
      updateUser,
      createFamilyGroup,
      joinFamilyWithKey,
      ownerSetFamilyMemberRole,
      generateEmployerInviteKey,
      applyEmployerInviteKey,
      dissolveFamily,
      transferFamilyOwnership,
      leaveFamily,
    }),
    [
      user,
      healthProfile,
      showOnboardingOverlay,
      enterprises,
      household,
      sessionMeta,
      myEnterprise,
      currentFamily,
      effectiveInsurers,
      benefitDashboardSummary,
      benefitContextDescription,
      login,
      updateEnterprise,
      addEmployeeRole,
      updateEmployeeRoleCategories,
      renameEmployeeRole,
      setEmployerPreviewRole,
      updateHousehold,
      updateUser,
      createFamilyGroup,
      joinFamilyWithKey,
      ownerSetFamilyMemberRole,
      generateEmployerInviteKey,
      applyEmployerInviteKey,
      dissolveFamily,
      transferFamilyOwnership,
      leaveFamily,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
