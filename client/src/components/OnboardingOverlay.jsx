import { useState } from "react";
import { Rocket } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { onboardingSlides } from "../data/mockData";

export default function OnboardingOverlay() {
  const [step, setStep] = useState(0);
  const { completeOnboardingOverlay, dismissOnboardingOverlay } = useAuth();
  const total = onboardingSlides.length;
  const slide = onboardingSlides[step];

  return (
    <div className="overlay-root" role="dialog" aria-modal="true">
      <section className="overlay-card contained">
        <div className="overlay-head">
          <h2>
            <Rocket size={18} /> Welcome
          </h2>
          <button className="ghost-btn" type="button" onClick={dismissOnboardingOverlay}>
            Close
          </button>
        </div>

        <div className="step-row">
          {Array.from({ length: total }).map((_, idx) => (
            <div key={idx} className={`step-pill ${idx === step ? "active" : ""}`}>
              {idx + 1}
            </div>
          ))}
        </div>

        <h3>{slide.title}</h3>
        <p>{slide.body}</p>

        <div className="overlay-actions">
          <button className="secondary-btn" type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
          {step < total - 1 ? (
            <button className="primary-btn" type="button" onClick={() => setStep((s) => s + 1)}>
              Continue
            </button>
          ) : (
            <button className="primary-btn pulse-glow" type="button" onClick={completeOnboardingOverlay}>
              Finish setup
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
