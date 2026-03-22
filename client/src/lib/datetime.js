/**
 * Convert `<input type="date">` + `<input type="time">` values (user's local wall time)
 * to an RFC3339 instant in UTC for APIs and Google Calendar.
 */
export function localDateAndTimeToIsoUtc(dateStr, timeStr) {
  const combined = `${dateStr}T${timeStr}:00`;
  const d = new Date(combined);
  if (Number.isNaN(d.getTime())) return combined;
  return d.toISOString();
}
