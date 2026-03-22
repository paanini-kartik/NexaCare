/**
 * Maps effectiveInsurers categories to the { dental, vision, physio } shape
 * used by ChatbotWidget, DashboardPage, and Layout.
 */
export function mapBenefits(effectiveInsurers) {
  const allCats = (effectiveInsurers ?? []).flatMap((i) => i.categories ?? []);
  if (!allCats.length) return null;
  const find = (...keys) =>
    allCats.find((c) =>
      keys.some((k) =>
        String(c.name ?? c.label ?? c.key ?? "").toLowerCase().includes(k)
      )
    );
  const dental = find("dental");
  const vision = find("vision", "optometry", "eye");
  const physio = find("physio", "physical", "physiotherapy");
  const hasAny = [dental, vision, physio].some((c) => c && (c.annualLimit ?? 0) > 0);
  return {
    dental: { total: dental?.annualLimit ?? 0, used: dental?.used ?? 0 },
    vision: { total: vision?.annualLimit ?? 0, used: vision?.used ?? 0 },
    physio: { total: physio?.annualLimit ?? 0, used: physio?.used ?? 0 },
    hasAny,
  };
}
