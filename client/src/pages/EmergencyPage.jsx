import { useState } from "react";
import { ExternalLink, LifeBuoy, Phone, Siren } from "lucide-react";

export default function EmergencyPage() {
  const [show911DemoNote, setShow911DemoNote] = useState(false);

  const script = `This is an automated message from NexaCare. The person with me may be unable to speak clearly.

My location: [not available in this app version — please ask dispatch to use caller location if possible.]
Medical context: my allergies and health profile are in the NexaCare app under this account.

We need emergency medical help now. Please dispatch.`;

  return (
    <div className="page-flow emergency-page">
      <header className="emergency-hero">
        <div className="emergency-hero-icon" aria-hidden>
          <Siren size={26} strokeWidth={1.75} />
        </div>
        <h1>Emergency help</h1>
        <p className="emergency-hero-lead">
          For a <strong>life-threatening</strong> emergency, call your local emergency number from your phone. NexaCare does
          not replace emergency services and cannot place emergency calls in this build.
        </p>
      </header>

      <p className="emergency-coherence-strip" role="note">
        <strong>How to use this page:</strong> (1) Call emergency services. (2) Use Red Cross links if you need general
        crisis resources. (3) Use the script below if you or someone with you cannot speak easily.
      </p>

      <ol className="emergency-steps">
        <li className="emergency-step">
          <div className="emergency-step-head">
            <span className="emergency-step-num">1</span>
            <div>
              <h2 className="emergency-step-title">Emergency services</h2>
              <p className="emergency-step-desc">North America: dial <strong>911</strong>. Elsewhere: use your country&apos;s emergency number.</p>
            </div>
          </div>
          <button
            type="button"
            className="emergency-step-action emergency-step-action--911"
            aria-disabled="true"
            title="Demo — not connected to the phone dialer"
            onClick={() => setShow911DemoNote(true)}
          >
            <Phone size={20} strokeWidth={1.75} aria-hidden />
            <span>Open 911 (demo only)</span>
          </button>
          {show911DemoNote ? (
            <p className="emergency-step-footnote" role="status">
              This button is a placeholder. On your real device, open the phone app and dial <strong>911</strong> (or your
              local equivalent).
            </p>
          ) : (
            <p className="emergency-step-footnote emergency-step-footnote--muted">
              Tap the button to see why it doesn&apos;t dial in the demo.
            </p>
          )}
        </li>

        <li className="emergency-step">
          <div className="emergency-step-head">
            <span className="emergency-step-num">2</span>
            <div>
              <h2 className="emergency-step-title">Crisis &amp; relief resources</h2>
              <p className="emergency-step-desc">Guidance and support from the Red Cross—not a substitute for 911.</p>
            </div>
          </div>
          <a
            className="emergency-step-action emergency-step-action--link"
            href="https://www.redcross.org/get-help.html"
            target="_blank"
            rel="noreferrer"
          >
            <LifeBuoy size={20} strokeWidth={1.75} aria-hidden />
            <span>Red Cross — get help</span>
            <ExternalLink size={16} strokeWidth={1.75} className="emergency-step-external" aria-hidden />
          </a>
        </li>

        <li className="emergency-step emergency-step--last">
          <div className="emergency-step-head">
            <span className="emergency-step-num">3</span>
            <div>
              <h2 className="emergency-step-title" id="emergency-script-heading">
                Script if speech is difficult
              </h2>
              <p className="emergency-step-desc">
                Read this aloud or show the screen to a bystander or dispatcher. Location line is a placeholder until device
                location is wired in.
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
