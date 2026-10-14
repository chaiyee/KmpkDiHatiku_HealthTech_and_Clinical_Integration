import { describe, expect, it } from "vitest";
import { subDays } from "date-fns";
import { classifyMeal, lateNightImpact, mealImpact, whatIfDinner } from "./insights";
import { DEMO_THRESHOLDS } from "./sample-data";
import type { AppData, GlucoseReading, HealthLog } from "./types";

const now = new Date("2026-10-11T12:00:00Z");

let n = 0;
const reading = (daysAgo: number, h: number, value: number, context: GlucoseReading["context"]): GlucoseReading => ({
  id: `r${n++}`,
  timestamp: new Date(subDays(now, daysAgo).setHours(h, 0, 0, 0)).toISOString(),
  value,
  unit: "mmol/L",
  context,
  source: "sample",
});
const meal = (daysAgo: number, h: number, title: string): HealthLog => ({
  id: `l${n++}`,
  timestamp: new Date(subDays(now, daysAgo).setHours(h, 0, 0, 0)).toISOString(),
  category: "meal",
  title,
  source: "sample",
});
const symptom = (daysAgo: number, h: number, title: string): HealthLog => ({
  id: `l${n++}`,
  timestamp: new Date(subDays(now, daysAgo).setHours(h, 0, 0, 0)).toISOString(),
  category: "symptom",
  title,
  source: "sample",
});

function baseData(readings: GlucoseReading[], logs: HealthLog[]): AppData {
  return {
    patient: { name: "Test", age: 50, sex: "F", diabetesType: "Type 2", yearsSinceDiagnosis: 1, clinic: "c", doctor: "d", nextVisit: now.toISOString() },
    readings,
    logs,
    checkIns: [],
    carePlan: { goal: "", explanation: "", startDate: "2026-01-01", durationDays: 14, followUpDate: now.toISOString(), doctorFeedback: "" },
    doctorNotes: "",
    thresholds: DEMO_THRESHOLDS,
  };
}

describe("classifyMeal", () => {
  it("classifies heavier meals (EN & BM)", () => {
    expect(classifyMeal("Nasi lemak with egg")).toBe("heavier");
    expect(classifyMeal("Mee goreng mamak")).toBe("heavier");
    expect(classifyMeal("Fried chicken")).toBe("heavier");
  });
  it("classifies lighter meals (EN & BM)", () => {
    expect(classifyMeal("Brown rice, ikan bakar, sayur")).toBe("lighter");
    expect(classifyMeal("Vegetable soup with tofu")).toBe("lighter");
  });
  it("ignores unmatched meals", () => {
    expect(classifyMeal("Mystery dish")).toBeUndefined();
  });
});

describe("mealImpact", () => {
  it("is invalid with fewer than 2 pairs per class", () => {
    const logs = [meal(2, 19, "Nasi lemak")];
    const readings = [reading(2, 21, 9.0, "after_meal")];
    const result = mealImpact(baseData(readings, logs), now);
    expect(result.valid).toBe(false);
  });
  it("pairs meals with after-meal readings 30min-4h later, same day, and compares classes", () => {
    const logs = [
      meal(10, 19, "Roti canai"),
      meal(9, 20, "Mee goreng"),
      meal(8, 19, "Brown rice, ikan bakar"),
      meal(7, 19, "Vegetable soup"),
    ];
    const readings = [
      reading(10, 21, 10.5, "after_meal"),
      reading(9, 22, 10.0, "after_meal"),
      reading(8, 21, 8.0, "after_meal"),
      reading(7, 21, 8.5, "after_meal"),
    ];
    const result = mealImpact(baseData(readings, logs), now);
    expect(result.valid).toBe(true);
    expect(result.heavier?.count).toBe(2);
    expect(result.lighter?.count).toBe(2);
    expect(result.heavier!.avg).toBeGreaterThan(result.lighter!.avg);
  });
  it("does not pair a reading outside the 30min-4h window", () => {
    const logs = [meal(5, 19, "Nasi lemak")];
    const readings = [reading(5, 19, 9.0, "after_meal")]; // same time, too soon
    const result = mealImpact(baseData(readings, logs), now);
    expect(result.pairs.length).toBe(0);
  });
});

describe("lateNightImpact", () => {
  it("is invalid with insufficient late nights or other mornings", () => {
    const logs = [symptom(5, 23, "Slept late")];
    const readings = [reading(4, 7, 8.0, "fasting")];
    const result = lateNightImpact(baseData(readings, logs), now);
    expect(result.valid).toBe(false);
  });
  it("compares late-night mornings with others when enough data exists", () => {
    const logs = [symptom(10, 23, "Slept late"), symptom(5, 23, "Tidur lewat")];
    const readings = [
      reading(9, 7, 8.5, "fasting"),
      reading(4, 7, 8.2, "fasting"),
      reading(13, 7, 6.0, "fasting"),
      reading(12, 7, 6.2, "fasting"),
      reading(11, 7, 6.1, "fasting"),
    ];
    const result = lateNightImpact(baseData(readings, logs), now);
    expect(result.valid).toBe(true);
    expect(result.lateNight?.count).toBe(2);
    expect(result.others?.count).toBe(3);
    expect(result.lateNight!.avg).toBeGreaterThan(result.others!.avg);
  });
});

describe("whatIfDinner", () => {
  it("reports insufficient with fewer than 2 pairs", () => {
    const logs = [meal(2, 19, "Nasi lemak")];
    const readings = [reading(2, 21, 9.0, "after_meal")];
    const result = whatIfDinner(baseData(readings, logs), "heavier", now);
    expect(result.status).toBe("insufficient");
  });
  it("returns the own historical range when enough pairs exist", () => {
    const logs = [meal(10, 19, "Roti canai"), meal(9, 19, "Mee goreng")];
    const readings = [reading(10, 21, 10.0, "after_meal"), reading(9, 21, 11.0, "after_meal")];
    const result = whatIfDinner(baseData(readings, logs), "heavier", now);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.min).toBe(10.0);
      expect(result.max).toBe(11.0);
      expect(result.n).toBe(2);
    }
  });
});
