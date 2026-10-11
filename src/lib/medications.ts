import { addDays, differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import type { DoseStatus, MedicationEvent, MedicationSchedule } from "./types";

// Medication reminder service. Records are self-reported: "taken" means the patient
// recorded it as taken, and a missing log never means a dose was missed.

export interface Dose {
  key: string; // scheduleId|date|time
  schedule: MedicationSchedule;
  date: string;
  time: string;
  at: Date;
  status: DoseStatus;
  event?: MedicationEvent | undefined;
}

export function isScheduledOn(s: MedicationSchedule, date: string): boolean {
  if (date < s.startDate) return false;
  if (s.endDate && date > s.endDate) return false;
  if (s.frequency === "weekly") return differenceInCalendarDays(parseISO(date), parseISO(s.startDate)) % 7 === 0;
  return true;
}

export function latestEvent(events: MedicationEvent[], scheduleId: string, date: string, time: string) {
  return events
    .filter((e) => e.scheduleId === scheduleId && e.date === date && e.scheduledTime === time)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
}

export function doseStatus(at: Date, ev: MedicationEvent | undefined, now: Date): DoseStatus {
  if (ev?.action === "taken" || ev?.action === "skipped") return ev.action;
  if (ev?.action === "postponed") return "postponed";
  return at.getTime() > now.getTime() ? "scheduled" : "not_logged";
}

export function dosesForDate(schedules: MedicationSchedule[], events: MedicationEvent[], date: string, now: Date, includePaused = false): Dose[] {
  const out: Dose[] = [];
  for (const s of schedules) {
    if (s.paused && !includePaused) continue;
    if (!isScheduledOn(s, date)) continue;
    for (const time of s.times) {
      const at = new Date(`${date}T${time}`);
      const ev = latestEvent(events, s.id, date, time);
      out.push({ key: `${s.id}|${date}|${time}`, schedule: s, date, time, at, event: ev, status: doseStatus(at, ev, now) });
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** The dose to show on the reminder card: due/postponed first, else the next scheduled one (today or tomorrow). */
export function nextReminder(schedules: MedicationSchedule[], events: MedicationEvent[], now: Date): Dose | undefined {
  const today = format(now, "yyyy-MM-dd");
  const doses = dosesForDate(schedules, events, today, now);
  const pending = doses.find((d) => d.status === "postponed" && d.event?.postponedUntil && new Date(d.event.postponedUntil) <= now)
    ?? doses.find((d) => d.status === "not_logged" && now.getTime() - d.at.getTime() < 6 * 3600_000)
    ?? doses.find((d) => d.status === "postponed")
    ?? doses.find((d) => d.status === "scheduled");
  if (pending) return pending;
  return dosesForDate(schedules, events, format(addDays(now, 1), "yyyy-MM-dd"), now)[0];
}

/** Doses that should trigger an in-app reminder right now. */
export function dueReminders(schedules: MedicationSchedule[], events: MedicationEvent[], now: Date): Dose[] {
  const today = format(now, "yyyy-MM-dd");
  return dosesForDate(schedules, events, today, now).filter((d) => {
    if (d.status === "not_logged") return now.getTime() - d.at.getTime() < 60 * 60_000; // within the first hour
    if (d.status === "postponed") return !!d.event?.postponedUntil && new Date(d.event.postponedUntil) <= now;
    return false;
  });
}

export interface WeeklySummary {
  total: number;
  taken: number;
  skipped: number;
  postponed: number;
  notLogged: number;
}

export function weeklySummary(schedules: MedicationSchedule[], events: MedicationEvent[], now: Date, days = 7): WeeklySummary {
  const s: WeeklySummary = { total: 0, taken: 0, skipped: 0, postponed: 0, notLogged: 0 };
  for (let i = 0; i < days; i++) {
    const date = format(subDays(now, i), "yyyy-MM-dd");
    for (const d of dosesForDate(schedules, events, date, now)) {
      if (d.status === "scheduled") continue;
      s.total++;
      if (d.status === "taken") s.taken++;
      else if (d.status === "skipped") s.skipped++;
      else if (d.status === "postponed") s.postponed++;
      else s.notLogged++;
    }
  }
  return s;
}
