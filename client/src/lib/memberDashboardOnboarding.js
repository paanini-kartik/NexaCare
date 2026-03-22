/** Session hint so Benefits visit hides dashboard onboarding before Firestore round-trip. */
export const MEMBER_DASHBOARD_ONBOARDING_SESSION_KEY = "nexacare:member-dashboard-onboarding-dismissed";

export function markMemberDashboardOnboardingDismissedSession() {
  try {
    sessionStorage.setItem(MEMBER_DASHBOARD_ONBOARDING_SESSION_KEY, "1");
  } catch {
    /* private mode, etc. */
  }
}

export function isMemberDashboardOnboardingDismissedSession() {
  try {
    return sessionStorage.getItem(MEMBER_DASHBOARD_ONBOARDING_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearMemberDashboardOnboardingSession() {
  try {
    sessionStorage.removeItem(MEMBER_DASHBOARD_ONBOARDING_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
