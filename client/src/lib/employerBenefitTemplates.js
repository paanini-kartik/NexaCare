/**
 * Every employer job role must include these three benefit lines (names are canonical).
 * Extra categories may be added per role.
 */
export const REQUIRED_EMPLOYER_CATEGORY_NAMES = ["Optometry", "Dental", "Physical"];

const REQUIRED_LOWER = new Set(REQUIRED_EMPLOYER_CATEGORY_NAMES.map((n) => n.toLowerCase()));

/** Stable React / row identity (do not derive from `name` — typing would remount inputs). */
export function newEmployerCategoryRowKey() {
  return `emp-cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function requiredRowKeyForName(name) {
  return `emp-req-${String(name).toLowerCase()}`;
}

/** Fresh rows for a new role or org template. */
export function createRequiredEmployerCategories() {
  return REQUIRED_EMPLOYER_CATEGORY_NAMES.map((name) => ({
    rowKey: requiredRowKeyForName(name),
    name,
    coverage: 0,
    annualLimit: 0,
    used: 0,
  }));
}

/**
 * Ensures Optometry, Dental, and Physical exist; preserves limits/coverage for matching names (case-insensitive).
 * Additional categories are kept after the required three.
 */
export function mergeWithRequiredEmployerCategories(existing) {
  const list = Array.isArray(existing) ? existing : [];
  const byLower = new Map();
  for (const c of list) {
    if (!c || typeof c.name !== "string") continue;
    const k = c.name.trim().toLowerCase();
    if (!k) continue;
    byLower.set(k, { ...c, used: 0 });
  }
  const ordered = [];
  for (const name of REQUIRED_EMPLOYER_CATEGORY_NAMES) {
    const k = name.toLowerCase();
    const prev = byLower.get(k);
    if (prev) {
      ordered.push({
        ...prev,
        name,
        used: 0,
        rowKey: prev.rowKey || requiredRowKeyForName(name),
      });
      byLower.delete(k);
    } else {
      ordered.push({
        rowKey: requiredRowKeyForName(name),
        name,
        coverage: 0,
        annualLimit: 0,
        used: 0,
      });
    }
  }
  for (const [_k, row] of byLower) {
    ordered.push({
      ...row,
      used: 0,
      rowKey: row.rowKey || newEmployerCategoryRowKey(),
    });
  }
  return ordered;
}

export function isRequiredEmployerCategoryName(name) {
  return REQUIRED_LOWER.has(String(name || "").trim().toLowerCase());
}

/** Aggregate annual limits configured across all roles (plan design exposure for workers). */
export function summarizeEmployerProgramForWorkers(enterprise) {
  if (!enterprise?.employeeRoles?.length) {
    return {
      totalAnnualLimit: 0,
      byLine: { Optometry: 0, Dental: 0, Physical: 0 },
      roleCount: 0,
    };
  }
  let total = 0;
  const byLine = { Optometry: 0, Dental: 0, Physical: 0 };
  for (const role of enterprise.employeeRoles) {
    for (const c of role.categories || []) {
      const lim = Number(c.annualLimit) || 0;
      total += lim;
      const n = String(c.name || "")
        .trim()
        .toLowerCase();
      if (n === "optometry") byLine.Optometry += lim;
      else if (n === "dental") byLine.Dental += lim;
      else if (n === "physical") byLine.Physical += lim;
    }
  }
  return { totalAnnualLimit: total, byLine, roleCount: enterprise.employeeRoles.length };
}
