import { format, subDays } from "date-fns";
import type { GlucoseReading, Thresholds } from "./types";

// Transparent, deterministic rule-based pattern detection. No language model is involved.

export type FindingSeverity = "info" | "watch" | "alert";

export interface PatternFinding {
  id: string;
  kind: "safety" | "repeated_high" | "baseline_shift" | "data_gap";
  severity: FindingSeverity;
  title: string;
  summary: string;
  rule: string;
  evidence: GlucoseReading[];
  uncertainty?: string | undefined;
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

export function fastingBaseline(readings: GlucoseReading[], t: Thresholds, now: Date): Baseline {
  const recentStart = subDays(now, 7).getTime();
  const baselineStart = subDays(now, 28).getTime();
  const fasting = readings.filter((r) => r.context === "fasting");
  const recent = fasting.filter((r) => new Date(r.timestamp).getTime() >= recentStart);
  const base = fasting.filter((r) => {
    const ts = new Date(r.timestamp).getTime();
    return ts >= baselineStart && ts < recentStart;
  });
  const sufficient = base.length >= t.baselineMinReadings && recent.length >= 3;
  return {
    sufficient,
    baselineCount: base.length,
    recentCount: recent.length,
    baselineMean: base.length ? round1(mean(base.map((r) => r.value))) : undefined,
    recentMean: recent.length ? round1(mean(recent.map((r) => r.value))) : undefined,
  };
}

export function detectPatterns(readings: GlucoseReading[], t: Thresholds, now: Date = new Date()): PatternFinding[] {
  const findings: PatternFinding[] = [];
  const recentStart = subDays(now, 7).getTime();
  const recent = readings
    .filter((r) => new Date(r.timestamp).getTime() >= recentStart && new Date(r.timestamp) <= now)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // 1. Safety (deterministic)
  const low = recent.filter((r) => r.value < t.hypo);
  const veryHigh = recent.filter((r) => r.value > t.severeHigh);
  if (low.length) {
    findings.push({
      id: "safety-low",
      kind: "safety",
      severity: "alert",
      title: `${low.length} low reading${low.length > 1 ? "s" : ""} recorded`,
      summary:
        "A reading below the demo low threshold was recorded. If you feel shaky, sweaty, confused or unwell, follow your clinic's low-glucose advice or seek urgent care (999 in Malaysia).",
      rule: `Any reading below ${t.hypo} mmol/L in the last 7 days.`,
      evidence: low,
    });
  }
  if (veryHigh.length) {
    findings.push({
      id: "safety-high",
      kind: "safety",
      severity: "alert",
      title: `${veryHigh.length} very high reading${veryHigh.length > 1 ? "s" : ""} recorded`,
      summary:
        "A reading above the demo very-high threshold was recorded. If you feel very unwell, are vomiting or drowsy, seek urgent medical care (999 in Malaysia).",
      rule: `Any reading above ${t.severeHigh} mmol/L in the last 7 days.`,
      evidence: veryHigh,
    });
  }

  // 2. Repeated readings above range
  const highFasting = recent.filter((r) => r.context === "fasting" && r.value > t.fastingHigh);
  if (highFasting.length >= t.minRepeated) {
    findings.push({
      id: "repeated-fasting",
      kind: "repeated_high",
      severity: "watch",
      title: "Morning (fasting) readings above range on several days",
      summary: `${highFasting.length} fasting readings in the last 7 days were above ${t.fastingHigh} mmol/L.`,
      rule: `At least ${t.minRepeated} fasting readings above ${t.fastingHigh} mmol/L within 7 days.`,
      evidence: highFasting,
    });
  }
  const highPost = recent.filter((r) => r.context === "after_meal" && r.value > t.postMealHigh);
  if (highPost.length >= t.minRepeated) {
    findings.push({
      id: "repeated-postmeal",
      kind: "repeated_high",
      severity: "watch",
      title: "After-meal readings above range on several days",
      summary: `${highPost.length} after-meal readings in the last 7 days were above ${t.postMealHigh} mmol/L.`,
      rule: `At least ${t.minRepeated} after-meal readings above ${t.postMealHigh} mmol/L within 7 days.`,
      evidence: highPost,
    });
  }

  // 3. Baseline comparison
  const b = fastingBaseline(readings, t, now);
  if (b.sufficient && b.recentMean! - b.baselineMean! >= t.baselineShift) {
    findings.push({
      id: "baseline-shift",
      kind: "baseline_shift",
      severity: "watch",
      title: "Fasting average higher than your usual",
      summary: `Your recent fasting average is ${b.recentMean} mmol/L, compared with your earlier average of ${b.baselineMean} mmol/L (+${round1(b.recentMean! - b.baselineMean!)}).`,
      rule: `Recent 7-day fasting average is at least ${t.baselineShift} mmol/L above the average of the previous 3 weeks (needs ≥${t.baselineMinReadings} earlier readings).`,
      evidence: recent.filter((r) => r.context === "fasting"),
    });
  } else if (!b.sufficient) {
    findings.push({
      id: "baseline-insufficient",
      kind: "baseline_shift",
      severity: "info",
      title: "Not enough data for a personal baseline yet",
      summary: `Found ${b.baselineCount} earlier fasting readings and ${b.recentCount} recent ones.`,
      rule: `Needs at least ${t.baselineMinReadings} earlier and 3 recent fasting readings.`,
      evidence: [],
      uncertainty: "We can't compare with your usual levels until more readings are recorded.",
    });
  }

  // 4. Data gaps
  const days = Array.from({ length: 7 }, (_, i) => format(subDays(now, i + 1), "yyyy-MM-dd"));
  const logged = new Set(recent.map((r) => format(new Date(r.timestamp), "yyyy-MM-dd")));
  const missing = days.filter((d) => !logged.has(d));
  if (missing.length) {
    findings.push({
      id: "data-gap",
      kind: "data_gap",
      severity: "info",
      title: `${missing.length} day${missing.length > 1 ? "s" : ""} without readings`,
      summary: `No readings on ${missing.map((d) => format(new Date(d), "d MMM")).join(", ")}.`,
      rule: "Checks each of the last 7 full days for at least one reading.",
      evidence: [],
      uncertainty: "Patterns may be less reliable when days are missing.",
    });
  }

  const order: Record<FindingSeverity, number> = { alert: 0, watch: 1, info: 2 };
  return findings.sort((a, b) => order[a.severity] - order[b.severity]);
}
