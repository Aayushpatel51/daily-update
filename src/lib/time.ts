import { Temporal } from "@js-temporal/polyfill";
export function cutoff(now: Date, zone: string) {
  const local = Temporal.Instant.from(now.toISOString()).toZonedDateTimeISO(
    zone,
  );
  let day = local.toPlainDate();
  if (local.hour < 21) day = day.subtract({ days: 1 });
  const end = day.toZonedDateTime({ timeZone: zone, plainTime: "21:00" });
  return {
    date: day.toString(),
    instant: new Date(end.toInstant().toString()),
  };
}
export function quiet(now: Date, zone: string, start: string, end: string) {
  if (!start || !end) return false;
  const z = Temporal.Instant.from(now.toISOString()).toZonedDateTimeISO(zone);
  const value =
    String(z.hour).padStart(2, "0") + ":" + String(z.minute).padStart(2, "0");
  return start < end
    ? value >= start && value < end
    : value >= start || value < end;
}
