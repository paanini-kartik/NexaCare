export function getAppointmentStatus(appointment, now = new Date()) {
  const explicit = String(appointment?.status ?? "").toLowerCase();
  if (explicit === "upcoming" || explicit === "past" || explicit === "cancelled") {
    return explicit;
  }

  const date = appointment?.date ? new Date(appointment.date) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return date >= now ? "upcoming" : "past";
}

export function sortAppointmentsByDate(appointments = []) {
  return [...appointments].sort((left, right) => {
    const leftDate = new Date(left?.date ?? 0).getTime();
    const rightDate = new Date(right?.date ?? 0).getTime();
    return leftDate - rightDate;
  });
}
