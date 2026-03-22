/**
 * Application-level defaults — single source of truth for fallback values.
 * Never scatter literal coordinates, city names, or magic strings across components.
 */

/** Default map centre used when the browser denies geolocation (downtown Toronto). */
export const DEFAULT_LOCATION = {
  city: "Toronto",
  lat: 43.6532,
  lng: -79.3832,
};
