import { format, subDays } from "date-fns";
import type { GlucoseReading, Thresholds } from "./types";

// Transparent, deterministic rule-based pattern detection. No language model is involved.
// Text for each finding lives in the translation files under patterns.<id>.{title,summary,rule,sufficiency,next}.

export type FindingSeverity = "info" | "watch" | "alert";
export type FindingId =
  | "safety-low"
  | "safety-high"
  | "repeated-fasting"
  | "repeated-postmeal"
  | "baseline-shift"
  | "baseline-insufficient"
  | "insufficient-data"
  | "data-gap"
  | "unusual-entry";

export interface PatternFinding {
  id: FindingId;
  kind: "safety" | "repeated_high" | "baseline_shift" | "data_gap" | "data_quality";
  severity: FindingSeverity;
  params: Record<string, string | number>;
  evidence: GlucoseReading[];
  dates?: string[] | undefined; // yyyy-MM-dd (e.g. days without readings)
  sufficient: boolean; // whether the rule had enough data to be meaningful
}

export interface Baseline {
  sufficient: boolean;
  baselineMean?: number | undefined;
  recentMean?: number | undefined;
  baselineCount: number;
  recentCount: number;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round1 = (x: number) => Math.round(x * 10) / 10;
const ts = (r: GlucoseReading) => new Date(r.timestamp).getTime();

export function fastingBaseline(readings: GlucoseReading[], t: Thresholds, now: Date): Baseline {
  const recentStart = subDays(now, 7).getTime();
  const baselineStart = subDays(now, 28).getTime();
  const fasting = readings.filter((r) => r.context === "fasting" && ts(r) <= now.getTime());
  const recent = fasting.filter((r) => ts(r) >= recentStart);
  const base = fasting.filter((r) => ts(r) >= baselineStart && ts(r) < recentStart);
  const sufficient = base.length >= t.baselineMinReadings && recent.length >= 3;
  return {
    sufficient,
    baselineCount: base.length,
    recentCount: recent.length,
    baselineMean: base.length ? round1(mean(base.map((r) => r.value))) : undefined,
    recentMean: recent.length ? round1(mean(recent.map((r) => r.value))) : undefined,
  };
}

/** "Above range on X of the last N recorded mornings" — used by the Overview insight. */
export function morningSummary(readings: GlucoseReading[], t: Thresholds, now: Date = new Date(), n = 5) {
  const mornings = readings
    .filter((r) => r.context === "fasting" && ts(r) <= now.getTime())
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, n);
  const above = mornings.filter((r) => r.value > t.fastingHigh);
  return { total: mornings.length, above: above.length, evidence: mornings, threshold: t.fastingHigh };
}

export function detectPatterns(readings: GlucoseReading[], t: Thresholds, now: Date = new Date()): PatternFinding[] {
  const findings: PatternFinding[] = [];
  const recentStart = subDays(now, 7).getTime();
  const recent = readings
    .filter((r) => ts(r) >= recentStart && ts(r) <= now.getTime())
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // 1. Safety (deterministic thresholds; demo values pending clinician configuration)
  const low = recent.filter((r) => r.value < t.hypo);
  const veryHigh = recent.filter((r) => r.value > t.severeHigh);
  if (low.length)
    findings.push({ id: "safety-low", kind: "safety", severity: "alert", params: { n: low.length, hypo: t.hypo }, evidence: low, sufficient: true });
  if (veryHigh.length)
    findings.push({ id: "safety-high", kind: "safety", severity: "alert", params: { n: veryHigh.length, high: t.severeHigh }, evidence: veryHigh, sufficient: true });

  // 0. Insufficient data overall
  if (recent.length < 3) {
    findings.push({ id: "insufficient-data", kind: "data_gap", severity: "info", params: { n: recent.length }, evidence: recent, sufficient: false });
  }

  // 2. Repeated out-of-range (morning / evening)
  const highFasting = recent.filter((r) => r.context === "fasting" && r.value > t.fastingHigh);
  if (highFasting.length >= t.minRepeated)
    findings.push({
      id: "repeated-fasting",
      kind: "repeated_high",
      severity: "watch",
      params: { n: highFasting.length, total: recent.filter((r) => r.context === "fasting").length, high: t.fastingHigh, min: t.minRepeated },
      evidence: highFasting,
      sufficient: true,
    });
  const highPost = recent.filter((r) => (r.context === "after_meal" || r.context === "bedtime") && r.value > t.postMealHigh);
  if (highPost.length >= t.minRepeated)
    findings.push({
      id: "repeated-postmeal",
      kind: "repeated_high",
      severity: "watch",
      params: { n: highPost.length, high: t.postMealHigh, min: t.minRepeated },
      evidence: highPost,
      sufficient: true,
    });

  // 3. Change from personal baseline
  const b = fastingBaseline(readings, t, now);
  if (b.sufficient && b.recentMean! - b.baselineMean! >= t.baselineShift) {
    findings.push({
      id: "baseline-shift",
      kind: "baseline_shift",
      severity: "watch",
      params: {
        recent: b.recentMean!,
        base: b.baselineMean!,
        diff: round1(b.recentMean! - b.baselineMean!),
        shift: t.baselineShift,
        min: t.baselineMinReadings,
        nb: b.baselineCount,
        nr: b.recentCount,
      },
      evidence: recent.filter((r) => r.context === "fasting"),
      sufficient: true,
    });
  } else if (!b.sufficient) {
    findings.push({
      id: "baseline-insufficient",
      kind: "baseline_shift",
      severity: "info",
      params: { nb: b.baselineCount, nr: b.recentCount, min: t.baselineMinReadings },
      evidence: [],
      sufficient: false,
    });
  }

  // 4. Unusual / inconsistent entries: jump > 8 mmol/L within 1 hour (likely entry or unit error)
  const unusual: GlucoseReading[] = [];
  for (let i = 1; i < recent.length; i++) {
    const a = recent[i - 1]!;
    const c = recent[i]!;
    if (ts(c) - ts(a) <= 60 * 60_000 && Math.abs(c.value - a.value) > 8) unusual.push(a, c);
  }
  if (unusual.length)
    findings.push({ id: "unusual-entry", kind: "data_quality", severity: "info", params: { n: unusual.length }, evidence: unusual, sufficient: true });

  // 5. Data gaps (missing data is never treated as deterioration)
  const days = Array.from({ length: 7 }, (_, i) => format(subDays(now, i + 1), "yyyy-MM-dd"));
  const logged = new Set(recent.map((r) => format(new Date(r.timestamp), "yyyy-MM-dd")));
  const missing = days.filter((d) => !logged.has(d)).reverse();
  if (missing.length)
    findings.push({ id: "data-gap", kind: "data_gap", severity: "info", params: { n: missing.length }, evidence: [], dates: missing, sufficient: false });

  const order: Record<FindingSeverity, number> = { alert: 0, watch: 1, info: 2 };
  return findings.sort((a, b) => order[a.severity] - order[b.severity]);
}
