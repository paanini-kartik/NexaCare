/**
 * New employer organizations start with one empty role template.
 * Benefit categories are added in Employer Hub (user-defined only).
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
        categories: [],
      },
    ],
  };
}
