import { addDays, format, startOfDay } from "date-fns";
import type { MedicationSchedule, MedicationStatus } from "./types";

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const localDay = (now: Date) => format(now, "yyyy-MM-dd");
export const statusFor = (statuses: MedicationStatus[], id: string, date: string) => statuses.find((s) => s.scheduleId === id && s.date === date);
export function scheduledTime(schedule: MedicationSchedule, day: Date) {
  const time = startOfDay(day);
  const [hour, minute] = schedule.time.split(":").map(Number);
  time.setHours(hour ?? 0, minute ?? 0, 0, 0);
  return time;
}
export function reminderFor(schedule: MedicationSchedule, statuses: MedicationStatus[], now: Date) {
  for (let offset = 0; offset <= 7; offset++) {
    const day = addDays(startOfDay(now), offset);
    if (!schedule.days.includes(day.getDay())) continue;
    const status = statusFor(statuses, schedule.id, localDay(day));
    if (status?.status === "taken" || status?.status === "skipped") continue;
    const at = status?.status === "later" && status.remindAt ? new Date(status.remindAt) : scheduledTime(schedule, day);
    return { schedule, at, date: localDay(day), due: at <= now };
  }
  return undefined;
}
export function nextMedication(schedules: MedicationSchedule[], statuses: MedicationStatus[], now: Date) {
  return schedules.map((schedule) => reminderFor(schedule, statuses, now)).filter((r) => r !== undefined).sort((a, b) => a.at.getTime() - b.at.getTime())[0];
}