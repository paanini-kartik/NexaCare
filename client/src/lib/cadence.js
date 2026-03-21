/** Calendar days between ISO date (YYYY-MM-DD) and today (local midnight). */
export function calendarDaysSinceLastVisit(isoDate) {
  if (!isoDate || typeof isoDate !== "string") return null;
  const parts = isoDate.slice(0, 10).split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return null;
  const then = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  then.setHours(0, 0, 0, 0);
  const diff = now.getTime() - then.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Recommended interval in days for core checkups from age, occupation, history.
 * Mirrors recommendationFromProfile logic.
 */
export function getCoreIntervalDays(age, occupation, medicalHistory, key) {
  const parsedAge = Number(age || 0);
  const demandingJobs = ["nurse", "construction", "warehouse", "athlete", "firefighter"];
  const historyBlob = (medicalHistory || [])
    .map((event) => `${event.title || ""} ${event.notes || ""}`.toLowerCase())
    .join(" ");

  if (key === "physical") {
    const demanding = demandingJobs.some((job) => (occupation || "").toLowerCase().includes(job));
    return demanding ? 182 : 365;
  }
  if (key === "dental") {
    return parsedAge > 50 ? 122 : 183;
  }
  if (key === "optometry") {
    return historyBlob.includes("diabetes") || parsedAge > 40 ? 365 : 730;
  }
  return 365;
}

/** When no last-visit date, show a plausible partial ring (demo). */
export function defaultDaysSinceWhenUnknown(intervalDays) {
  return Math.min(Math.max(14, Math.floor(intervalDays * 0.28)), Math.max(1, intervalDays - 1));
}

/**
 * Effective days since last visit for rings: from stored date, or soft default.
 */
export function effectiveDaysSinceForCore(lastVisitISO, intervalDays) {
  const fromDate = calendarDaysSinceLastVisit(lastVisitISO);
  if (fromDate !== null) return Math.max(0, fromDate);
  return defaultDaysSinceWhenUnknown(intervalDays);
}

const PRESET_INTERVAL_DAYS = {
  Chiropractic: 30,
  Physiotherapy: 42,
  "Yoga / movement class": 7,
  "Massage therapy": 28,
};

export function getExtraIntervalDays(name) {
  return PRESET_INTERVAL_DAYS[name] ?? 90;
}

export function effectiveDaysSinceForExtra(lastVisitISO, intervalDays) {
  const fromDate = calendarDaysSinceLastVisit(lastVisitISO);
  if (fromDate !== null) return Math.max(0, fromDate);
  return defaultDaysSinceWhenUnknown(intervalDays);
}
