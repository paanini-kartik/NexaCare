import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { CARE_SERVICE_PRESETS, CHECKUP_TYPE_META, CORE_CHECKUP_KEYS } from "../data/checkupConfig";

function recommendationFromProfile(age, occupation, medicalHistory = []) {
  const parsedAge = Number(age || 0);
  const demandingJobs = ["nurse", "construction", "warehouse", "athlete", "firefighter"];
  const historyBlob = medicalHistory
    .map((event) => `${event.title || ""} ${event.notes || ""}`.toLowerCase())
    .join(" ");

  return [
    { label: "Dental checkup", cadence: parsedAge > 50 ? "Every 4 months" : "Every 6 months" },
    {
      label: "Optometry check",
      cadence: historyBlob.includes("diabetes") || parsedAge > 40 ? "Every 12 months" : "Every 24 months",
    },
    {
      label: "Physical exam",
      cadence: demandingJobs.some((job) => (occupation || "").toLowerCase().includes(job))
        ? "Every 6 months"
        : "Every 12 months",
    },
  ];
}

export default function HealthProfilePage() {
  const { healthProfile, updateProfile } = useAuth();
  const recs = recommendationFromProfile(
    healthProfile.age,
    healthProfile.occupation,
    healthProfile.medicalHistory
  );
  const onChange = (field) => (e) => updateProfile({ [field]: e.target.value });

  const [newHistory, setNewHistory] = useState({ title: "", notes: "", date: "" });
  const [newAllergy, setNewAllergy] = useState({ name: "", severity: "Low" });
  const [newClinic, setNewClinic] = useState({ name: "", type: "Clinic" });
  const [customCare, setCustomCare] = useState({ name: "", intervalDays: 30, daysSinceLastVisit: 0 });

  const checkupSchedule = healthProfile.checkupSchedule;
  const extraCareServices = healthProfile.extraCareServices || [];

  const patchCheckupSchedule = (key, patch) => {
    updateProfile({
      checkupSchedule: {
        ...checkupSchedule,
        [key]: { ...checkupSchedule[key], ...patch },
      },
    });
  };

  const addPresetCare = (preset) => {
    const n = preset.name.toLowerCase();
    if (extraCareServices.some((e) => e.name.toLowerCase() === n)) return;
    updateProfile({
      extraCareServices: [
        ...extraCareServices,
        {
          id: crypto.randomUUID(),
          name: preset.name,
          intervalDays: preset.intervalDays,
          daysSinceLastVisit: preset.daysSinceLastVisit,
        },
      ],
    });
  };

  const addCustomCare = () => {
    const name = customCare.name.trim();
    if (!name) return;
    if (extraCareServices.some((e) => e.name.toLowerCase() === name.toLowerCase())) return;
    updateProfile({
      extraCareServices: [
        ...extraCareServices,
        {
          id: crypto.randomUUID(),
          name,
          intervalDays: Math.max(1, Number(customCare.intervalDays) || 30),
          daysSinceLastVisit: Math.max(0, Number(customCare.daysSinceLastVisit) || 0),
        },
      ],
    });
    setCustomCare({ name: "", intervalDays: 30, daysSinceLastVisit: 0 });
  };

  const updateExtraCare = (id, field, raw) => {
    const val =
      field === "intervalDays" ? Math.max(1, Number(raw) || 1) : Math.max(0, Number(raw) || 0);
    updateProfile({
      extraCareServices: extraCareServices.map((e) => (e.id === id ? { ...e, [field]: val } : e)),
    });
  };

  const removeExtraCare = (id) => {
    updateProfile({ extraCareServices: extraCareServices.filter((e) => e.id !== id) });
  };

  const sortedHistory = useMemo(() => {
    return [...(healthProfile.medicalHistory || [])].sort((a, b) => {
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;
      return bDate - aDate;
    });
  }, [healthProfile.medicalHistory]);

  const addHistoryEvent = () => {
    if (!newHistory.title.trim() || !newHistory.date) return;
    const next = [
      ...(healthProfile.medicalHistory || []),
      {
        id: crypto.randomUUID(),
        title: newHistory.title.trim(),
        notes: newHistory.notes.trim(),
        date: newHistory.date,
      },
    ];
    updateProfile({ medicalHistory: next });
    setNewHistory({ title: "", notes: "", date: "" });
  };

  const addAllergy = () => {
    if (!newAllergy.name.trim()) return;
    const next = [
      ...(healthProfile.allergies || []),
      { id: crypto.randomUUID(), name: newAllergy.name.trim(), severity: newAllergy.severity },
    ];
    updateProfile({ allergies: next });
    setNewAllergy({ name: "", severity: "Low" });
  };

  const addClinic = () => {
    if (!newClinic.name.trim()) return;
    const next = [
      ...(healthProfile.favoriteClinics || []),
      { id: crypto.randomUUID(), name: newClinic.name.trim(), type: newClinic.type },
    ];
    updateProfile({ favoriteClinics: next });
    setNewClinic({ name: "", type: "Clinic" });
  };

  return (
    <div className="profile-page">
      <header className="page-hero page-hero--alive">
        <h1>Health profile</h1>
        <p>
          Your story belongs in structured fields below—medical events, allergies, and clinics need clear boundaries.
          This intro stays in the open so the page breathes.
        </p>
      </header>

      <div className="profile-columns">
        <section className="contained profile-panel" aria-label="Your health data">
          <h2 className="page-section-title">Your information</h2>
          <p className="page-section-lead">Only what you choose to share. All stored locally for this demo.</p>

        <div className="form-grid">
          <label className="form-field">
            Age
            <input type="number" min="0" value={healthProfile.age} onChange={onChange("age")} />
          </label>
          <label className="form-field">
            Occupation
            <input
              value={healthProfile.occupation}
              onChange={onChange("occupation")}
              placeholder="e.g. Teacher"
            />
          </label>
          <label className="form-field">
            Calendar provider
            <select value={healthProfile.calendarProvider} onChange={onChange("calendarProvider")}>
              <option>Google</option>
              <option>Outlook</option>
              <option>Apple</option>
            </select>
          </label>
        </div>

        <article className="dynamic-section">
          <h3>Medical History</h3>
          <div className="form-grid">
            <label className="form-field">
              Event date
              <input
                type="date"
                value={newHistory.date}
                onChange={(e) => setNewHistory((prev) => ({ ...prev, date: e.target.value }))}
              />
            </label>
            <label className="form-field">
              Event title
              <input
                value={newHistory.title}
                onChange={(e) => setNewHistory((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Asthma diagnosis"
              />
            </label>
            <label className="form-field full">
              Notes
              <textarea
                rows="2"
                value={newHistory.notes}
                onChange={(e) => setNewHistory((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional details"
              />
            </label>
          </div>
          <div className="button-row">
            <button className="primary-btn" type="button" onClick={addHistoryEvent}>
              Add medical event
            </button>
          </div>

          <div className="list-stack">
            {sortedHistory.map((event) => (
              <details key={event.id} className="list-card details-card">
                <summary>
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.date}</p>
                  </div>
                </summary>
                <p>{event.notes || "No extra notes provided."}</p>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() =>
                    updateProfile({
                      medicalHistory: (healthProfile.medicalHistory || []).filter((item) => item.id !== event.id),
                    })
                  }
                >
                  <Trash2 size={14} /> Remove
                </button>
              </details>
            ))}
          </div>
        </article>

        <article className="dynamic-section">
          <h3>Allergies</h3>
          <div className="form-grid">
            <label className="form-field">
              Allergy name
              <input
                value={newAllergy.name}
                onChange={(e) => setNewAllergy((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Penicillin"
              />
            </label>
            <label className="form-field">
              Severity
              <select
                value={newAllergy.severity}
                onChange={(e) => setNewAllergy((prev) => ({ ...prev, severity: e.target.value }))}
              >
                <option>Low</option>
                <option>Moderate</option>
                <option>High</option>
              </select>
            </label>
          </div>
          <div className="button-row">
            <button className="primary-btn" type="button" onClick={addAllergy}>
              Add allergy
            </button>
          </div>
          <div className="list-stack">
            {(healthProfile.allergies || []).map((item) => (
              <article key={item.id} className="list-card">
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.severity} severity</p>
                </div>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() =>
                    updateProfile({
                      allergies: (healthProfile.allergies || []).filter((allergy) => allergy.id !== item.id),
                    })
                  }
                >
                  <Trash2 size={14} /> Remove
                </button>
              </article>
            ))}
          </div>
        </article>

        <article className="dynamic-section">
          <h3>Favorite Clinics</h3>
          <div className="form-grid">
            <label className="form-field">
              Clinic name
              <input
                value={newClinic.name}
                onChange={(e) => setNewClinic((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Northside Dental"
              />
            </label>
            <label className="form-field">
              Type
              <select
                value={newClinic.type}
                onChange={(e) => setNewClinic((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option>Clinic</option>
                <option>Hospital</option>
                <option>Pharmacy</option>
                <option>Specialist</option>
              </select>
            </label>
          </div>
          <div className="button-row">
            <button className="primary-btn" type="button" onClick={addClinic}>
              Add favorite clinic
            </button>
          </div>
          <div className="list-stack">
            {(healthProfile.favoriteClinics || []).map((item) => (
              <article key={item.id} className="list-card">
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.type}</p>
                </div>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() =>
                    updateProfile({
                      favoriteClinics: (healthProfile.favoriteClinics || []).filter(
                        (clinic) => clinic.id !== item.id
                      ),
                    })
                  }
                >
                  <Trash2 size={14} /> Remove
                </button>
              </article>
            ))}
          </div>
        </article>

        <article className="dynamic-section" aria-labelledby="care-track-heading">
          <h3 id="care-track-heading">Care &amp; services you track</h3>
          <p className="page-section-lead care-track-lead">
            Physical, dental, and eye exams always appear on your dashboard. Add chiropractic, physio, yoga, or anything
            else you want to count down—each extra gets its own ring.
          </p>

          <h4 className="care-subheading">Core checkups</h4>
          <p className="care-hint">
            <strong>Interval</strong> is how long each visit “counts” for. <strong>Days since last visit</strong> drives the
            ring (0 = just went; equals interval = due).
          </p>
          <div className="care-core-grid">
            {CORE_CHECKUP_KEYS.map((key) => {
              const meta = CHECKUP_TYPE_META[key];
              const row = checkupSchedule[key];
              return (
                <div key={key} className="care-core-card">
                  <p className="care-core-name">{meta.serviceTitle}</p>
                  <div className="form-grid care-core-fields">
                    <label className="form-field">
                      Interval (days)
                      <input
                        type="number"
                        min={1}
                        value={row.intervalDays}
                        onChange={(e) =>
                          patchCheckupSchedule(key, { intervalDays: Number(e.target.value) || 1 })
                        }
                      />
                    </label>
                    <label className="form-field">
                      Days since last visit
                      <input
                        type="number"
                        min={0}
                        value={row.daysSinceLastVisit}
                        onChange={(e) =>
                          patchCheckupSchedule(key, { daysSinceLastVisit: Number(e.target.value) || 0 })
                        }
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <h4 className="care-subheading">Add wellness &amp; therapy</h4>
          <p className="care-hint">Quick-add common services (tap again won’t duplicate the same name).</p>
          <div className="care-preset-row">
            {CARE_SERVICE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className="care-preset-chip"
                onClick={() => addPresetCare(preset)}
              >
                + {preset.name}
              </button>
            ))}
          </div>

          <h4 className="care-subheading">Custom service</h4>
          <div className="form-grid">
            <label className="form-field">
              Name
              <input
                value={customCare.name}
                onChange={(e) => setCustomCare((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Acupuncture, PT follow-up"
              />
            </label>
            <label className="form-field">
              Interval (days)
              <input
                type="number"
                min={1}
                value={customCare.intervalDays}
                onChange={(e) => setCustomCare((p) => ({ ...p, intervalDays: e.target.value }))}
              />
            </label>
            <label className="form-field">
              Days since last visit
              <input
                type="number"
                min={0}
                value={customCare.daysSinceLastVisit}
                onChange={(e) => setCustomCare((p) => ({ ...p, daysSinceLastVisit: e.target.value }))}
              />
            </label>
          </div>
          <div className="button-row">
            <button className="primary-btn" type="button" onClick={addCustomCare}>
              Add custom service
            </button>
          </div>

          {extraCareServices.length > 0 && (
            <>
              <h4 className="care-subheading">Your extra services</h4>
              <div className="list-stack">
                {extraCareServices.map((svc) => (
                  <article key={svc.id} className="list-card care-extra-card">
                    <div className="care-extra-main">
                      <strong>{svc.name}</strong>
                      <div className="care-extra-fields">
                        <label className="form-field">
                          Interval (days)
                          <input
                            type="number"
                            min={1}
                            value={svc.intervalDays}
                            onChange={(e) => updateExtraCare(svc.id, "intervalDays", e.target.value)}
                          />
                        </label>
                        <label className="form-field">
                          Days since
                          <input
                            type="number"
                            min={0}
                            value={svc.daysSinceLastVisit}
                            onChange={(e) => updateExtraCare(svc.id, "daysSinceLastVisit", e.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                    <button
                      className="secondary-btn"
                      type="button"
                      onClick={() => removeExtraCare(svc.id)}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
        </article>
        </section>

        <aside className="profile-aside" aria-label="Preventive care suggestions">
          <h2 className="page-section-title">Preventive cadence</h2>
          <p className="page-section-lead">Guidance from your age, occupation, and history—no extra chrome.</p>
          <ul className="recommend-open-list">
            {recs.map((rec) => (
              <li key={rec.label}>
                <strong>{rec.label}</strong>
                <span>{rec.cadence}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
