import { addDays, startOfDay } from "date-fns";
import type { AppData } from "./types";
import { localDay, scheduledTime } from "./medications";

/** Facts for the 30-second brief, computed only from recorded data. No estimates (e.g. HbA1c) or scores. */
export function consultationBrief(data: AppData, since: Date, now: Date) {
  const readings = data.readings.filter((r) => { const d = new Date(r.timestamp); return d >= since && d <= now; });
  const vals = readings.map((r) => r.value);
  const t = data.thresholds;
  const inRange = readings.filter((r) => r.value >= t.hypo && r.value <= (r.context === "fasting" ? t.fastingHigh : t.postMealHigh)).length;
  const from = localDay(since), to = localDay(now);
  const statuses = (data.medicationStatuses ?? []).filter((s) => s.date >= from && s.date <= to);
  const unlogged: { scheduleId: string; date: string }[] = [];
  for (const s of data.medicationSchedules ?? []) {
    for (let day = startOfDay(since); day <= now; day = addDays(day, 1)) {
      if (!s.days.includes(day.getDay()) || scheduledTime(s, day) > now) continue;
      const date = localDay(day);
      if (!statuses.some((x) => x.scheduleId === s.id && x.date === date)) unlogged.push({ scheduleId: s.id, date });
    }
  }
  return {
    count: readings.length,
    average: vals.length ? vals.reduce((a, c) => a + c, 0) / vals.length : null,
    lowest: vals.length ? Math.min(...vals) : null,
    highest: vals.length ? Math.max(...vals) : null,
    // Needs a minimum of readings to be meaningful; otherwise "Insufficient data".
    inRangePct: readings.length >= 5 ? Math.round((inRange / readings.length) * 100) : null,
    taken: statuses.filter((s) => s.status === "taken"),
    skipped: statuses.filter((s) => s.status === "skipped"),
    unlogged,
  };
}
