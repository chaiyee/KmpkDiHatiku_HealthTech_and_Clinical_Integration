import { describe, expect, it } from "vitest";
import { subDays } from "date-fns";
import { fastingForecast } from "./forecast";
import { DEMO_THRESHOLDS } from "./sample-data";
import type { GlucoseReading } from "./types";

const now = new Date("2026-10-11T12:00:00Z");
let n = 0;
const reading = (daysAgo: number, value: number): GlucoseReading => ({
  id: `r${n++}`,
  timestamp: new Date(subDays(now, daysAgo).setHours(7, 0, 0, 0)).toISOString(),
  value,
  unit: "mmol/L",
  context: "fasting",
  source: "sample",
});

describe("fastingForecast", () => {
  it("is unavailable with fewer than 5 days of fasting data", () => {
    const readings = [reading(1, 7), reading(2, 7.2), reading(3, 7.1)];
    const result = fastingForecast(readings, DEMO_THRESHOLDS, now, subDays(now, -5));
    expect(result.available).toBe(false);
    expect(result.reason).toBe("insufficient_data");
  });
  it("is unavailable when the trend is flat or falling", () => {
    const readings = [reading(5, 7.0), reading(4, 6.9), reading(3, 7.0), reading(2, 6.95), reading(1, 7.0)];
    const result = fastingForecast(readings, DEMO_THRESHOLDS, now, subDays(now, -5));
    expect(result.available).toBe(false);
    expect(result.reason).toBe("flat_or_falling");
  });
  it("produces a rising projection with uncertainty band and visit-date value", () => {
    const readings = [reading(6, 6.4), reading(5, 6.8), reading(4, 7.2), reading(3, 7.6), reading(2, 8.0), reading(1, 8.4)];
    const visitDate = subDays(now, -5); // 5 days ahead
    const result = fastingForecast(readings, DEMO_THRESHOLDS, now, visitDate);
    expect(result.available).toBe(true);
    expect(result.slope).toBeGreaterThanOrEqual(0.1);
    expect(result.projectedAtVisit).toBeDefined();
    expect(result.band).toBeGreaterThanOrEqual(0.3);
    expect(result.aboveThreshold).toBe(true);
    expect(result.projection.length).toBeGreaterThan(0);
  });
  it("caps projection at 14 days ahead even if the visit is further away", () => {
    const readings = [reading(6, 6.4), reading(5, 6.8), reading(4, 7.2), reading(3, 7.6), reading(2, 8.0), reading(1, 8.4)];
    const visitDate = subDays(now, -30);
    const result = fastingForecast(readings, DEMO_THRESHOLDS, now, visitDate);
    expect(result.available).toBe(true);
    const lastProjected = result.projection[result.projection.length - 1]!;
    const firstDay = new Date(result.projection[0]!.date);
    const lastDay = new Date(lastProjected.date);
    const diffDays = Math.round((lastDay.getTime() - firstDay.getTime()) / 86_400_000);
    expect(diffDays).toBeLessThanOrEqual(14);
  });
});
