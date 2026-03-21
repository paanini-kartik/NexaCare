/**
 * Resolve all employer schedules that apply — household (family) and work (employee) can both be active.
 */
export function resolveBenefitSources(user, household, enterprise) {
  if (!user) return [];

  if (user.accountType === "employer" && user.enterpriseId && enterprise?.employeeRoles?.length) {
    const previewId = enterprise.employerPreviewRoleId || enterprise.employeeRoles[0].id;
    return [{ enterpriseId: user.enterpriseId, roleId: previewId, kind: "employer_preview" }];
  }

  if (user.accountType === "employer") return [];

  const out = [];
  const seen = new Set();

  const push = (enterpriseId, roleId, kind) => {
    if (!enterpriseId || !roleId) return;
    const key = `${enterpriseId}|${roleId}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ enterpriseId, roleId, kind });
  };

  if (household?.enterpriseId && household?.sharedBenefitRoleId) {
    push(household.enterpriseId, household.sharedBenefitRoleId, "household");
  }
  // Dependents only use family/owner-linked benefits — not personal work assignment
  const isDependent = user.familyRole === "dependent";
  if (!isDependent && user.enterpriseId && user.employeeRoleTemplateId) {
    push(user.enterpriseId, user.employeeRoleTemplateId, "work");
  }

  return out;
}

function planSuffix(kind) {
  if (kind === "household") return "household";
  if (kind === "work") return "work";
  if (kind === "employer_preview") return "preview";
  return "schedule";
}

/**
 * Build one provider block per resolution (multiple when both family household + work apply).
 */
export function getEffectiveInsurers(baseInsurers, resolutions, enterprises) {
  if (!Array.isArray(resolutions) || !resolutions.length || !Array.isArray(enterprises)) return baseInsurers;

  const synthetics = [];
  for (const res of resolutions) {
    const ent = enterprises.find((e) => e.id === res.enterpriseId);
    if (!ent) continue;
    const role = ent.employeeRoles.find((r) => r.id === res.roleId);
    if (!role) continue;
    const suffix = planSuffix(res.kind);
    synthetics.push({
      id: `synth-${ent.id}-${role.id}-${suffix}`,
      provider: ent.name,
      plan: `${role.name} (${suffix})`,
      categories: role.categories.map((c) => ({ ...c })),
    });
  }
  return synthetics.length ? synthetics : baseInsurers;
}

export function summarizeInsurersForDashboard(insurersList) {
  const flat = insurersList.flatMap((i) => i.categories);
  if (!flat.length) {
    return { remaining: 0, avgCoverage: 0, totalLimit: 0 };
  }
  const totalLimit = flat.reduce((sum, c) => sum + c.annualLimit, 0);
  const totalUsed = flat.reduce((sum, c) => sum + c.used, 0);
  const remaining = totalLimit - totalUsed;
  const avgCoverage = Math.round((flat.reduce((sum, c) => sum + c.coverage, 0) / flat.length) * 100);
  return { remaining, avgCoverage, totalLimit };
}
