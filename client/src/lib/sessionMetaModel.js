/**
 * Canonical shape for `appState/sessionMeta` (Firestore + localStorage mirror).
 * All session-meta writes should go through functional updates based on this model
 * so concurrent edits (e.g. memberWorkSchedules + employerKeys) never clobber each other.
 */
export function emptySessionMeta() {
  return {
    families: {},
    employerKeys: [],
    enterpriseDirectory: {},
  };
}

/** One invite key per (orgId, roleTemplateId); keeps first occurrence (stable for sharing links). */
export function dedupeEmployerKeys(keys) {
  if (!Array.isArray(keys)) return [];
  const seen = new Set();
  const out = [];
  for (const k of keys) {
    if (!k || typeof k !== "object") continue;
    const sig = `${k.orgId ?? ""}::${k.roleTemplateId ?? ""}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(k);
  }
  return out;
}

export function normalizeSessionMeta(raw) {
  if (!raw || typeof raw !== "object") return emptySessionMeta();
  const employerKeys = dedupeEmployerKeys(raw.employerKeys);
  return {
    families: raw.families && typeof raw.families === "object" ? raw.families : {},
    employerKeys,
    enterpriseDirectory:
      raw.enterpriseDirectory && typeof raw.enterpriseDirectory === "object" ? raw.enterpriseDirectory : {},
  };
}

/** Overlay owned org definitions onto directory (employer accounts publishing plans for members). */
export function mergeSessionMetaEnterpriseDirectory(prevSm, ownedEnterpriseList) {
  const prev = normalizeSessionMeta(prevSm);
  const dir = { ...prev.enterpriseDirectory };
  for (const e of ownedEnterpriseList || []) {
    if (e?.id) dir[e.id] = e;
  }
  return { ...prev, enterpriseDirectory: dir };
}

function normEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

/** Union invite rows by key string (then dedupe org+role for consistency). */
export function mergeEmployerKeyLists(a, b) {
  const map = new Map();
  for (const k of [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]) {
    if (k?.key) map.set(String(k.key).toUpperCase(), k);
  }
  return dedupeEmployerKeys([...map.values()]);
}

/** Merge two snapshots of the same family (members, schedules, shared providers). */
export function mergeFamilyRecord(remoteFam, localFam) {
  if (!remoteFam) return localFam;
  if (!localFam) return remoteFam;
  const memberByEmail = new Map();
  for (const m of remoteFam.members || []) {
    memberByEmail.set(normEmail(m.email), m);
  }
  for (const m of localFam.members || []) {
    memberByEmail.set(normEmail(m.email), m);
  }
  const members = [...memberByEmail.values()];
  const rmp = remoteFam.manualProviders || [];
  const lmp = localFam.manualProviders || [];
  return {
    ...remoteFam,
    ...localFam,
    id: localFam.id || remoteFam.id,
    joinKey: localFam.joinKey || remoteFam.joinKey,
    ownerEmail: localFam.ownerEmail || remoteFam.ownerEmail,
    members,
    memberWorkSchedules: {
      ...(remoteFam.memberWorkSchedules && typeof remoteFam.memberWorkSchedules === "object"
        ? remoteFam.memberWorkSchedules
        : {}),
      ...(localFam.memberWorkSchedules && typeof localFam.memberWorkSchedules === "object"
        ? localFam.memberWorkSchedules
        : {}),
    },
    manualProviders: lmp.length >= rmp.length ? lmp : rmp,
  };
}

/**
 * Merge server + client before writing to Firestore.
 * Client omits a family id that still exists on the server → treat as dissolved.
 * If the client has no families at all but the server does, keep server (avoid wiping on stale/empty state).
 */
export function mergeFamiliesForFirestoreSave(remoteFamilies, localFamilies) {
  const R = remoteFamilies && typeof remoteFamilies === "object" ? remoteFamilies : {};
  const L = localFamilies && typeof localFamilies === "object" ? localFamilies : {};
  if (Object.keys(L).length === 0 && Object.keys(R).length > 0) {
    return { ...R };
  }
  const merged = {};
  const ids = new Set([...Object.keys(R), ...Object.keys(L)]);
  for (const id of ids) {
    if (L[id] && R[id]) {
      merged[id] = mergeFamilyRecord(R[id], L[id]);
    } else if (L[id]) {
      merged[id] = L[id];
    }
    // server-only id omitted from local → dropped
  }
  return merged;
}

/** Full appState/sessionMeta merge for a Firestore transaction (remote = server, local = this write). */
export function mergeSessionMetaForFirestoreSave(remoteRaw, localRaw) {
  const remote = normalizeSessionMeta(remoteRaw);
  const local = normalizeSessionMeta(localRaw);
  return {
    families: mergeFamiliesForFirestoreSave(remote.families, local.families),
    employerKeys: mergeEmployerKeyLists(remote.employerKeys, local.employerKeys),
    enterpriseDirectory: { ...remote.enterpriseDirectory, ...local.enterpriseDirectory },
  };
}

/**
 * Merge a fresh Firestore snapshot into local React state (never drop server-only families).
 * Use before join / key lookup so another user's writes are visible.
 */
export function mergeSessionMetaViewsForClient(serverMeta, clientMeta) {
  const S = normalizeSessionMeta(serverMeta);
  const C = normalizeSessionMeta(clientMeta);
  const mergedFamilies = {};
  const ids = new Set([...Object.keys(S.families), ...Object.keys(C.families)]);
  for (const id of ids) {
    mergedFamilies[id] = mergeFamilyRecord(S.families[id], C.families[id]);
  }
  return {
    families: mergedFamilies,
    employerKeys: mergeEmployerKeyLists(S.employerKeys, C.employerKeys),
    enterpriseDirectory: { ...S.enterpriseDirectory, ...C.enterpriseDirectory },
  };
}
