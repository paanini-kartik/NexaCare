import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { CARE_SERVICE_PRESETS, CHECKUP_TYPE_META, CORE_CHECKUP_KEYS } from "../data/checkupConfig";
import { getCoreIntervalDays } from "../lib/cadence";

const NO_EXTRAS = [];

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
  const [otherCareName, setOtherCareName] = useState("");

  const checkupSchedule = healthProfile.checkupSchedule;
  const extraCareServices = healthProfile.extraCareServices ?? NO_EXTRAS;

  const extraNamesLower = useMemo(
    () => new Set(extraCareServices.map((e) => e.name.toLowerCase())),
    [extraCareServices]
  );

  /** Preset chips only for services not already in your list (preset or custom name). */
  const availablePresets = useMemo(
    () => CARE_SERVICE_PRESETS.filter((p) => !extraNamesLower.has(p.name.toLowerCase())),
    [extraNamesLower]
  );

  const setCoreLastVisit = (key, iso) => {
    updateProfile({
      checkupSchedule: {
        ...checkupSchedule,
        [key]: { lastVisitISO: iso || null },
      },
    });
  };

  const setExtraLastVisit = (id, iso) => {
    updateProfile({
      extraCareServices: extraCareServices.map((e) =>
        e.id === id ? { ...e, lastVisitISO: iso || null } : e
      ),
    });
  };

  const addPresetCare = (preset) => {
    const n = preset.name.toLowerCase();
    if (extraCareServices.some((e) => e.name.toLowerCase() === n)) return;
    updateProfile({
      extraCareServices: [
        ...extraCareServices,
        { id: crypto.randomUUID(), name: preset.name, kind: "preset", lastVisitISO: null },
      ],
    });
  };

  const addOtherCare = () => {
    const name = otherCareName.trim();
    if (!name) return;
    if (extraCareServices.some((e) => e.name.toLowerCase() === name.toLowerCase())) return;
    updateProfile({
      extraCareServices: [
        ...extraCareServices,
        { id: crypto.randomUUID(), name, kind: "other", lastVisitISO: null },
      ],
    });
    setOtherCareName("");
  };

  const removeExtraCare = (id) => {
    updateProfile({ extraCareServices: extraCareServices.filter((e) => e.id !== id) });
  };

  const intervalHints = useMemo(() => {
    const { age, occupation, medicalHistory } = healthProfile;
    return CORE_CHECKUP_KEYS.reduce((acc, key) => {
      acc[key] = getCoreIntervalDays(age, occupation, medicalHistory, key);
      return acc;
    }, {});
  }, [healthProfile]);

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
    <div className="profile-page profile-page--tight">
      <header className="page-hero page-hero--alive profile-hero-tight">
        <h1>Health profile</h1>
        <p>
          Cadence for preventive care is inferred from what you enter below. Log last visits so dashboard rings stay
          accurate—no manual interval fields.
        </p>
      </header>

      <section className="profile-cadence-first" aria-labelledby="cadence-heading">
        <h2 id="cadence-heading" className="profile-block-title">
          Your preventive cadence
        </h2>
        <p className="profile-cadence-sub">
          Updates automatically when you change age, occupation, or medical history.
        </p>
        <ul className="recommend-open-list profile-cadence-list">
          {recs.map((rec) => (
            <li key={rec.label}>
              <strong>{rec.label}</strong>
              <span>{rec.cadence}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="profile-flow">
        <section className="profile-section">
          <h2 className="profile-block-title">Your information</h2>
          <div className="form-grid profile-form-tight">
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
        </section>

        <section className="profile-section">
          <h3 className="profile-block-title profile-h3">Medical history</h3>
          <div className="form-grid profile-form-tight">
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
          <div className="button-row profile-btn-row">
            <button className="primary-btn" type="button" onClick={addHistoryEvent}>
              Add medical event
            </button>
          </div>
          <div className="list-stack profile-list-tight">
            {sortedHistory.map((event) => (
              <details key={event.id} className="list-card details-card profile-list-flat">
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
        </section>

        <section className="profile-section">
          <h3 className="profile-block-title profile-h3">Allergies</h3>
          <div className="form-grid profile-form-tight">
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
          <div className="button-row profile-btn-row">
            <button className="primary-btn" type="button" onClick={addAllergy}>
              Add allergy
            </button>
          </div>
          <div className="list-stack profile-list-tight">
            {(healthProfile.allergies || []).map((item) => (
              <article key={item.id} className="list-card profile-list-flat">
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
        </section>

        <section className="profile-section">
          <h3 className="profile-block-title profile-h3">Favorite clinics</h3>
          <div className="form-grid profile-form-tight">
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
          <div className="button-row profile-btn-row">
            <button className="primary-btn" type="button" onClick={addClinic}>
              Add favorite clinic
            </button>
          </div>
          <div className="list-stack profile-list-tight">
            {(healthProfile.favoriteClinics || []).map((item) => (
              <article key={item.id} className="list-card profile-list-flat">
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
        </section>

        <section className="profile-section profile-section--wellness" aria-labelledby="wellness-heading">
          <h3 id="wellness-heading" className="profile-block-title profile-h3">
            Visits &amp; optional services
          </h3>
          <p className="profile-wellness-lead">
            Core checkup timing is computed from your profile. Add chiropractic, physio, yoga, massage, or anything
            else—then log a last visit so rings match reality.
          </p>

          <h4 className="profile-mini-heading">Core checkups — last visit</h4>
          <div className="profile-core-rows">
            {CORE_CHECKUP_KEYS.map((key) => {
              const meta = CHECKUP_TYPE_META[key];
              const row = checkupSchedule[key];
              const days = intervalHints[key];
              return (
                <div key={key} className="profile-core-row">
                  <div className="profile-core-main">
                    <span className="profile-core-name">{meta.serviceTitle}</span>
                    <span className="profile-core-hint">Recommended about every {days} days (from profile)</span>
                  </div>
                  <label className="form-field profile-core-date">
                    Last visit
                    <input
                      type="date"
                      value={row?.lastVisitISO || ""}
                      onChange={(e) => setCoreLastVisit(key, e.target.value || null)}
                    />
                  </label>
                </div>
              );
            })}
          </div>

          {availablePresets.length > 0 && (
            <>
              <h4 className="profile-mini-heading">Add wellness &amp; therapy</h4>
              <div className="care-preset-row profile-preset-tight">
                {availablePresets.map((preset) => (
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
            </>
          )}

          <div className="profile-other-row">
            <label className="form-field profile-other-input">
              Other (custom)
              <input
                value={otherCareName}
                onChange={(e) => setOtherCareName(e.target.value)}
                placeholder="e.g. Acupuncture, nutrition coach"
              />
            </label>
            <button className="secondary-btn profile-other-add" type="button" onClick={addOtherCare}>
              Add
            </button>
          </div>

          {extraCareServices.length > 0 && (
            <>
              <h4 className="profile-mini-heading">Your extra services</h4>
              <ul className="profile-extra-list">
                {extraCareServices.map((svc) => (
                  <li key={svc.id} className="profile-extra-item">
                    <div className="profile-extra-top">
                      <strong>{svc.name}</strong>
                      <button
                        className="secondary-btn profile-extra-remove"
                        type="button"
                        onClick={() => removeExtraCare(svc.id)}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                    <label className="form-field profile-extra-date">
                      Last visit
                      <input
                        type="date"
                        value={svc.lastVisitISO || ""}
                        onChange={(e) => setExtraLastVisit(svc.id, e.target.value || null)}
                      />
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
