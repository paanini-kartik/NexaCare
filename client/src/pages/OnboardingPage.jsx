import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { onboardingSlides } from "../data/mockData";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [index, setIndex] = useState(0);

  const slide = useMemo(() => onboardingSlides[index], [index]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section className="card hero">
      <span className="badge">
        Slide {index + 1} / {onboardingSlides.length}
      </span>
      <h1>{slide.title}</h1>
      <p>{slide.body}</p>

      <div className="slide-controls">
        <button
          className="secondary"
          type="button"
          onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
          disabled={index === 0}
        >
          Back
        </button>

        {index < onboardingSlides.length - 1 ? (
          <button className="primary" type="button" onClick={() => setIndex((prev) => prev + 1)}>
            Next
          </button>
        ) : (
          <button className="primary" type="button" onClick={() => navigate("/auth")}>
            Login / Create account
          </button>
        )}
      </div>
    </section>
  );
}
