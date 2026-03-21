import { useAuth } from "../contexts/AuthContext";

function recommendationFromProfile(age, occupation, medicalHistory) {
  const parsedAge = Number(age || 0);
  const demandingJobs = ["nurse", "construction", "warehouse", "athlete", "firefighter"];
  const history = (medicalHistory || "").toLowerCase();

  return [
    { label: "Dental checkup", cadence: parsedAge > 50 ? "Every 4 months" : "Every 6 months" },
    { label: "Optometry check", cadence: history.includes("diabetes") || parsedAge > 40 ? "Every 12 months" : "Every 24 months" },
    {
      label: "Physical exam",
      cadence: demandingJobs.some((job) => (occupation || "").toLowerCase().includes(job)) ? "Every 6 months" : "Every 12 months",
    },
  ];
}

export default function HealthProfilePage() {
  const { healthProfile, updateProfile } = useAuth();
  const recs = recommendationFromProfile(healthProfile.age, healthProfile.occupation, healthProfile.medicalHistory);
  const onChange = (field) => (e) => updateProfile({ [field]: e.target.value });

  return (
    <div className="two-col-grid">
      <section className="card-surface section-card">
        <h2>Secure Health Profile</h2>
        <p>Fill all required fields for accurate preventive reminders and matching.</p>

        <div className="form-grid">
          <label className="form-field">Age<input type="number" min="0" value={healthProfile.age} onChange={onChange("age")} /></label>
          <label className="form-field">Occupation<input value={healthProfile.occupation} onChange={onChange("occupation")} placeholder="e.g. Teacher" /></label>
          <label className="form-field full">Medical history<textarea rows="3" value={healthProfile.medicalHistory} onChange={onChange("medicalHistory")} placeholder="e.g. Asthma, Diabetes" /></label>
          <label className="form-field">Allergies<input value={healthProfile.allergies} onChange={onChange("allergies")} placeholder="e.g. Penicillin" /></label>
          <label className="form-field">Calendar provider<select value={healthProfile.calendarProvider} onChange={onChange("calendarProvider")}><option>Google</option><option>Outlook</option><option>Apple</option></select></label>
          <label className="form-field full">Favorite clinics<input value={healthProfile.preferredClinics} onChange={onChange("preferredClinics")} placeholder="Clinic names, comma-separated" /></label>
        </div>
      </section>

      <section className="card-surface section-card">
        <h2>Automatic Preventive Updates</h2>
        <div className="recommend-grid">
          {recs.map((rec) => (
            <article key={rec.label} className="recommend-card">
              <strong>{rec.label}</strong>
              <p>{rec.cadence}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
