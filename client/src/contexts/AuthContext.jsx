/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStorage(USER_KEY, null));
  const [healthProfile, setHealthProfile] = useState(() =>
    readStorage(PROFILE_KEY, {
      age: "",
      occupation: "",
      medicalHistory: "",
      preferredClinics: "",
      allergies: "",
      calendarProvider: "Google",
    })
  );
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
      const next = { ...prev, ...updates };
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
