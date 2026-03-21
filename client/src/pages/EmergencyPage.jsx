import { useState } from "react";

export default function EmergencyPage() {
  const [demo911Hint, setDemo911Hint] = useState(false);

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
          <div className="emergency-911-wrap">
            <button
              type="button"
              className="secondary-btn"
              aria-disabled="true"
              title="Demo build — dialing is disabled"
              onClick={(e) => {
                e.preventDefault();
                setDemo911Hint(true);
              }}
            >
              Call 911
            </button>
            {demo911Hint ? (
              <p className="auth-hint" style={{ marginTop: "0.5rem", maxWidth: "28rem" }}>
                Demo: emergency dialing is not connected. In a real emergency, call 911 from your phone.
              </p>
            ) : null}
          </div>
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
