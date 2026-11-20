// Display helpers safe to use from both server and client components.
export function stopLine(stop) {
  if (!stop) return "—";
  const name = stop.company?.name;
  const place = [stop.city, stop.state].filter(Boolean).join(", ");
  return [name, place].filter(Boolean).join(" · ") || "—";
}

export function driverName(d) {
  return d ? [d.firstName, d.lastName].filter(Boolean).join(" ") : "—";
}
