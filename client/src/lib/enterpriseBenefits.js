import { normEmail } from "./firestoreSync";

/**
 * Resolve all employer schedules that apply — household (family) and work (employee) can both be active.
 * Manual / family-shared providers come from the family record or personal user fields.
 * Owner + contributor employer keys are copied into `family.memberWorkSchedules` so plans persist for the whole family.
 */
export function resolveBenefitSources(user, household, enterprise, sessionMeta) {
  if (!user) return [];

  /** Employer accounts manage plans in Employer Hub; dashboard/benefits stay empty until they use a member profile. */
  if (user.accountType === "employer") return [];

  const out = [];
  /** One slot per person + work row so two members on the same org/role each count; same row from two code paths dedupes. */
  const seenSlots = new Set();

  const pushHousehold = (enterpriseId, roleId) => {
    if (!enterpriseId || !roleId) return;
    const slot = `household|${enterpriseId}|${roleId}`;
    if (seenSlots.has(slot)) return;
    seenSlots.add(slot);
    out.push({ enterpriseId, roleId, kind: "household" });
  };

  const pushWork = (memberEmailNorm, wa, kind = "work") => {
    if (!wa?.enterpriseId || !wa?.roleTemplateId) return;
    const waId = String(wa.id || `${wa.enterpriseId}-${wa.roleTemplateId}`);
    const slot = `work|${memberEmailNorm}|${waId}`;
    if (seenSlots.has(slot)) return;
    seenSlots.add(slot);
    out.push({
      enterpriseId: wa.enterpriseId,
      roleId: wa.roleTemplateId,
      kind,
      memberEmail: memberEmailNorm,
      workAssignmentId: waId,
    });
  };

  if (household?.enterpriseId && household?.sharedBenefitRoleId) {
    pushHousehold(household.enterpriseId, household.sharedBenefitRoleId);
  }
  const isDependent = user.familyRole === "dependent";
  const me = normEmail(user.email);
  if (!isDependent) {
    const list = Array.isArray(user.workAssignments) ? user.workAssignments : [];
    if (list.length) {
      for (const wa of list) {
        if (wa?.enterpriseId && wa?.roleTemplateId) {
          pushWork(me, wa, "work");
        }
      }
    } else if (user.enterpriseId && user.employeeRoleTemplateId) {
      pushWork(me, {
        id: "wa-legacy",
        enterpriseId: user.enterpriseId,
        roleTemplateId: user.employeeRoleTemplateId,
      });
    }
  }

  const fam = user.familyId && sessionMeta?.families?.[user.familyId];
  if (fam?.members?.length) {
    const schedules = fam.memberWorkSchedules && typeof fam.memberWorkSchedules === "object" ? fam.memberWorkSchedules : {};
    for (const m of fam.members) {
      if (m.familyRole !== "owner" && m.familyRole !== "contributor") continue;
      const mem = normEmail(m.email);
      const rows = schedules[mem];
      if (!Array.isArray(rows) || !rows.length) continue;
      for (const wa of rows) {
        if (wa?.enterpriseId && wa?.roleTemplateId) {
          pushWork(mem, wa, "work");
        }
      }
    }
  }

  if (fam?.manualProviders?.length) {
    for (const p of fam.manualProviders) {
      out.push({ kind: "manual", manual: p });
    }
  }

  if (!user.familyId && Array.isArray(user.manualBenefitProviders) && user.manualBenefitProviders.length) {
    for (const p of user.manualBenefitProviders) {
      out.push({ kind: "manual", manual: p });
    }
  }

  return out;
}

function planLabelForSchedule(kind) {
  if (kind === "household") return "Household";
  if (kind === "work") return "Work";
  if (kind === "employer_preview") return "Preview";
  return "Schedule";
}

function zeroUsedCategories(categories) {
  return (categories || []).map((c) => ({
    ...c,
    used: 0,
    annualLimit: typeof c.annualLimit === "number" ? c.annualLimit : 0,
    coverage: typeof c.coverage === "number" ? c.coverage : 0,
  }));
}

/**
 * Build provider blocks only from resolved user/employer/family data (no fallback mock carriers).
 */
export function getEffectiveInsurers(resolutions, enterprises) {
  if (!Array.isArray(resolutions) || !resolutions.length || !Array.isArray(enterprises)) {
    return [];
  }

  const synthetics = [];
  for (const res of resolutions) {
    if (res.kind === "manual" && res.manual) {
      const m = res.manual;
      synthetics.push({
        id: `manual-${m.id}`,
        provider: m.provider || "Benefits",
        plan: m.plan || "Manual",
        categories: zeroUsedCategories(m.categories),
      });
      continue;
    }
    const ent = enterprises.find((e) => e.id === res.enterpriseId);
    if (!ent) continue;
    const role = ent.employeeRoles.find((r) => r.id === res.roleId);
    if (!role) continue;
    const slotSuffix =
      res.kind === "work" && res.workAssignmentId != null
        ? `${res.memberEmail || "member"}-${res.workAssignmentId}`
        : res.kind === "household"
          ? "household"
          : `${res.kind}`;
    synthetics.push({
      id: `synth-${ent.id}-${role.id}-${res.kind}-${slotSuffix}`,
      provider: ent.name,
      plan: planLabelForSchedule(res.kind),
      categories: zeroUsedCategories(role.categories),
    });
  }
  return synthetics;
}

export function summarizeInsurersForDashboard(insurersList) {
  const flat = insurersList.flatMap((i) => i.categories);
  if (!flat.length) {
    return { remaining: 0, avgCoverage: 0, totalLimit: 0 };
  }
  const totalLimit = flat.reduce((sum, c) => sum + c.annualLimit, 0);
  const totalUsed = flat.reduce((sum, c) => sum + (c.used || 0), 0);
  const remaining = totalLimit - totalUsed;
  const avgCoverage = Math.round((flat.reduce((sum, c) => sum + c.coverage, 0) / flat.length) * 100);
  return { remaining, avgCoverage, totalLimit };
}
