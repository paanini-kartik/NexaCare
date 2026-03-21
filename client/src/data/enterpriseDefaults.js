import { insurers } from "./mockData";

/** Clone categories from a mock insurer row for initial role templates */
export function categoriesFromInsurer(insurerIndex = 0) {
  const base = insurers[insurerIndex];
  if (!base) return [];
  return base.categories.map((c) => ({
    name: c.name,
    coverage: c.coverage,
    annualLimit: c.annualLimit,
    used: c.used,
  }));
}

export const SEED_ENTERPRISES = [
  {
    id: "ent-sample",
    name: "Sample Industries",
    ownerEmail: "hr@sample.local",
    employeeRoles: [
      {
        id: "role-ft",
        name: "Full-time",
        categories: categoriesFromInsurer(0),
      },
      {
        id: "role-pt",
        name: "Part-time",
        categories: categoriesFromInsurer(0).map((c) => ({
          ...c,
          annualLimit: Math.round(c.annualLimit * 0.65),
          used: Math.min(c.used, Math.round(c.annualLimit * 0.65)),
        })),
      },
    ],
  },
];

export function createEnterpriseFromSignup({ name, ownerEmail }) {
  const id = `ent-${Date.now().toString(36)}`;
  return {
    id,
    name: name.trim() || "New organization",
    ownerEmail,
    employeeRoles: [
      {
        id: `${id}-role-1`,
        name: "Full-time",
        categories: categoriesFromInsurer(0),
      },
      {
        id: `${id}-role-2`,
        name: "Part-time",
        categories: categoriesFromInsurer(0).map((c) => ({
          ...c,
          annualLimit: Math.round(c.annualLimit * 0.65),
          used: 0,
        })),
      },
    ],
  };
}
