import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { CHECKUP_TYPE_META, CORE_CHECKUP_KEYS, extraServicePolicyLine } from "../data/checkupConfig";
import CheckupDonutCard from "./CheckupDonutCard";

const EXTRA_ACCENTS = ["mint", "amber", "violet", "sky"];

export default function CheckupDashboardSection() {
  const { healthProfile } = useAuth();
  const { checkupSchedule, extraCareServices } = healthProfile;

  const coreItems = useMemo(
    () =>
      CORE_CHECKUP_KEYS.map((key) => {
        const meta = CHECKUP_TYPE_META[key];
        const row = checkupSchedule[key];
        return {
          key,
          policyLine: meta.policyLine,
          serviceTitle: meta.serviceTitle,
          intervalDays: row.intervalDays,
          daysSinceLastVisit: row.daysSinceLastVisit,
          accent: meta.accent,
        };
      }),
    [checkupSchedule]
  );

  const extraItems = useMemo(
    () =>
      (extraCareServices || []).map((svc, i) => ({
        key: svc.id,
        policyLine: extraServicePolicyLine(svc.name),
        serviceTitle: svc.name,
        intervalDays: svc.intervalDays,
        daysSinceLastVisit: svc.daysSinceLastVisit,
        accent: EXTRA_ACCENTS[i % EXTRA_ACCENTS.length],
      })),
    [extraCareServices]
  );

  return (
    <section className="checkup-dashboard-section" aria-labelledby="checkup-dash-heading">
      <header className="checkup-dashboard-head">
        <h2 id="checkup-dash-heading" className="title-vibe">
          Care windows
        </h2>
        <p className="checkup-dashboard-lead">
          Rings show time left in each window—full after a visit, empty when it’s time to book. Edit intervals and extras in{" "}
          <strong>Health profile</strong>.
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
