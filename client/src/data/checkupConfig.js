/** Core types always shown on the dashboard */
export const CORE_CHECKUP_KEYS = ["physical", "dental", "optometry"];

/** Labels + accent for built-in care types (policy copy is built in-app from computed intervals). */
export const CHECKUP_TYPE_META = {
  physical: {
    serviceTitle: "Physical exam",
    accent: "physical",
  },
  dental: {
    serviceTitle: "Dental cleaning & exam",
    accent: "dental",
  },
  optometry: {
    serviceTitle: "Eye exam",
    accent: "optometry",
  },
};

/** Quick-add wellness (intervals come from preset map in cadence.js). */
export const CARE_SERVICE_PRESETS = [
  { name: "Chiropractic" },
  { name: "Physiotherapy" },
  { name: "Yoga / movement class" },
  { name: "Massage therapy" },
];

export function extraServicePolicyLine(name, intervalDays) {
  return `Suggested cadence about every ${intervalDays} days for ${name}. Log your last visit to keep the ring accurate.`;
}
