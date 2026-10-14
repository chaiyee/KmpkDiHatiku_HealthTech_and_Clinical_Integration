import { describe, expect, it } from "vitest";
import { consultationBrief } from "./consultation";
import { generateSampleData } from "./sample-data";

const now = new Date(2026, 9, 12, 20, 0);
const since = new Date(2026, 9, 10, 0, 0);

describe("consultationBrief", () => {
  it("shows insufficient data for in-range share with fewer than 5 readings", () => {
    const d = { ...generateSampleData(), readings: [] as ReturnType<typeof generateSampleData>["readings"] };
    d.readings = [{ id: "a", timestamp: new Date(2026, 9, 11, 8).toISOString(), value: 6, unit: "mmol/L", context: "fasting", source: "user" }];
    const b = consultationBrief(d, since, now);
    expect(b.count).toBe(1);
    expect(b.inRangePct).toBeNull();
  });
  it("separates skipped and unlogged doses", () => {
    const d = { ...generateSampleData(), readings: [] as ReturnType<typeof generateSampleData>["readings"] };
    d.medicationSchedules = [{ id: "m", name: "Metformin", dose: "500", unit: "mg", time: "08:00", days: [0, 1, 2, 3, 4, 5, 6] }];
    d.medicationStatuses = [
      { scheduleId: "m", date: "2026-10-10", status: "taken", updatedAt: "" },
      { scheduleId: "m", date: "2026-10-11", status: "skipped", reason: "Ran Out", updatedAt: "" },
    ];
    const b = consultationBrief(d, since, now);
    expect(b.taken).toHaveLength(1);
    expect(b.skipped[0]?.reason).toBe("Ran Out");
    expect(b.unlogged.map((u) => u.date)).toEqual(["2026-10-12"]);
  });
});
