/**
 * Serialize a member's employer-linked positions for storage on the family record
 * (`memberWorkSchedules`) so every family member can resolve the same benefit sources.
 * Mirrors normalizeMemberWorkAssignments: explicit empty `workAssignments` array wins.
 */
export function serializeMemberWorkAssignments(user) {
  if (!user || user.accountType !== "member" || user.familyRole === "dependent") return [];
  if (Array.isArray(user.workAssignments)) {
    return user.workAssignments
      .filter((w) => w && w.enterpriseId && w.roleTemplateId)
      .map((w, i) => ({
        id: String(w.id || `wa-${i}-${w.enterpriseId}`),
        enterpriseId: w.enterpriseId,
        roleTemplateId: w.roleTemplateId,
        locked: Boolean(w.locked),
      }));
  }
  if (user.enterpriseId && user.employeeRoleTemplateId) {
    return [
      {
        id: "wa-legacy",
        enterpriseId: user.enterpriseId,
        roleTemplateId: user.employeeRoleTemplateId,
        locked: Boolean(user.employerAssignmentLocked),
      },
    ];
  }
  return [];
}
