import { createRequiredEmployerCategories } from "../lib/employerBenefitTemplates";

/**
 * New employer organizations start with one role template including required benefit lines.
 */
export function createEnterpriseFromSignup({ name, ownerEmail }) {
  const id = `ent-${Date.now().toString(36)}`;
  return {
    id,
    name: name.trim() || "New organization",
    ownerEmail,
    employeeRoles: [
      {
        id: `${id}-role-1`,
        name: "Primary role",
        categories: createRequiredEmployerCategories(),
      },
    ],
  };
}
