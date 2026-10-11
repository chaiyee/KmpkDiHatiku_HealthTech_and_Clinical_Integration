import { format } from "date-fns";
import type { GlucoseReading, GlucoseUnit, HealthLog, MedicationEvent, MedicationSchedule } from "./types";

// Health-record service: unit conversion, validation and timeline assembly.

export const MGDL_PER_MMOL = 18.016;
export const MMOL_MIN = 1.1;
export const MMOL_MAX = 33.3;

export const round1 = (x: number) => Math.round(x * 10) / 10;

export function toMmol(value: number, unit: GlucoseUnit): number {
  return unit === "mmol/L" ? round1(value) : round1(value / MGDL_PER_MMOL);
}
export function toMgdl(mmol: number): number {
  return Math.round(mmol * MGDL_PER_MMOL);
}

export const dayKey = (d: Date | string) => format(typeof d === "string" ? new Date(d) : d, "yyyy-MM-dd");

/** Returns a translation key for the first validation problem, or null when valid. */
export type ReadingError =
  | "validation.valueRequired"
  | "validation.valueNumber"
  | "validation.valueRange"
  | "validation.dateInvalid"
  | "validation.dateFuture"
  | "validation.duplicate";

export function validateReading(
  input: { raw: string; unit: GlucoseUnit; timestamp: Date },
  existing: GlucoseReading[],
  now: Date = new Date(),
): { field: "value" | "date"; error: ReadingError } | null {
  const raw = input.raw.trim().replace(",", ".");
  if (!raw) return { field: "value", error: "validation.valueRequired" };
  const v = Number(raw);
  if (!Number.isFinite(v)) return { field: "value", error: "validation.valueNumber" };
  const mmol = toMmol(v, input.unit);
  if (mmol < MMOL_MIN || mmol > MMOL_MAX) return { field: "value", error: "validation.valueRange" };
  const ts = input.timestamp.getTime();
  if (Number.isNaN(ts)) return { field: "date", error: "validation.dateInvalid" };
  if (ts > now.getTime() + 60_000) return { field: "date", error: "validation.dateFuture" };
  const dup = existing.some((r) => Math.abs(new Date(r.timestamp).getTime() - ts) < 5 * 60_000 && Math.abs(r.value - mmol) < 0.05);
  if (dup) return { field: "value", error: "validation.duplicate" };
  return null;
}

export type TimelineKind = "glucose" | "meal" | "symptom" | "activity" | "medication" | "note";

export interface TimelineItem {
  id: string;
  timestamp: string;
  kind: TimelineKind;
  reading?: GlucoseReading | undefined;
  log?: HealthLog | undefined;
  medEvent?: MedicationEvent | undefined;
  schedule?: MedicationSchedule | undefined;
  source: "sample" | "user";
}

export function buildTimeline(
  readings: GlucoseReading[],
  logs: HealthLog[],
  events: MedicationEvent[],
  schedules: MedicationSchedule[],
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...readings.map((r) => ({ id: r.id, timestamp: r.timestamp, kind: "glucose" as const, reading: r, source: r.source })),
    ...logs.map((l) => ({ id: l.id, timestamp: l.timestamp, kind: l.category as TimelineKind, log: l, source: l.source })),
    ...events
      .filter((e) => e.action !== "postponed")
      .map((e) => ({
        id: e.id,
        timestamp: e.actualTime ?? e.recordedAt,
        kind: "medication" as const,
        medEvent: e,
        schedule: schedules.find((s) => s.id === e.scheduleId),
        source: e.source,
      })),
  ];
  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
