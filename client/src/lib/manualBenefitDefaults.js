/** Deep-clone manual rows with new ids (e.g. merging personal plans into the shared family list). */
export function cloneManualProvidersForFamilyMerge(list) {
  const t = Date.now().toString(36);
  return (list || []).map((p, i) => ({
    ...p,
    id: `mp-${t}-${i}-${Math.random().toString(36).slice(2, 10)}`,
    categories: (p.categories || []).map((c) => ({ ...c, used: 0 })),
  }));
}

/** New manual benefit block — user adds categories in Settings (starts empty). */
export function createDefaultManualProvider(providerName, planName) {
  return {
    id: `mp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    provider: (providerName || "").trim() || "Benefit provider",
    plan: (planName || "").trim() || "Custom plan",
    categories: [],
  };
}
