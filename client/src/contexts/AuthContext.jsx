/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";
import { CORE_CHECKUP_KEYS } from "../data/checkupConfig";

const USER_KEY = "nexacare:user";
const PROFILE_KEY = "nexacare:profile";
const ONBOARDING_KEY = "nexacare:onboarding-complete";

const AuthContext = createContext(null);

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
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
  const [user, setUser] = useState(() => readStorage(USER_KEY, null));
  const [healthProfile, setHealthProfile] = useState(() => normalizeProfile(readStorage(PROFILE_KEY, {})));
  const [showOnboardingOverlay, setShowOnboardingOverlay] = useState(false);

  const login = (identity, options = { isSignup: false }) => {
    const safeUser = {
      fullName: identity.fullName || "User",
      email: identity.email,
      role: identity.role || "user",
    };

    setUser(safeUser);
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser));

    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY) === "true";
    if (options.isSignup && !hasCompletedOnboarding) {
      setShowOnboardingOverlay(true);
    }
  };

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
      login,
      logout,
      updateProfile,
      completeOnboardingOverlay,
      dismissOnboardingOverlay,
    }),
    [user, healthProfile, showOnboardingOverlay]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
