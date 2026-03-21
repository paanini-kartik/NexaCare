export default function EmergencyPage() {
  const script = `Hello, this is an automated medical emergency message from NexaCare. The caller may be unable to speak.

Location: [device location placeholder]
Medical notes: allergies and profile details are available in NexaCare.
Please dispatch emergency services immediately.`;

  return (
    <div className="two-col-grid">
      <section className="card-surface section-card">
        <h2>Emergency Support</h2>
        <p>Access urgent channels quickly and safely.</p>
        <div className="button-row">
          <a className="primary-btn" href="https://www.redcross.org/get-help.html" target="_blank" rel="noreferrer">Open Red Cross Support</a>
          <a className="secondary-btn" href="tel:911">Call 911</a>
        </div>
      </section>

      <section className="card-surface section-card">
        <h3>Auto-Generated Emergency Script</h3>
        <pre className="script-box">{script}</pre>
      </section>
    </div>
  );
}
