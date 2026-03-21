import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const SIZE = 168;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const CX = SIZE / 2;
const CY = SIZE / 2;

function centerLabel(daysRemaining) {
  if (daysRemaining < 0) {
    const overdue = Math.abs(daysRemaining);
    return overdue === 1 ? "1 day overdue" : `${overdue} days overdue`;
  }
  if (daysRemaining === 0) return "Due today";
  if (daysRemaining === 1) return "1 day left";
  return `${daysRemaining} days`;
}

/**
 * @param {{ cardKey: string, policyLine: string, serviceTitle: string, intervalDays: number, daysSinceLastVisit: number, accent: string }} props
 */
export default function CheckupDonutCard({ cardKey, policyLine, serviceTitle, intervalDays, daysSinceLastVisit, accent }) {
  const navigate = useNavigate();
  const daysRemaining = intervalDays - daysSinceLastVisit;

  const fraction = useMemo(() => {
    if (intervalDays <= 0) return 0;
    return Math.max(0, Math.min(1, daysRemaining / intervalDays));
  }, [daysRemaining, intervalDays]);

  const arcLength = fraction * C;
  const isDue = daysRemaining <= 0;
  const arcClass = `checkup-countdown-arc checkup-countdown-arc--${accent}`;

  const safeId = String(cardKey).replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 64);
  const headingId = `checkup-card-${safeId}`;
  const descId = `${headingId}-policy`;

  return (
    <article className="checkup-donut-card" aria-labelledby={headingId} aria-describedby={descId}>
      <p id={descId} className="checkup-donut-card-policy">
        {policyLine}
      </p>
      <h3 id={headingId} className="checkup-donut-card-title">
        {serviceTitle}
      </h3>

      <div className="checkup-donut-card-chart-wrap">
        <div
          className="checkup-countdown-chart checkup-countdown-chart--compact"
          role="img"
          aria-label={`${centerLabel(daysRemaining)} until this care is due.`}
        >
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="checkup-countdown-svg">
            <circle
              className="checkup-countdown-track"
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              strokeWidth={STROKE}
            />
            <circle
              className={arcClass}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="butt"
              transform={`rotate(-90 ${CX} ${CY})`}
              strokeDasharray={`${arcLength} ${C}`}
            />
          </svg>
          <div className="checkup-countdown-center">
            <span className={`checkup-countdown-days ${isDue ? "checkup-countdown-days--due" : ""}`}>
              {centerLabel(daysRemaining)}
            </span>
          </div>
        </div>

        {isDue && (
          <button type="button" className="checkup-countdown-cta" onClick={() => navigate("/health-compass")}>
            Book care
          </button>
        )}
      </div>
    </article>
  );
}
