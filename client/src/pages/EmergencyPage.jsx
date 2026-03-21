export default function EmergencyPage() {
  const script = `Hello, this is an automated medical emergency message from NexaCare. The caller may be unable to speak.

Location: [device location placeholder]
Medical notes: allergies and profile details are available in NexaCare.
Please dispatch emergency services immediately.`;

  return (
    <div className="page-flow">
      <header className="page-hero page-hero--alive">
        <h1>Emergency</h1>
        <p>
          When seconds matter, you should not hunt through nested UI. Actions first, then the script block for
          caregivers or dispatch—contained because it is verbatim text, not because we love rectangles.
        </p>
      </header>

      <section className="page-section">
        <div className="button-row emergency-actions">
          <a className="primary-btn" href="https://www.redcross.org/get-help.html" target="_blank" rel="noreferrer">
            Red Cross support
          </a>
          <a className="secondary-btn" href="tel:911">
            Call 911
          </a>
        </div>
      </section>

      <div className="page-divider" role="presentation" />

      <section className="page-section">
        <h2 className="page-section-title">Script for limited speech</h2>
        <p className="page-section-lead">Read aloud or show on screen. Placeholder location until device APIs are wired.</p>
        <pre className="script-box contained-script">{script}</pre>
      </section>
    </div>
  );
}
