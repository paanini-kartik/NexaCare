/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";
import { CORE_CHECKUP_KEYS, DEFAULT_CHECKUP_SCHEDULE } from "../data/checkupConfig";

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

function normalizeCheckupSchedule(raw) {
  const next = { ...DEFAULT_CHECKUP_SCHEDULE };
  if (raw && typeof raw === "object") {
    for (const key of CORE_CHECKUP_KEYS) {
      const row = raw[key];
      if (row && typeof row === "object") {
        next[key] = {
          intervalDays: Math.max(1, Number(row.intervalDays) || DEFAULT_CHECKUP_SCHEDULE[key].intervalDays),
          daysSinceLastVisit: Math.max(0, Number(row.daysSinceLastVisit) || 0),
        };
      }
    }
  }
  return next;
}

function normalizeExtraCareServices(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && String(x.name || "").trim())
    .map((x, i) => ({
      id: typeof x.id === "string" && x.id ? x.id : `extra-${i}-${String(x.name).trim().slice(0, 24)}`,
      name: String(x.name).trim(),
      intervalDays: Math.max(1, Number(x.intervalDays) || 90),
      daysSinceLastVisit: Math.max(0, Number(x.daysSinceLastVisit) || 0),
    }));
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
