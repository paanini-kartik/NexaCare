/** Core types always shown on the dashboard */
export const CORE_CHECKUP_KEYS = ["physical", "dental", "optometry"];

export const DEFAULT_CHECKUP_SCHEDULE = {
  physical: { intervalDays: 365, daysSinceLastVisit: 110 },
  dental: { intervalDays: 180, daysSinceLastVisit: 45 },
  optometry: { intervalDays: 365, daysSinceLastVisit: 200 },
};

/** Labels + copy for built-in care types */
export const CHECKUP_TYPE_META = {
  physical: {
    serviceTitle: "Physical exam",
    policyLine: "Annual physical — each completed visit keeps you set for the next 365 days (adjust interval if your clinician recommends different).",
    accent: "physical",
  },
  dental: {
    serviceTitle: "Dental cleaning & exam",
    policyLine: "Preventive dental visit — many people aim for every 6 months; change the interval to match your dentist’s plan.",
    accent: "dental",
  },
  optometry: {
    serviceTitle: "Eye exam",
    policyLine: "Comprehensive eye exam — often every 12–24 months depending on age and risk; tune the numbers below to your needs.",
    accent: "optometry",
  },
};

/** One-tap adds on the health profile */
export const CARE_SERVICE_PRESETS = [
  { name: "Chiropractic", intervalDays: 30, daysSinceLastVisit: 12 },
  { name: "Physiotherapy", intervalDays: 42, daysSinceLastVisit: 14 },
  { name: "Yoga / movement class", intervalDays: 7, daysSinceLastVisit: 3 },
  { name: "Massage therapy", intervalDays: 28, daysSinceLastVisit: 10 },
];

export function extraServicePolicyLine(name) {
  return `${name} — you chose to track this; set how often you go and how long since your last session.`;
}
