/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { CORE_CHECKUP_KEYS } from "../data/checkupConfig";
import { createEnterpriseFromSignup } from "../data/enterpriseDefaults";
import { cloneManualProvidersForFamilyMerge } from "../lib/manualBenefitDefaults";
import { serializeMemberWorkAssignments } from "../lib/memberWorkShare";
import { makeEmployerInviteKey, makeFamilyJoinKey } from "../lib/connectionKeys";
import { getEffectiveInsurers, resolveBenefitSources, summarizeInsurersForDashboard } from "../lib/enterpriseBenefits";
import { mergeWithRequiredEmployerCategories, summarizeEmployerProgramForWorkers } from "../lib/employerBenefitTemplates";
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from "../lib/firebase";
import {
  ensureEmailLookup,
  loadSessionMetaFromFirestore,
  loadUserDocument,
  normEmail,
  saveSessionMetaToFirestore,
  saveUserDocument,
  setEmailLookup,
  updateRemoteUserProfileByEmail,
} from "../lib/firestoreSync";
import {
  emptySessionMeta,
  mergeEmployerKeyLists,
  mergeSessionMetaEnterpriseDirectory,
  mergeSessionMetaViewsForClient,
  normalizeSessionMeta,
} from "../lib/sessionMetaModel";
import { clearMemberDashboardOnboardingSession } from "../lib/memberDashboardOnboarding";

const USE_FIREBASE = isFirebaseConfigured();

const USER_KEY = "nexacare:user";
const SESSION_META_KEY = "nexacare:session-meta";
const USER_REGISTRY_KEY = "nexacare:user-registry";
const PROFILE_KEY = "nexacare:profile";
const ONBOARDING_KEY = "nexacare:onboarding-complete";
const ENTERPRISES_KEY = "nexacare:enterprises";
const HOUSEHOLD_KEY = "nexacare:household";

function readRegistry() {
  const raw = readStorage(USER_REGISTRY_KEY, null);
  return raw && typeof raw === "object" ? raw : {};
}

function writeRegistry(registry) {
  localStorage.setItem(USER_REGISTRY_KEY, JSON.stringify(registry));
}

function saveUserToRegistry(user) {
  if (!user?.email) return;
  const key = normEmail(user.email);
  const registry = readRegistry();
  registry[key] = { ...user };
  writeRegistry(registry);
}

const AuthContext = createContext(null);

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function loadEnterprises() {
  const raw = readStorage(ENTERPRISES_KEY, null);
  if (!Array.isArray(raw)) return [];
  return raw.filter((e) => e && e.id !== "ent-sample");
}

function loadHousehold() {
  const raw = readStorage(HOUSEHOLD_KEY, null);
  if (raw && typeof raw === "object") {
    return {
      enterpriseId: raw.enterpriseId ?? null,
      sharedBenefitRoleId: raw.sharedBenefitRoleId ?? null,
      familyLinkCode: raw.familyLinkCode ?? "",
    };
  }
  return { enterpriseId: null, sharedBenefitRoleId: null, familyLinkCode: "" };
}

function loadSessionMeta() {
  return normalizeSessionMeta(readStorage(SESSION_META_KEY, null));
}

/** Member employment only — employer accounts use enterpriseId for their organization, not jobs. */
function normalizeMemberWorkAssignments(raw) {
  // Explicit array (including empty) wins — do not fall back to legacy flat fields when clearing all jobs.
  if (Array.isArray(raw.workAssignments)) {
    return raw.workAssignments
      .filter((w) => w && w.enterpriseId && w.roleTemplateId)
      .map((w, i) => ({
        id: String(w.id || `wa-${i}-${w.enterpriseId}`),
        enterpriseId: w.enterpriseId,
        roleTemplateId: w.roleTemplateId,
        locked: Boolean(w.locked),
      }));
  }
  if (raw.enterpriseId && raw.employeeRoleTemplateId) {
    return [
      {
        id: "wa-legacy",
        enterpriseId: raw.enterpriseId,
        roleTemplateId: raw.employeeRoleTemplateId,
        locked: Boolean(raw.employerAssignmentLocked),
      },
    ];
  }
  return [];
}

function syncMemberWorkAssignmentFlatFields(userObj) {
  const wa = normalizeMemberWorkAssignments(userObj);
  const first = wa[0];
  return {
    ...userObj,
    workAssignments: wa,
    enterpriseId: first?.enterpriseId ?? null,
    employeeRoleTemplateId: first?.roleTemplateId ?? null,
    employerAssignmentLocked: wa.some((w) => w.locked),
  };
}

function migrateLegacyUser(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.accountType) {
    const at =
      raw.accountType === "employer"
        ? "employer"
        : raw.accountType === "family" || raw.accountType === "employee" || raw.accountType === "member"
          ? "member"
          : "member";
    const base = {
      ...raw,
      accountType: at,
      familyRole: raw.familyRole || "owner",
      companyLinkCode: raw.companyLinkCode ?? null,
      familyId: raw.familyId ?? null,
      connectionKeysCount: typeof raw.connectionKeysCount === "number" ? raw.connectionKeysCount : 0,
      manualBenefitProviders: Array.isArray(raw.manualBenefitProviders) ? raw.manualBenefitProviders : [],
    };
    if (at === "employer") {
      return {
        ...base,
        workAssignments: [],
        employerAssignmentLocked: Boolean(raw.employerAssignmentLocked),
      };
    }
    return syncMemberWorkAssignmentFlatFields(base);
  }
  const legacy = raw.role === "employer" ? "employer" : "member";
  const base = {
    ...raw,
    accountType: legacy,
    familyRole: raw.familyRole || "owner",
    companyLinkCode: raw.companyLinkCode ?? null,
    familyId: raw.familyId ?? null,
    connectionKeysCount: typeof raw.connectionKeysCount === "number" ? raw.connectionKeysCount : 0,
    manualBenefitProviders: Array.isArray(raw.manualBenefitProviders) ? raw.manualBenefitProviders : [],
  };
  if (legacy === "employer") {
    return {
      ...base,
      workAssignments: [],
      employerAssignmentLocked: Boolean(raw.employerAssignmentLocked),
    };
  }
  return syncMemberWorkAssignmentFlatFields(base);
}

function migrateCoreRow(row) {
  if (!row || typeof row !== "object") return { lastVisitISO: null };
  if (row.lastVisitISO && typeof row.lastVisitISO === "string") {
    return { lastVisitISO: row.lastVisitISO.slice(0, 10) };
  }
  if (typeof row.daysSinceLastVisit === "number" && !Number.isNaN(row.daysSinceLastVisit)) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - row.daysSinceLastVisit);
    return { lastVisitISO: d.toISOString().slice(0, 10) };
  }
  return { lastVisitISO: null };
}

function normalizeCheckupSchedule(raw) {
  const next = {};
  for (const key of CORE_CHECKUP_KEYS) {
    const row = raw && typeof raw === "object" ? raw[key] : null;
    next[key] = migrateCoreRow(row);
  }
  return next;
}

function normalizeExtraCareServices(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && String(x.name || "").trim())
    .map((x, i) => {
      const name = String(x.name).trim();
      let lastVisitISO = null;
      if (x.lastVisitISO && typeof x.lastVisitISO === "string") {
        lastVisitISO = x.lastVisitISO.slice(0, 10);
      } else if (typeof x.daysSinceLastVisit === "number" && !Number.isNaN(x.daysSinceLastVisit)) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - x.daysSinceLastVisit);
        lastVisitISO = d.toISOString().slice(0, 10);
      }
      const kind = x.kind === "preset" || x.kind === "other" ? x.kind : "other";
      return {
        id: typeof x.id === "string" && x.id ? x.id : `extra-${i}-${name.slice(0, 24)}`,
        name,
        kind,
        lastVisitISO,
      };
    });
}

function stripUid(profile) {
  if (!profile || typeof profile !== "object") return profile;
  const { uid: _uid, ...rest } = profile;
  return rest;
}

function slugKeyPart(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32);
}

/** Stable ids so list remove/filter works for legacy rows without `id`. */
function normalizeMedicalHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((e, i) => {
      if (!e || typeof e !== "object") return null;
      const title = String(e.title || "").trim();
      const date = String(e.date || "").trim();
      const notes = String(e.notes || "").trim();
      if (!title && !date && !notes) return null;
      const id =
        typeof e.id === "string" && e.id
          ? e.id
          : `mh-${i}-${slugKeyPart(date)}-${slugKeyPart(title)}`;
      return { id, title, date, notes };
    })
    .filter(Boolean);
}

function normalizeAllergies(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((e, i) => {
      if (!e || typeof e !== "object") return null;
      const name = String(e.name || "").trim();
      if (!name) return null;
      const severity = e.severity || "Low";
      const id =
        typeof e.id === "string" && e.id ? e.id : `al-${i}-${slugKeyPart(name)}`;
      return { id, name, severity };
    })
    .filter(Boolean);
}

function normalizeFavoriteClinics(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c, i) => {
      if (!c || typeof c !== "object") return null;
      const name = String(c.name || "").trim();
      if (!name) return null;
      const id = typeof c.id === "string" && c.id ? c.id : `fc-${i}-${slugKeyPart(name)}`;
      return { ...c, id, name, type: c.type || "Clinic" };
    })
    .filter(Boolean);
}

function normalizeProfile(rawProfile) {
  const medicalHistory = normalizeMedicalHistory(rawProfile?.medicalHistory);
  const allergies = normalizeAllergies(rawProfile?.allergies);
  const favoriteClinics = normalizeFavoriteClinics(rawProfile?.favoriteClinics);

  return {
    age: rawProfile?.age ?? "",
    occupation: rawProfile?.occupation || "",
    calendarProvider:
      rawProfile?.calendarProvider != null && String(rawProfile.calendarProvider).trim() !== ""
        ? String(rawProfile.calendarProvider).trim()
        : "",
    medicalHistory,
    allergies,
    favoriteClinics,
    checkupSchedule: normalizeCheckupSchedule(rawProfile?.checkupSchedule),
    extraCareServices: normalizeExtraCareServices(rawProfile?.extraCareServices),
    /** Member dashboard: hide onboarding strip after visiting Benefits. */
    dashboardOnboardingDismissed: Boolean(rawProfile?.dashboardOnboardingDismissed),
    /** Step 2: user chose a calendar provider in Health Profile. */
    onboardingCalendarConnected: Boolean(rawProfile?.onboardingCalendarConnected),
  };
}

/**
 * Merge Firestore health profile into existing client state when auth finishes loading.
 * Prevents a slow/stale `loadUserDocument` from wiping in-flight edits (age, onboarding flags).
 */
function mergeHealthProfileFromAuthLoad(rawServer, prev) {
  const serverNorm = normalizeProfile(rawServer || {});
  const prevNorm = normalizeProfile(prev || {});
  return normalizeProfile({
    ...serverNorm,
    ...prevNorm,
    dashboardOnboardingDismissed:
      Boolean(serverNorm.dashboardOnboardingDismissed || prevNorm.dashboardOnboardingDismissed),
    onboardingCalendarConnected:
      Boolean(serverNorm.onboardingCalendarConnected || prevNorm.onboardingCalendarConnected),
  });
}

/**
 * After logout, `prev` is a normalized "empty" profile (age "", empty arrays, etc.). Spreading that
 * over the server doc in mergeHealthProfileFromAuthLoad would **wipe** every field saved in Firebase.
 * Only merge local-over-remote when the user has actually entered something this session.
 */
function isHealthProfileBlankish(p) {
  const n = normalizeProfile(p || {});
  if (String(n.age ?? "").trim()) return false;
  if (String(n.occupation ?? "").trim()) return false;
  if (n.medicalHistory.length) return false;
  if (n.allergies.length) return false;
  if (n.favoriteClinics.length) return false;
  if (n.extraCareServices.length) return false;
  if (n.dashboardOnboardingDismissed) return false;
  if (n.onboardingCalendarConnected) return false;
  for (const row of Object.values(n.checkupSchedule || {})) {
    if (row && row.lastVisitISO) return false;
  }
  return true;
}

function healthProfileForFirestoreSave(profile) {
  try {
    return JSON.parse(JSON.stringify(normalizeProfile(profile)));
  } catch {
    return normalizeProfile(profile);
  }
}

/**
 * Use the live Auth user for Firestore writes. `firebaseUid` React state can still be null briefly
 * right after sign-in while `onAuthStateChanged` is mid-flight — skipping saves made profile look
 * "not persistent" across logins.
 */
function getUidForFirestoreWrite() {
  return getFirebaseAuth()?.currentUser?.uid ?? null;
}

/** localStorage-only: separate health profile per login email (legacy single key used as fallback). */
function localHealthProfileStorageKey(email) {
  return `${PROFILE_KEY}:${normEmail(email)}`;
}

function readLocalHealthProfile(user) {
  if (!user?.email) return normalizeProfile({});
  const keyed = localHealthProfileStorageKey(user.email);
  let raw = readStorage(keyed, null);
  if (raw == null) {
    raw = readStorage(PROFILE_KEY, {});
    if (raw && typeof raw === "object" && Object.keys(raw).length) {
      try {
        localStorage.setItem(keyed, JSON.stringify(raw));
      } catch {
        /* ignore */
      }
    }
  }
  return normalizeProfile(raw || {});
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (USE_FIREBASE ? null : migrateLegacyUser(readStorage(USER_KEY, null))));
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [authReady, setAuthReady] = useState(() => !USE_FIREBASE);
  const [enterprises, setEnterprises] = useState(() => (USE_FIREBASE ? [] : loadEnterprises()));
  const [household, setHouseholdState] = useState(() =>
    USE_FIREBASE
      ? { enterpriseId: null, sharedBenefitRoleId: null, familyLinkCode: "" }
      : loadHousehold()
  );
  const [sessionMeta, setSessionMeta] = useState(() => (USE_FIREBASE ? emptySessionMeta() : loadSessionMeta()));
  const [healthProfile, setHealthProfile] = useState(() =>
    USE_FIREBASE ? normalizeProfile({}) : readLocalHealthProfile(migrateLegacyUser(readStorage(USER_KEY, null)))
  );
  const [showOnboardingOverlay, setShowOnboardingOverlay] = useState(false);

  /** Local mode: load the correct account's profile when switching users. */
  useEffect(() => {
    if (USE_FIREBASE) return;
    setHealthProfile(readLocalHealthProfile(user));
  }, [user?.email]);

  useEffect(() => {
    if (!USE_FIREBASE) {
      setAuthReady(true);
      return undefined;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthReady(true);
      return undefined;
    }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          setFirebaseUid(null);
          clearMemberDashboardOnboardingSession();
          setSessionMeta(emptySessionMeta());
          setHealthProfile(normalizeProfile({}));
          setHouseholdState({ enterpriseId: null, sharedBenefitRoleId: null, familyLinkCode: "" });
          setEnterprises([]);
          setShowOnboardingOverlay(false);
          return;
        }
        setFirebaseUid(firebaseUser.uid);
        let data = await loadUserDocument(firebaseUser.uid);
        if (!data) {
          // New user — auto-create a minimal Firestore doc rather than locking them out.
          const defaultDoc = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            accountType: "member",
            createdAt: new Date().toISOString(),
          };
          try {
            await saveUserDocument(firebaseUser.uid, { profile: defaultDoc });
            data = { profile: defaultDoc };
            console.info("NexaCare: created default Firestore profile for new user.");
          } catch (createErr) {
            console.warn("NexaCare: could not create default profile, proceeding anyway.", createErr);
            data = { profile: defaultDoc };
          }
        }
        const mergedProfile = migrateLegacyUser({
          ...data.profile,
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.profile?.email,
        });
        setUser(mergedProfile);
        setHealthProfile((prev) => {
          const serverRaw = data.healthProfile || {};
          if (isHealthProfileBlankish(prev)) {
            return normalizeProfile(serverRaw);
          }
          return mergeHealthProfileFromAuthLoad(serverRaw, prev);
        });
        setHouseholdState(
          data.household && typeof data.household === "object"
            ? {
                enterpriseId: data.household.enterpriseId ?? null,
                sharedBenefitRoleId: data.household.sharedBenefitRoleId ?? null,
                familyLinkCode: data.household.familyLinkCode ?? "",
              }
            : { enterpriseId: null, sharedBenefitRoleId: null, familyLinkCode: "" }
        );
        const userEnts =
          Array.isArray(data.enterprises) && data.enterprises.length
            ? data.enterprises.filter((e) => e?.id !== "ent-sample")
            : [];
        setEnterprises(userEnts);
        setShowOnboardingOverlay(data.onboardingComplete === false);
        const sm = await loadSessionMetaFromFirestore();
        const mergedSm = mergeSessionMetaEnterpriseDirectory(sm, userEnts);
        setSessionMeta(mergedSm);
        void saveSessionMetaToFirestore(mergedSm).catch((e) => {
          console.warn("NexaCare: failed to sync enterprise directory on login", e);
        });
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  /** Always pass a function `(prev) => next` so reads merge with latest state (fixes benefit / family clobber bugs). */
  const persistSessionMeta = useCallback((updater) => {
    setSessionMeta((prev) => {
      const prevNorm = normalizeSessionMeta(prev);
      const next =
        typeof updater === "function" ? normalizeSessionMeta(updater(prevNorm)) : normalizeSessionMeta(updater);
      if (!USE_FIREBASE) {
        try {
          localStorage.setItem(SESSION_META_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      } else {
        void saveSessionMetaToFirestore(next).catch((e) => {
          console.warn("NexaCare: failed to save session meta", e);
        });
      }
      return next;
    });
  }, []);

  const persistEnterprises = useCallback(
    (next) => {
      setEnterprises(next);
      if (!USE_FIREBASE) {
        localStorage.setItem(ENTERPRISES_KEY, JSON.stringify(next));
      } else if (firebaseUid) {
        void saveUserDocument(firebaseUid, { enterprises: next }).catch((e) => {
          console.warn("NexaCare: failed to save enterprises", e);
        });
      }
      persistSessionMeta((prev) => mergeSessionMetaEnterpriseDirectory(prev, next));
    },
    [firebaseUid, persistSessionMeta]
  );

  const persistHousehold = useCallback(
    (next) => {
      setHouseholdState(next);
      if (!USE_FIREBASE) {
        localStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(next));
        return;
      }
      if (!firebaseUid) return;
      void saveUserDocument(firebaseUid, { household: next }).catch((e) => {
        console.warn("NexaCare: failed to save household", e);
      });
    },
    [firebaseUid]
  );

  /** Publish this user's employer-linked jobs to the family doc so every member resolves the same plans. */
  useEffect(() => {
    if (!user?.familyId || user.accountType !== "member") return;
    if (user.familyRole !== "owner" && user.familyRole !== "contributor") return;

    persistSessionMeta((prevSm) => {
      const fam = prevSm.families?.[user.familyId];
      if (!fam) return prevSm;
      const em = normEmail(user.email);
      const slice = serializeMemberWorkAssignments(user);
      const prev = fam.memberWorkSchedules?.[em];
      if (JSON.stringify(prev || []) === JSON.stringify(slice)) return prevSm;
      return {
        ...prevSm,
        families: {
          ...prevSm.families,
          [fam.id]: {
            ...fam,
            memberWorkSchedules: { ...(fam.memberWorkSchedules || {}), [em]: slice },
          },
        },
      };
    });
  }, [persistSessionMeta, user]);

  /** Owned enterprises (user doc) + shared directory (Firestore session meta) for linked employers. */
  const resolvedEnterprises = useMemo(() => {
    const map = new Map();
    for (const e of enterprises) {
      if (e?.id) map.set(e.id, e);
    }
    const dir = sessionMeta.enterpriseDirectory;
    if (dir && typeof dir === "object") {
      for (const ent of Object.values(dir)) {
        if (ent && typeof ent === "object" && ent.id && !map.has(ent.id)) {
          map.set(ent.id, ent);
        }
      }
    }
    return Array.from(map.values());
  }, [enterprises, sessionMeta.enterpriseDirectory]);

  const myEnterprise = useMemo(() => {
    if (!user?.enterpriseId) return null;
    return enterprises.find((e) => e.id === user.enterpriseId) || null;
  }, [user, enterprises]);

  const currentFamily = useMemo(() => {
    if (!user?.familyId || !sessionMeta.families[user.familyId]) return null;
    return sessionMeta.families[user.familyId];
  }, [user?.familyId, sessionMeta.families]);

  const benefitSources = useMemo(
    () => resolveBenefitSources(user, sessionMeta),
    [user, sessionMeta]
  );

  const effectiveInsurers = useMemo(
    () => getEffectiveInsurers(benefitSources, resolvedEnterprises),
    [benefitSources, resolvedEnterprises]
  );

  const benefitDashboardSummary = useMemo(() => summarizeInsurersForDashboard(effectiveInsurers), [effectiveInsurers]);

  /** Aggregated annual limits across all job-role templates (employer accounts only). */
  const employerProgramSummary = useMemo(() => {
    if (user?.accountType !== "employer") return null;
    return summarizeEmployerProgramForWorkers(myEnterprise);
  }, [user?.accountType, myEnterprise]);

  const benefitContextDescription = useMemo(() => {
    if (!benefitSources.length) return "";
    const parts = benefitSources
      .map((res) => {
        if (res.kind === "manual" && res.manual) {
          const p  = res.manual.provider || res.manual.name || "";
          const pl = res.manual.plan     || res.manual.planName || "";
          const nameParts = [p, pl].filter(Boolean);
          return nameParts.length ? nameParts.join(" — ") : null;
        }
        const ent = resolvedEnterprises.find((e) => e.id === res.enterpriseId);
        if (!ent) return null;
        if (res.kind === "household") return `${ent.name} (household)`;
        if (res.kind === "work") return `${ent.name} (work)`;
        if (res.kind === "employer_preview") return `${ent.name} (preview)`;
        return ent.name;
      })
      .filter(Boolean);
    return parts.length ? parts.join(" · ") : "";
  }, [benefitSources, resolvedEnterprises]);

  const login = useCallback(
    async (identity, options = { isSignup: false }) => {
      const pwd = String(identity.password || "");
      if (!pwd) throw new Error("Password is required");

      if (USE_FIREBASE) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error("Firebase is not initialized");
        const email = normEmail(identity.email);

        if (options.isSignup) {
          const cred = await createUserWithEmailAndPassword(auth, email, pwd);
          const uid = cred.user.uid;
          let nextEnterprises = [...enterprises];
          let safeUser;

          if (identity.isEmployer) {
            const org = createEnterpriseFromSignup({
              name: identity.companyName || "Organization",
              ownerEmail: identity.email,
            });
            nextEnterprises = [...nextEnterprises, org];
            const enterpriseId = org.id;
            const employeeRoleTemplateId = org.employeeRoles[0]?.id ?? null;
            safeUser = migrateLegacyUser({
              fullName: identity.fullName || "User",
              email: identity.email,
              accountType: "employer",
              familyRole: "owner",
              enterpriseId,
              employeeRoleTemplateId,
              companyLinkCode: null,
              familyId: null,
              connectionKeysCount: 0,
              employerAssignmentLocked: false,
            });
          } else {
            safeUser = migrateLegacyUser({
              fullName: identity.fullName || "User",
              email: identity.email,
              accountType: "member",
              familyRole: "owner",
              enterpriseId: null,
              employeeRoleTemplateId: null,
              companyLinkCode: null,
              familyId: null,
              connectionKeysCount: 0,
              employerAssignmentLocked: false,
            });
          }

          await saveUserDocument(uid, {
            profile: stripUid(safeUser),
            healthProfile: normalizeProfile({}),
            household: { enterpriseId: null, sharedBenefitRoleId: null, familyLinkCode: "" },
            onboardingComplete: false,
            enterprises: nextEnterprises,
          });
          await setEmailLookup(email, uid);
          if (identity.isEmployer && nextEnterprises.length) {
            const sm = await loadSessionMetaFromFirestore();
            const mergedSm = mergeSessionMetaEnterpriseDirectory(sm, nextEnterprises);
            await saveSessionMetaToFirestore(mergedSm);
          }
          return;
        }

        await signInWithEmailAndPassword(auth, email, pwd);
        const credUser = auth.currentUser;
        if (credUser) await ensureEmailLookup(credUser.uid, email);
        return;
      }

      const emailKey = normEmail(identity.email);
      const registry = readRegistry();
      const existing = registry[emailKey] ? migrateLegacyUser(registry[emailKey]) : null;

      if (options.isSignup) {
        const isEmployer = Boolean(identity.isEmployer);

        if (isEmployer) {
          const org = createEnterpriseFromSignup({
            name: identity.companyName || "Organization",
            ownerEmail: identity.email,
          });
          persistEnterprises([...enterprises, org]);
          const enterpriseId = org.id;
          const employeeRoleTemplateId = org.employeeRoles[0]?.id ?? null;

          const safeUser = migrateLegacyUser({
            fullName: identity.fullName || "User",
            email: identity.email,
            accountType: "employer",
            familyRole: "owner",
            enterpriseId,
            employeeRoleTemplateId,
            companyLinkCode: null,
            familyId: null,
            connectionKeysCount: 0,
            employerAssignmentLocked: false,
          });

          setUser(safeUser);
          localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
          saveUserToRegistry(safeUser);
        } else {
          const safeUser = migrateLegacyUser({
            fullName: identity.fullName || "User",
            email: identity.email,
            accountType: "member",
            familyRole: "owner",
            enterpriseId: null,
            employeeRoleTemplateId: null,
            companyLinkCode: null,
            familyId: null,
            connectionKeysCount: 0,
            employerAssignmentLocked: false,
          });

          setUser(safeUser);
          localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
          saveUserToRegistry(safeUser);
        }
      } else {
        let safeUser;
        if (existing) {
          safeUser = migrateLegacyUser({
            ...existing,
            fullName: existing.fullName || "User",
            email: identity.email,
          });
        } else {
          const fromEmail = String(identity.email || "").split("@")[0]?.trim() || "";
          safeUser = migrateLegacyUser({
            fullName: fromEmail || "User",
            email: identity.email,
            accountType: "member",
            familyRole: "owner",
            enterpriseId: null,
            employeeRoleTemplateId: null,
            companyLinkCode: null,
            familyId: null,
            connectionKeysCount: 0,
            employerAssignmentLocked: false,
          });
        }

        setUser(safeUser);
        localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
        saveUserToRegistry(safeUser);
      }

      const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY) === "true";
      if (options.isSignup && !hasCompletedOnboarding) {
        setShowOnboardingOverlay(true);
      }
    },
    [enterprises, persistEnterprises]
  );

  const updateUser = useCallback(
    (partial) => {
      setUser((prev) => {
        if (!prev) return null;
        const next = migrateLegacyUser({ ...prev, ...partial });
        if (!USE_FIREBASE) {
          localStorage.setItem(USER_KEY, JSON.stringify(next));
          saveUserToRegistry(next);
        } else {
          const uid = getUidForFirestoreWrite();
          if (uid) {
            void saveUserDocument(uid, { profile: stripUid(next) }).catch((e) => {
              console.warn("NexaCare: failed to save profile", e);
            });
          }
        }
        return next;
      });
    },
    []
  );

  const createFamilyGroup = useCallback(() => {
    if (!user || user.accountType !== "member" || user.familyId) return { ok: false, error: "Already in a family" };
    const id = `fam-${Date.now().toString(36)}`;
    const joinKey = makeFamilyJoinKey();
    const personal = Array.isArray(user.manualBenefitProviders) ? user.manualBenefitProviders : [];
    const seededProviders = personal.length ? cloneManualProvidersForFamilyMerge(personal) : [];
    const em = normEmail(user.email);
    const ws = serializeMemberWorkAssignments(user);
    const memberWorkSchedules = ws.length ? { [em]: ws } : {};
    persistSessionMeta((prev) => ({
      ...prev,
      families: {
        ...prev.families,
        [id]: {
          id,
          joinKey,
          ownerEmail: em,
          members: [{ email: user.email, familyRole: "owner" }],
          manualProviders: seededProviders,
          memberWorkSchedules,
        },
      },
    }));
    updateUser({
      familyId: id,
      familyRole: "owner",
      connectionKeysCount: (user.connectionKeysCount || 0) + 1,
      ...(personal.length ? { manualBenefitProviders: [] } : {}),
    });
    return { ok: true, joinKey };
  }, [user, persistSessionMeta, updateUser]);

  const joinFamilyWithKey = useCallback(
    async (joinKeyInput, joinRole) => {
      if (!user || user.accountType !== "member") return { ok: false, error: "Not available" };
      if (user.familyId) return { ok: false, error: "Already in a family" };
      if (!["contributor", "dependent"].includes(joinRole)) return { ok: false, error: "Choose contributor or dependent" };
      const k = String(joinKeyInput || "").trim().toUpperCase();
      const personal = Array.isArray(user.manualBenefitProviders) ? user.manualBenefitProviders : [];
      let userPatch = { familyId: null, familyRole: joinRole };
      let errorOut = null;

      let fresh = null;
      if (USE_FIREBASE) {
        try {
          fresh = await loadSessionMetaFromFirestore();
        } catch (e) {
          console.warn("NexaCare: failed to load session meta for join", e);
          return { ok: false, error: "Could not load shared data. Try again." };
        }
      }

      persistSessionMeta((prev) => {
        const merged = fresh ? mergeSessionMetaViewsForClient(fresh, prev) : normalizeSessionMeta(prev);
        const fam = Object.values(merged.families).find((f) => String(f.joinKey || "").trim().toUpperCase() === k);
        if (!fam) {
          errorOut = errorOut || "Invalid family key";
          return merged;
        }
        if (fam.members.some((m) => normEmail(m.email) === normEmail(user.email))) {
          errorOut = errorOut || "Already in this family";
          return merged;
        }
        let manualProviders = fam.manualProviders || [];
        userPatch = { familyId: fam.id, familyRole: joinRole };
        if (joinRole === "contributor" && personal.length) {
          manualProviders = [...manualProviders, ...cloneManualProvidersForFamilyMerge(personal)];
          userPatch.manualBenefitProviders = [];
        }
        const emJoin = normEmail(user.email);
        const nextSchedules = { ...(fam.memberWorkSchedules || {}) };
        if (joinRole === "contributor") {
          nextSchedules[emJoin] = serializeMemberWorkAssignments(user);
        } else {
          delete nextSchedules[emJoin];
        }
        const nextMembers = [...fam.members, { email: user.email, familyRole: joinRole }];
        errorOut = null;
        return {
          ...merged,
          families: {
            ...merged.families,
            [fam.id]: { ...fam, members: nextMembers, manualProviders, memberWorkSchedules: nextSchedules },
          },
        };
      });

      if (errorOut) return { ok: false, error: errorOut };
      if (!userPatch.familyId) return { ok: false, error: "Invalid family key" };
      updateUser(userPatch);
      return { ok: true };
    },
    [user, persistSessionMeta, updateUser]
  );

  const ownerSetFamilyMemberRole = useCallback(
    (targetEmail, newRole) => {
      if (!user?.familyId || user.familyRole !== "owner") return { ok: false, error: "Only the owner can assign roles" };
      if (!["contributor", "dependent"].includes(newRole)) return { ok: false, error: "Invalid role" };
      if (normEmail(targetEmail) === normEmail(user.email)) return { ok: false, error: "Cannot change your own role here" };
      const fid = user.familyId;
      const te = normEmail(targetEmail);
      let ok = false;
      persistSessionMeta((prev) => {
        const fam = prev.families[fid];
        if (!fam) return prev;
        const idx = fam.members.findIndex((m) => normEmail(m.email) === te);
        if (idx < 0) return prev;
        ok = true;
        const nextMembers = fam.members.map((m, i) => (i === idx ? { ...m, familyRole: newRole } : m));
        const nextSchedules = { ...(fam.memberWorkSchedules || {}) };
        if (newRole === "dependent") {
          delete nextSchedules[te];
        }
        return {
          ...prev,
          families: {
            ...prev.families,
            [fam.id]: { ...fam, members: nextMembers, memberWorkSchedules: nextSchedules },
          },
        };
      });
      if (!ok) return { ok: false, error: "Member not in family" };
      if (USE_FIREBASE) {
        void updateRemoteUserProfileByEmail(te, { familyRole: newRole });
      } else {
        const reg = readRegistry();
        if (reg[te]) {
          reg[te] = migrateLegacyUser({ ...reg[te], familyRole: newRole });
          writeRegistry(reg);
        }
      }
      return { ok: true };
    },
    [user, persistSessionMeta]
  );

  /** Solo owner only — deletes the family record. */
  const dissolveFamily = useCallback(() => {
    if (!user?.familyId || user.familyRole !== "owner") return { ok: false, error: "Only the owner can remove the family" };
    const fid = user.familyId;
    let err = null;
    persistSessionMeta((prev) => {
      const fam = prev.families[fid];
      if (!fam) {
        err = "Family not found";
        return prev;
      }
      if (fam.members.length !== 1) {
        err = "Remove other members first, or transfer ownership—then you can leave or dissolve if alone";
        return prev;
      }
      if (normEmail(fam.members[0].email) !== normEmail(user.email)) {
        err = "Invalid state";
        return prev;
      }
      err = null;
      const nextFamilies = { ...prev.families };
      delete nextFamilies[fam.id];
      return { ...prev, families: nextFamilies };
    });
    if (err) return { ok: false, error: err };
    updateUser({ familyId: null, familyRole: "owner" });
    if (!USE_FIREBASE) {
      const reg = readRegistry();
      const me = normEmail(user.email);
      if (reg[me]) {
        reg[me] = migrateLegacyUser({ ...reg[me], familyId: null, familyRole: "owner" });
        writeRegistry(reg);
      }
    }
    return { ok: true };
  }, [user, persistSessionMeta, updateUser]);

  /** Owner gives owner role to another member; previous owner becomes contributor. */
  const transferFamilyOwnership = useCallback(
    (newOwnerEmail) => {
      if (!user?.familyId || user.familyRole !== "owner") return { ok: false, error: "Only the owner can transfer" };
      const fid = user.familyId;
      const ne = normEmail(newOwnerEmail);
      const me = normEmail(user.email);
      let err = null;
      persistSessionMeta((prev) => {
        const fam = prev.families[fid];
        if (!fam || fam.members.length < 2) {
          err = "No other member to transfer to";
          return prev;
        }
        const target = fam.members.find((m) => normEmail(m.email) === ne);
        if (!target || target.familyRole === "owner") {
          err = "Pick a contributor or dependent";
          return prev;
        }
        if (ne === me) {
          err = "Choose someone else";
          return prev;
        }
        err = null;
        const nextMembers = fam.members.map((m) => {
          if (normEmail(m.email) === me) return { ...m, familyRole: "contributor" };
          if (normEmail(m.email) === ne) return { ...m, familyRole: "owner" };
          return m;
        });
        return {
          ...prev,
          families: {
            ...prev.families,
            [fam.id]: { ...fam, members: nextMembers, ownerEmail: ne },
          },
        };
      });
      if (err) return { ok: false, error: err };
      updateUser({ familyRole: "contributor" });
      if (USE_FIREBASE) {
        void (async () => {
          await updateRemoteUserProfileByEmail(me, { familyRole: "contributor" });
          await updateRemoteUserProfileByEmail(ne, { familyRole: "owner" });
        })();
      } else {
        const reg = readRegistry();
        if (reg[me]) {
          reg[me] = migrateLegacyUser({ ...reg[me], familyRole: "contributor" });
        }
        if (reg[ne]) {
          reg[ne] = migrateLegacyUser({ ...reg[ne], familyRole: "owner" });
        }
        writeRegistry(reg);
      }
      return { ok: true };
    },
    [user, persistSessionMeta, updateUser]
  );

  /** Owners alone dissolve the family; owners with others must transfer first. Non-owners leave normally. */
  const leaveFamily = useCallback(() => {
    if (!user?.familyId) return { ok: false, error: "Not in a family" };
    const fid = user.familyId;
    if (user.familyRole === "owner") {
      const fam = sessionMeta.families[fid];
      if (!fam) {
        return { ok: false, error: "Family not found. Refresh the page and try again." };
      }
      if (fam.members.length === 1) {
        return dissolveFamily();
      }
      return { ok: false, error: "Transfer ownership first, then you can leave as a contributor." };
    }
    let err = null;
    persistSessionMeta((prev) => {
      const fam = prev.families[fid];
      if (!fam) {
        err = "Family not found";
        return prev;
      }
      err = null;
      const nextMembers = fam.members.filter((m) => normEmail(m.email) !== normEmail(user.email));
      const leftEm = normEmail(user.email);
      const nextSchedules = { ...(fam.memberWorkSchedules || {}) };
      delete nextSchedules[leftEm];
      return {
        ...prev,
        families: {
          ...prev.families,
          [fam.id]: { ...fam, members: nextMembers, memberWorkSchedules: nextSchedules },
        },
      };
    });
    if (err) return { ok: false, error: err };
    updateUser({ familyId: null, familyRole: "owner" });
    if (!USE_FIREBASE) {
      const reg = readRegistry();
      const me = normEmail(user.email);
      if (reg[me]) {
        reg[me] = migrateLegacyUser({ ...reg[me], familyId: null, familyRole: "owner" });
        writeRegistry(reg);
      }
    }
    return { ok: true };
  }, [user, sessionMeta, persistSessionMeta, updateUser, dissolveFamily]);

  const generateEmployerInviteKey = useCallback(
    (roleTemplateId) => {
      if (!user || user.accountType !== "employer" || !user.enterpriseId || !roleTemplateId) return null;
      const key = makeEmployerInviteKey();
      const entry = {
        key,
        orgId: user.enterpriseId,
        roleTemplateId,
        createdByEmail: normEmail(user.email),
      };
      persistSessionMeta((prev) => ({
        ...prev,
        employerKeys: [...prev.employerKeys, entry],
      }));
      updateUser({ connectionKeysCount: (user.connectionKeysCount || 0) + 1 });
      return key;
    },
    [user, persistSessionMeta, updateUser]
  );

  const applyEmployerInviteKey = useCallback(
    async (keyInput) => {
      if (!user || user.accountType !== "member") return { ok: false, error: "Not available" };
      const k = String(keyInput || "").trim().toUpperCase();
      let keys = sessionMeta.employerKeys;
      if (USE_FIREBASE) {
        try {
          const fresh = await loadSessionMetaFromFirestore();
          keys = mergeEmployerKeyLists(fresh.employerKeys, sessionMeta.employerKeys);
        } catch (e) {
          console.warn("NexaCare: failed to load session meta for employer key", e);
          return { ok: false, error: "Could not verify key. Try again." };
        }
      }
      const found = keys.find((e) => String(e.key || "").trim().toUpperCase() === k);
      if (!found) return { ok: false, error: "Invalid employer key" };
      const existing = user.workAssignments || [];
      if (existing.some((w) => w.enterpriseId === found.orgId && w.roleTemplateId === found.roleTemplateId)) {
        return { ok: false, error: "This work position is already linked" };
      }
      const entry = {
        id: `wa-${Date.now().toString(36)}`,
        enterpriseId: found.orgId,
        roleTemplateId: found.roleTemplateId,
        locked: true,
      };
      updateUser({ workAssignments: [...existing, entry] });
      return { ok: true };
    },
    [user, sessionMeta.employerKeys, updateUser]
  );

  const removeWorkPosition = useCallback(
    (positionId) => {
      if (!user || user.accountType !== "member") return { ok: false, error: "Not available" };
      const next = (user.workAssignments || []).filter((w) => w.id !== positionId);
      if (next.length === (user.workAssignments || []).length) return { ok: false, error: "Position not found" };
      updateUser({ workAssignments: next });
      return { ok: true };
    },
    [user, updateUser]
  );

  const updateEnterprise = useCallback(
    (enterpriseId, updater) => {
      persistEnterprises(
        enterprises.map((e) => {
          if (e.id !== enterpriseId) return e;
          return typeof updater === "function" ? updater(e) : { ...e, ...updater };
        })
      );
    },
    [enterprises, persistEnterprises]
  );

  const appendEmployerInviteKey = useCallback(
    (orgId, roleTemplateId) => {
      if (!user || user.accountType !== "employer" || !orgId || !roleTemplateId) return;
      let added = false;
      persistSessionMeta((prev) => {
        if (prev.employerKeys.some((k) => k.orgId === orgId && k.roleTemplateId === roleTemplateId)) return prev;
        added = true;
        const entry = {
          key: makeEmployerInviteKey(),
          orgId,
          roleTemplateId,
          createdByEmail: normEmail(user.email),
        };
        return { ...prev, employerKeys: [...prev.employerKeys, entry] };
      });
      if (added) {
        updateUser({ connectionKeysCount: (user.connectionKeysCount || 0) + 1 });
      }
    },
    [user, persistSessionMeta, updateUser]
  );

  /** Ensures every role template for the signed-in employer org has an invite key (backfill + idempotent). */
  const ensureEmployerInviteKeysForMyOrg = useCallback(() => {
    if (!user || user.accountType !== "employer" || !user.enterpriseId) return;
    const ent = enterprises.find((e) => e.id === user.enterpriseId);
    if (!ent?.employeeRoles?.length) return;
    let added = 0;
    persistSessionMeta((prev) => {
      const missing = ent.employeeRoles.filter(
        (r) => !prev.employerKeys.some((k) => k.orgId === ent.id && k.roleTemplateId === r.id)
      );
      if (!missing.length) return prev;
      added = missing.length;
      const nextKeys = [
        ...prev.employerKeys,
        ...missing.map((r) => ({
          key: makeEmployerInviteKey(),
          orgId: ent.id,
          roleTemplateId: r.id,
          createdByEmail: normEmail(user.email),
        })),
      ];
      return { ...prev, employerKeys: nextKeys };
    });
    if (added) {
      updateUser({ connectionKeysCount: (user.connectionKeysCount || 0) + added });
    }
  }, [user, enterprises, persistSessionMeta, updateUser]);

  const addEmployeeRole = useCallback(
    (enterpriseId, name) => {
      const newRoleId = `${enterpriseId}-role-${Date.now().toString(36)}`;
      updateEnterprise(enterpriseId, (e) => {
        const newRole = {
          id: newRoleId,
          name: name.trim() || "New role",
          categories: mergeWithRequiredEmployerCategories([]),
        };
        return { ...e, employeeRoles: [...e.employeeRoles, newRole] };
      });
      appendEmployerInviteKey(enterpriseId, newRoleId);
    },
    [updateEnterprise, appendEmployerInviteKey]
  );

  const updateEmployeeRoleCategories = useCallback(
    (enterpriseId, roleId, categories) => {
      const normalized = mergeWithRequiredEmployerCategories(categories);
      updateEnterprise(enterpriseId, (e) => ({
        ...e,
        employeeRoles: e.employeeRoles.map((r) => (r.id === roleId ? { ...r, categories: normalized } : r)),
      }));
    },
    [updateEnterprise]
  );

  const renameEmployeeRole = useCallback(
    (enterpriseId, roleId, name) => {
      updateEnterprise(enterpriseId, (e) => ({
        ...e,
        employeeRoles: e.employeeRoles.map((r) => (r.id === roleId ? { ...r, name: name.trim() || r.name } : r)),
      }));
    },
    [updateEnterprise]
  );

  const setEmployerPreviewRole = useCallback(
    (enterpriseId, roleId) => {
      updateEnterprise(enterpriseId, { employerPreviewRoleId: roleId });
    },
    [updateEnterprise]
  );

  const updateHousehold = useCallback(
    (partial) => {
      persistHousehold({ ...household, ...partial });
    },
    [household, persistHousehold]
  );

  const updateFamilyManualProviders = useCallback(
    (providers) => {
      const canShare = user?.familyRole === "owner" || user?.familyRole === "contributor";
      if (!user?.familyId || !canShare) {
        return {
          ok: false,
          error: "Only the family owner or a contributor can update shared benefit providers.",
        };
      }
      const fid = user.familyId;
      let ok = false;
      persistSessionMeta((prev) => {
        const fam = prev.families[fid];
        if (!fam) return prev;
        ok = true;
        const normalized = (providers || []).map((p, i) => ({
          ...p,
          id:
            p.id ||
            `mp-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          categories: (p.categories || []).map((c) => ({ ...c, used: 0 })),
        }));
        return {
          ...prev,
          families: {
            ...prev.families,
            [fam.id]: { ...fam, manualProviders: normalized },
          },
        };
      });
      if (!ok) return { ok: false, error: "Family not found." };
      return { ok: true };
    },
    [user, persistSessionMeta]
  );

  const updatePersonalManualProviders = useCallback(
    (providers) => {
      const normalized = (providers || []).map((p, i) => ({
        ...p,
        id: p.id || `mp-${Date.now().toString(36)}-${i}`,
        categories: (p.categories || []).map((c) => ({ ...c, used: 0 })),
      }));
      updateUser({ manualBenefitProviders: normalized });
      return { ok: true };
    },
    [updateUser]
  );

  const completeOnboardingOverlay = useCallback(async () => {
    if (USE_FIREBASE && firebaseUid) {
      const db = getFirestoreDb();
      if (db) {
        await updateDoc(doc(db, "users", firebaseUid), {
          onboardingComplete: true,
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      localStorage.setItem(ONBOARDING_KEY, "true");
    }
    setShowOnboardingOverlay(false);
  }, [firebaseUid]);

  const dismissOnboardingOverlay = () => {
    setShowOnboardingOverlay(false);
  };

  const logout = useCallback(async () => {
    if (USE_FIREBASE) {
      try {
        const auth = getFirebaseAuth();
        if (auth) await signOut(auth);
      } catch (e) {
        console.warn("NexaCare: sign out", e);
      }
    }
    setUser(null);
    setFirebaseUid(null);
    setShowOnboardingOverlay(false);
    clearMemberDashboardOnboardingSession();
    if (!USE_FIREBASE) {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const updateProfile = useCallback(
    (updates) => {
      setHealthProfile((prev) => {
        const patch = typeof updates === "function" ? updates(prev) : updates;
        const next = normalizeProfile({ ...prev, ...patch });
        if (!USE_FIREBASE) {
          const em = normEmail(user?.email || "");
          try {
            if (em) {
              localStorage.setItem(localHealthProfileStorageKey(user.email), JSON.stringify(next));
            } else {
              localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
            }
          } catch {
            /* ignore */
          }
        } else {
          const uid = getUidForFirestoreWrite();
          if (uid) {
            const toSave = healthProfileForFirestoreSave(next);
            void saveUserDocument(uid, { healthProfile: toSave }).catch((e) => {
              console.error(
                "NexaCare: Firestore rejected health profile save (check rules / network / invalid fields):",
                e?.code || e?.message || e
              );
            });
          } else {
            console.warn(
              "NexaCare: health profile updated in memory only — not signed in; sign in again to sync to the cloud."
            );
          }
        }
        return next;
      });
    },
    [user?.email]
  );

  const value = useMemo(
    () => ({
      user,
      firebaseUid,
      authReady,
      healthProfile,
      isAuthenticated: Boolean(user),
      showOnboardingOverlay,
      enterprises,
      resolvedEnterprises,
      household,
      sessionMeta,
      myEnterprise,
      currentFamily,
      effectiveInsurers,
      benefitDashboardSummary,
      employerProgramSummary,
      benefitContextDescription,
      login,
      logout,
      updateProfile,
      completeOnboardingOverlay,
      dismissOnboardingOverlay,
      updateEnterprise,
      addEmployeeRole,
      updateEmployeeRoleCategories,
      renameEmployeeRole,
      setEmployerPreviewRole,
      updateHousehold,
      ensureEmployerInviteKeysForMyOrg,
      updateFamilyManualProviders,
      updatePersonalManualProviders,
      updateUser,
      createFamilyGroup,
      joinFamilyWithKey,
      ownerSetFamilyMemberRole,
      generateEmployerInviteKey,
      applyEmployerInviteKey,
      removeWorkPosition,
      dissolveFamily,
      transferFamilyOwnership,
      leaveFamily,
    }),
    [
      user,
      firebaseUid,
      authReady,
      healthProfile,
      showOnboardingOverlay,
      enterprises,
      resolvedEnterprises,
      household,
      sessionMeta,
      myEnterprise,
      currentFamily,
      effectiveInsurers,
      benefitDashboardSummary,
      employerProgramSummary,
      benefitContextDescription,
      login,
      logout,
      updateProfile,
      completeOnboardingOverlay,
      updateEnterprise,
      addEmployeeRole,
      updateEmployeeRoleCategories,
      renameEmployeeRole,
      setEmployerPreviewRole,
      updateHousehold,
      ensureEmployerInviteKeysForMyOrg,
      updateFamilyManualProviders,
      updatePersonalManualProviders,
      updateUser,
      createFamilyGroup,
      joinFamilyWithKey,
      ownerSetFamilyMemberRole,
      generateEmployerInviteKey,
      applyEmployerInviteKey,
      removeWorkPosition,
      dissolveFamily,
      transferFamilyOwnership,
      leaveFamily,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
