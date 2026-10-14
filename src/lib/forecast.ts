import { differenceInCalendarDays, format, startOfDay, subDays } from "date-fns";
import type { GlucoseReading, Thresholds } from "./types";

// Transparent straight-line projection from the patient's own recent fasting readings.
// Not a medical prediction; purely descriptive.

export interface ForecastActualPoint {
  date: string; // yyyy-MM-dd
  value: number;
}

export interface ForecastProjectedPoint {
  date: string; // yyyy-MM-dd
  value: number;
  low: number;
  high: number;
}

export interface FastingForecastResult {
  available: boolean;
  reason?: "insufficient_data" | "flat_or_falling";
  actual: ForecastActualPoint[];
  projection: ForecastProjectedPoint[];
  slope?: number;
  band?: number;
  projectedAtVisit?: number;
  aboveThreshold?: boolean;
  visitDate?: string;
}

const round1 = (x: number) => Math.round(x * 10) / 10;

/** Latest fasting reading per calendar day, last `days` days up to `now`. */
function dailyFasting(readings: GlucoseReading[], now: Date, days: number): ForecastActualPoint[] {
  const since = subDays(startOfDay(now), days - 1).getTime();
  const byDay = new Map<string, GlucoseReading>();
  for (const r of readings) {
    if (r.context !== "fasting") continue;
    const t = new Date(r.timestamp).getTime();
    if (t < since || t > now.getTime()) continue;
    const day = format(new Date(r.timestamp), "yyyy-MM-dd");
    const existing = byDay.get(day);
    if (!existing || r.timestamp > existing.timestamp) byDay.set(day, r);
  }
  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, r]) => ({ date, value: r.value }));
}

/** Least-squares fit y = a + b*x, x = day index. */
function leastSquares(points: { x: number; y: number }[]) {
  const n = points.length;
  const meanX = points.reduce((a, p) => a + p.x, 0) / n;
  const meanY = points.reduce((a, p) => a + p.y, 0) / n;
  const num = points.reduce((a, p) => a + (p.x - meanX) * (p.y - meanY), 0);
  const den = points.reduce((a, p) => a + (p.x - meanX) ** 2, 0);
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  const residuals = points.map((p) => p.y - (intercept + slope * p.x));
  const variance = residuals.reduce((a, r) => a + r * r, 0) / n;
  const residualStd = Math.sqrt(variance);
  return { slope, intercept, residualStd };
}

export function fastingForecast(readings: GlucoseReading[], thresholds: Thresholds, now: Date, visitDate: Date): FastingForecastResult {
  const actual = dailyFasting(readings, now, 10);
  if (actual.length < 5) return { available: false, reason: "insufficient_data", actual, projection: [] };

  const base = new Date(actual[0]!.date);
  const points = actual.map((p) => ({ x: differenceInCalendarDays(new Date(p.date), base), y: p.value }));
  const { slope, intercept, residualStd } = leastSquares(points);

  if (slope < 0.1) return { available: false, reason: "flat_or_falling", actual, projection: [], slope: round1(slope) };

  const band = Math.max(0.3, round1(residualStd));
  const lastDay = new Date(actual[actual.length - 1]!.date);
  const daysAhead = Math.min(14, Math.max(0, differenceInCalendarDays(startOfDay(visitDate), lastDay)));
  const projection: ForecastProjectedPoint[] = [];
  for (let d = 0; d <= daysAhead; d++) {
    const date = format(new Date(lastDay.getTime() + d * 86_400_000), "yyyy-MM-dd");
    const x = differenceInCalendarDays(new Date(date), base);
    const value = round1(intercept + slope * x);
    projection.push({ date, value, low: round1(value - band), high: round1(value + band) });
  }
  const projectedAtVisit = projection[projection.length - 1]?.value ?? round1(intercept + slope * (points[points.length - 1]!.x));

  return {
    available: true,
    actual,
    projection,
    slope: round1(slope),
    band,
    projectedAtVisit,
    aboveThreshold: projectedAtVisit > thresholds.fastingHigh,
    visitDate: format(visitDate, "yyyy-MM-dd"),
  };
}
