import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll to top on every client-side navigation (no persisted scroll between routes).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}
