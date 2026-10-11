import { describe, expect, it } from "vitest";
import { subDays, subHours } from "date-fns";
import { detectPatterns } from "./patterns";
import { DEMO_THRESHOLDS } from "./sample-data";
import type { GlucoseReading } from "./types";

const now = new Date("2026-10-11T12:00:00Z");
const reading = (daysAgo: number, value: number, context: GlucoseReading["context"] = "fasting"): GlucoseReading => ({
  id: `${daysAgo}-${value}`,
  timestamp: subHours(subDays(now, daysAgo), 4).toISOString(),
  value,
  unit: "mmol/L",
  context,
  source: "sample",
});

describe("pattern rules", () => {
  it("flags 3 fasting readings above 7.0 mmol/L", () => {
    const f = detectPatterns([reading(1, 7.5), reading(2, 7.8), reading(3, 8.1)], DEMO_THRESHOLDS, now);
    expect(f.some((x) => x.id === "repeated-fasting")).toBe(true);
  });
  it("does not flag only 2 high fasting readings", () => {
    const f = detectPatterns([reading(1, 7.5), reading(2, 7.8), reading(3, 6.1)], DEMO_THRESHOLDS, now);
    expect(f.some((x) => x.id === "repeated-fasting")).toBe(false);
  });
  it("raises a safety alert for a reading below 3.9 mmol/L", () => {
    const f = detectPatterns([reading(1, 3.5, "random")], DEMO_THRESHOLDS, now);
    expect(f[0]?.id).toBe("safety-low");
  });
  it("reports insufficient baseline with fewer than 5 earlier readings", () => {
    const f = detectPatterns([reading(10, 6), reading(1, 8), reading(2, 8), reading(3, 8)], DEMO_THRESHOLDS, now);
    expect(f.some((x) => x.id === "baseline-insufficient")).toBe(true);
  });
  it("detects baseline shift of at least 1.0 mmol/L", () => {
    const early = [9, 10, 11, 12, 13].map((d) => reading(d, 6.0));
    const recent = [1, 2, 3].map((d) => reading(d, 7.2));
    const f = detectPatterns([...early, ...recent], DEMO_THRESHOLDS, now);
    expect(f.some((x) => x.id === "baseline-shift")).toBe(true);
  });
});
