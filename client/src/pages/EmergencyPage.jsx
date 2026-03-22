import { useState } from "react";
import { ExternalLink, LifeBuoy, Phone, Siren } from "lucide-react";

export default function EmergencyPage() {
  const [show911Note, setShow911Note] = useState(false);

  const script = `This is NexaCare. The person with me may have trouble speaking clearly.

Please use my phone’s location if you can. My allergies and health details are saved in my NexaCare account under this email.

We need emergency medical help. Please send assistance.`;

  return (
    <div className="page-flow emergency-page">
      <header className="emergency-hero">
        <div className="emergency-hero-icon" aria-hidden>
          <Siren size={26} strokeWidth={1.75} />
        </div>
        <h1>Emergency</h1>
        <p className="emergency-hero-lead">
          For a <strong>life-threatening</strong> emergency, call your local emergency number from your phone. NexaCare does
          not replace emergency services.
        </p>
      </header>

      <p className="emergency-coherence-strip" role="note">
        <strong>If you can:</strong> call emergency services first. Use the resources below for non-urgent crisis
        information. The script at the end can help if it’s hard to speak.
      </p>

      <ol className="emergency-steps">
        <li className="emergency-step">
          <div className="emergency-step-head">
            <span className="emergency-step-num">1</span>
            <div>
              <h2 className="emergency-step-title">Emergency services</h2>
              <p className="emergency-step-desc">
                In Canada, dial <strong>911</strong> for police, fire, or ambulance. If you’re travelling, use the local
                emergency number for that country.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="emergency-step-action emergency-step-action--911"
            aria-disabled="true"
            title="Use your phone app to dial"
            onClick={() => setShow911Note(true)}
          >
            <Phone size={20} strokeWidth={1.75} aria-hidden />
            <span>Open phone dialer</span>
          </button>
          {show911Note ? (
            <p className="emergency-step-footnote" role="status">
              Open your phone’s dialer and enter <strong>911</strong> in Canada (or the correct number where you are). This
              button is a reminder—calls are placed from your device, not from the browser.
            </p>
          ) : (
            <p className="emergency-step-footnote emergency-step-footnote--muted">
              Tap for a reminder on how to call.
            </p>
          )}
        </li>

        <li className="emergency-step">
          <div className="emergency-step-head">
            <span className="emergency-step-num">2</span>
            <div>
              <h2 className="emergency-step-title">Crisis and relief resources</h2>
              <p className="emergency-step-desc">
                Guidance from trusted organizations—not a substitute for your local emergency number.
              </p>
            </div>
          </div>
          <a
            className="emergency-step-action emergency-step-action--link"
            href="https://www.redcross.ca/how-we-help/"
            target="_blank"
            rel="noreferrer"
          >
            <LifeBuoy size={20} strokeWidth={1.75} aria-hidden />
            <span>Canadian Red Cross — get help</span>
            <ExternalLink size={16} strokeWidth={1.75} className="emergency-step-external" aria-hidden />
          </a>
        </li>

        <li className="emergency-step emergency-step--last">
          <div className="emergency-step-head">
            <span className="emergency-step-num">3</span>
            <div>
              <h2 className="emergency-step-title" id="emergency-script-heading">
                If speech is difficult
              </h2>
              <p className="emergency-step-desc">
                Read this aloud or show the screen to someone nearby. Add your location out loud when you can.
              </p>
            </div>
          </div>
          <pre className="emergency-script-box" aria-labelledby="emergency-script-heading">
            {script}
          </pre>
        </li>
      </ol>
    </div>
  );
}
