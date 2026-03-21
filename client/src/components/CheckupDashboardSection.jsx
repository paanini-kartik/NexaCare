import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { CHECKUP_TYPE_META, CORE_CHECKUP_KEYS, extraServicePolicyLine } from "../data/checkupConfig";
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

  const coreItems = useMemo(
    () =>
      CORE_CHECKUP_KEYS.map((key) => {
        const meta = CHECKUP_TYPE_META[key];
        const row = checkupSchedule[key];
        const intervalDays = getCoreIntervalDays(age, occupation, medicalHistory, key);
        const daysSinceLastVisit = effectiveDaysSinceForCore(row?.lastVisitISO, intervalDays);
        const policyLine = `Recommended every ${intervalDays} days from your profile (age, occupation, history). The ring tracks time since your last logged visit.`;
        return {
          key,
          policyLine,
          serviceTitle: meta.serviceTitle,
          intervalDays,
          daysSinceLastVisit,
          accent: meta.accent,
        };
      }),
    [checkupSchedule, age, occupation, medicalHistory]
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
          Intervals for physical, dental, and eye care follow your profile. Log last visits on{" "}
          <strong>Health profile</strong>; optional services use preset cadences.
        </p>
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
