/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CORE_CHECKUP_KEYS } from "../data/checkupConfig";
import { SEED_ENTERPRISES, createEnterpriseFromSignup } from "../data/enterpriseDefaults";
import { insurers as defaultInsurers } from "../data/mockData";
import { getEffectiveInsurers, resolveBenefitSources, summarizeInsurersForDashboard } from "../lib/enterpriseBenefits";

const USER_KEY = "nexacare:user";
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
  const [healthProfile, setHealthProfile] = useState(() => normalizeProfile(readStorage(PROFILE_KEY, {})));
  const [showOnboardingOverlay, setShowOnboardingOverlay] = useState(false);

  const persistEnterprises = useCallback((next) => {
    setEnterprises(next);
    localStorage.setItem(ENTERPRISES_KEY, JSON.stringify(next));
  }, []);

  const persistHousehold = useCallback((next) => {
    setHouseholdState(next);
    localStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(next));
  }, []);

  const myEnterprise = useMemo(() => {
    if (!user?.enterpriseId) return null;
    return enterprises.find((e) => e.id === user.enterpriseId) || null;
  }, [user, enterprises]);

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
        if (res.kind === "household") return `${ent.name} — ${role.name} (household)`;
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
      myEnterprise,
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
    }),
    [
      user,
      healthProfile,
      showOnboardingOverlay,
      enterprises,
      household,
      myEnterprise,
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
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
