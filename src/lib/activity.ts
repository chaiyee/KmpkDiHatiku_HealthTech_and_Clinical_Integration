import { z } from "zod";
import type { HealthLog, GlucoseReading } from "./types";

export const ACTIVITY_TYPES = [
  "Walking",
  "Light exercise",
  "Cycling",
  "Household activities",
  "Other activities",
] as const;
export const activitySchema = z.object({
  type: z.enum(ACTIVITY_TYPES),
  duration: z.number().int().min(1).max(720),
  intensity: z.enum(["Not entered", "Light", "Moderate", "Vigorous"]),
  notes: z.string().max(500),
});
export type ActivityRecord = z.infer<typeof activitySchema>;
export function saveActivity(logs: HealthLog[], log: HealthLog, now = new Date()) {
  const activity = activitySchema.parse(log.activity);
  const time = Date.parse(log.timestamp);
  if (
    log.category !== "activity" ||
    log.source !== "user" ||
    !Number.isFinite(time) ||
    time > now.getTime()
  )
    throw new Error("Invalid activity");
  const existing = logs.find((item) => item.id === log.id);
  if (existing && (existing.source !== "user" || existing.category !== "activity"))
    throw new Error("Invalid activity");
  return [...logs.filter((item) => item.id !== log.id), { ...log, activity }];
}
export function activityHistory(
  logs: HealthLog[],
  now = new Date(),
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  const day = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  const today = day(now);
  const week = new Date(`${today}T00:00:00Z`);
  week.setUTCDate(week.getUTCDate() - 6);
  const records = logs
    .filter(
      (log) =>
        log.source === "user" &&
        log.category === "activity" &&
        activitySchema.safeParse(log.activity).success &&
        Number.isFinite(Date.parse(log.timestamp)) &&
        day(new Date(log.timestamp)) >= week.toISOString().slice(0, 10) &&
        Date.parse(log.timestamp) <= +now,
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return {
    records,
    today: records.filter((log) => day(new Date(log.timestamp)) === today),
    minutes: records.reduce((sum, log) => sum + log.activity!.duration, 0),
  };
}
export function nearbyActivityReadings(log: HealthLog, readings: GlucoseReading[]) {
  if (log.source !== "user" || !activitySchema.safeParse(log.activity).success) return [];
  const end = Date.parse(log.timestamp) + log.activity!.duration * 60000;
  return readings
    .filter(
      (r) =>
        r.source === "user" &&
        Date.parse(r.timestamp) >= Date.parse(log.timestamp) - 3600000 &&
        Date.parse(r.timestamp) <= end + 2 * 3600000,
    )
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
