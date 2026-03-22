/**
 * Shared API helper.
 * Set VITE_API_BASE_URL in .env to point at the backend.
 * Defaults to "" (same-origin) so a reverse-proxy deploy works automatically.
 */

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
}

/** Build a full URL for a backend path like "/api/appointments/foo" */
export function apiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

/** fetch wrapper that prepends the base URL */
export async function apiFetch(path, init) {
  return fetch(apiUrl(path), init);
}
