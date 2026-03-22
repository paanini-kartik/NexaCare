import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { CHECKUP_TYPE_META, CORE_CHECKUP_KEYS, extraServicePolicyLine } from "../data/checkupConfig";
import { apiFetch } from "../lib/api";
import {
  effectiveDaysSinceForCore,
  effectiveDaysSinceForExtra,
  getCoreIntervalDays,
  getExtraIntervalDays,
} from "../lib/cadence";
import CheckupDonutCard from "./CheckupDonutCard";

const EXTRA_ACCENTS = ["mint", "amber", "violet", "sky"];

export default function CheckupDashboardSection() {
  const { healthProfile } = useAuth();
  const { checkupSchedule, extraCareServices } = healthProfile;
  const { age, occupation, medicalHistory } = healthProfile;

  const [aiIntervals, setAiIntervals] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [cadenceLoading, setCadenceLoading] = useState(true);

  const cadenceProfileKey = useMemo(
    () =>
      JSON.stringify({
        age,
        occupation,
        medicalHistory: medicalHistory ?? [],
        allergies: healthProfile?.allergies ?? [],
        lastVisits: {
          physical: checkupSchedule?.physical?.lastVisitISO ?? null,
          dental: checkupSchedule?.dental?.lastVisitISO ?? null,
          optometry: checkupSchedule?.optometry?.lastVisitISO ?? null,
        },
      }),
    [age, occupation, medicalHistory, healthProfile?.allergies, checkupSchedule]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCadence() {
      setCadenceLoading(true);
      try {
        const res = await apiFetch("/api/ai/cadence-intervals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            age,
            occupation,
            medicalHistory: medicalHistory ?? [],
            allergies: healthProfile?.allergies ?? [],
            lastVisits: {
              physical: checkupSchedule?.physical?.lastVisitISO ?? null,
              dental: checkupSchedule?.dental?.lastVisitISO ?? null,
              optometry: checkupSchedule?.optometry?.lastVisitISO ?? null,
            },
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled || !data?.ok) {
          setAiIntervals(null);
          setAiSummary(null);
          return;
        }
        setAiIntervals({
          physical: data.physicalDays,
          dental: data.dentalDays,
          optometry: data.visionDays,
        });
        setAiSummary(typeof data.summary === "string" ? data.summary.trim() : null);
      } catch {
        if (!cancelled) {
          setAiIntervals(null);
          setAiSummary(null);
        }
      } finally {
        if (!cancelled) setCadenceLoading(false);
      }
    }

    void loadCadence();
    return () => {
      cancelled = true;
    };
  }, [cadenceProfileKey]);

  const coreItems = useMemo(
    () =>
      CORE_CHECKUP_KEYS.map((key) => {
        const meta = CHECKUP_TYPE_META[key];
        const row = checkupSchedule[key];
        const intervalDays = getCoreIntervalDays(age, occupation, medicalHistory, key, aiIntervals);
        const daysSinceLastVisit = effectiveDaysSinceForCore(row?.lastVisitISO, intervalDays);
        const personalized = Boolean(aiIntervals);
        const policyLine = personalized
          ? `About every ${intervalDays} days — tuned from your health profile. Log your last visit so this ring stays accurate.`
          : `About every ${intervalDays} days based on your profile. Log your last visit on your health profile so this stays accurate.`;
        return {
          key,
          policyLine,
          serviceTitle: meta.serviceTitle,
          intervalDays,
          daysSinceLastVisit,
          accent: meta.accent,
        };
      }),
    [checkupSchedule, age, occupation, medicalHistory, aiIntervals]
  );

  const extraItems = useMemo(
    () =>
      (extraCareServices || []).map((svc, i) => {
        const intervalDays = getExtraIntervalDays(svc.name);
        const daysSinceLastVisit = effectiveDaysSinceForExtra(svc.lastVisitISO, intervalDays);
        return {
          key: svc.id,
          policyLine: extraServicePolicyLine(svc.name, intervalDays),
          serviceTitle: svc.name,
          intervalDays,
          daysSinceLastVisit,
          accent: EXTRA_ACCENTS[i % EXTRA_ACCENTS.length],
        };
      }),
    [extraCareServices]
  );

  return (
    <section className="checkup-dashboard-section" aria-labelledby="checkup-dash-heading">
      <header className="checkup-dashboard-head">
        <h2 id="checkup-dash-heading" className="title-vibe">
          Care windows
        </h2>
        <p className="checkup-dashboard-lead">
          Each ring shows time left until you’re due again (full ring = visit due). Spacing between visits for physical,
          dental, and vision is{" "}
          {cadenceLoading
            ? "being personalized from your profile…"
            : aiIntervals
              ? "set with AI-assisted timing from your health profile."
              : "estimated from age, work, and history on your profile (enable the Anthropic key on the server for smarter intervals). "}
          Keep your <strong>Health profile</strong> updated so rings match reality.
        </p>
        {aiSummary ? (
          <p className="checkup-dashboard-ai-note" role="note">
            <strong>Suggestion:</strong> {aiSummary}
          </p>
        ) : null}
      </header>
      <div className="checkup-dashboard-grid">
        {coreItems.map((item) => (
          <CheckupDonutCard
            key={item.key}
            cardKey={item.key}
            policyLine={item.policyLine}
            serviceTitle={item.serviceTitle}
            intervalDays={item.intervalDays}
            daysSinceLastVisit={item.daysSinceLastVisit}
            accent={item.accent}
          />
        ))}
        {extraItems.map((item) => (
          <CheckupDonutCard
            key={item.key}
            cardKey={item.key}
            policyLine={item.policyLine}
            serviceTitle={item.serviceTitle}
            intervalDays={item.intervalDays}
            daysSinceLastVisit={item.daysSinceLastVisit}
            accent={item.accent}
          />
        ))}
      </div>
    </section>
  );
}
