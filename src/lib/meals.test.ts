import { describe, expect, it } from "vitest";
import {
  blankFood,
  mealRecordSchema,
  nutritionTotals,
  nearbyMealReadings,
  recurringMeals,
  saveConfirmedMeal,
  validateMealImage,
} from "./meals";
import type { AppData, GlucoseReading, HealthLog } from "./types";

const food = {
  ...blankFood(),
  name: "Rice",
  portion: "one plate",
  carbohydrates: 50,
  calories: 300,
};
const record = mealRecordSchema.parse({
  items: [food],
  originalItems: [food],
  entrySource: "manual",
  confirmed: true,
  submissionId: "submission-1",
  uncertainty: [],
  questions: [],
});
const meal: HealthLog = {
  id: "meal-1",
  source: "user",
  category: "meal",
  title: "Chicken rice",
  timestamp: new Date(2026, 9, 15, 12).toISOString(),
  meal: record,
};
function reading(offset: number, source: GlucoseReading["source"], value = 7): GlucoseReading {
  return {
    id: `${offset}-${source}`,
    source,
    context: offset < 0 ? "before_meal" : "after_meal",
    timestamp: new Date(new Date(meal.timestamp).getTime() + offset * 60000).toISOString(),
    value,
    unit: "mmol/L",
  };
}

describe("confirmed meals", () => {
  it("scales individual portions without inventing unknown nutrients", () => {
    const totals = nutritionTotals([
      { ...food, servings: 0.5 },
      { ...food, name: "Chicken", carbohydrates: null, calories: 200 },
    ]);
    expect(totals.carbohydrates).toEqual({ value: 25, complete: false });
    expect(totals.calories).toEqual({ value: 350, complete: true });
    expect(totals.fibre).toEqual({ value: null, complete: false });
  });
  it("keeps zero distinct from unknown", () => {
    expect(nutritionTotals([{ ...food, carbohydrates: 0 }]).carbohydrates).toEqual({
      value: 0,
      complete: true,
    });
  });
  it("prevents duplicate submissions and preserves legacy logs when editing", () => {
    const { meal: ignored, ...legacyFields } = meal;
    const legacy: HealthLog = { ...legacyFields, id: "legacy", title: "Old meal notes" };
    const first = saveConfirmedMeal([legacy], meal);
    expect(saveConfirmedMeal(first, { ...meal, id: "retry" })).toBe(first);
    const changed = saveConfirmedMeal(first, {
      ...meal,
      title: "Updated rice",
      meal: { ...record, items: [{ ...food, servings: 0.5 }] },
    });
    expect(changed).toHaveLength(2);
    expect(changed[0]).toEqual(legacy);
    expect(changed[1]?.meal?.items[0]?.servings).toBe(0.5);
  });
  it("rejects unconfirmed records and editing sample records", () => {
    expect(() =>
      saveConfirmedMeal([], { ...meal, meal: { ...record, confirmed: false } as never }),
    ).toThrow();
    expect(() => saveConfirmedMeal([{ ...meal, source: "sample" }], meal)).toThrow();
  });
  it("separates manual, sample and simulated readings", () => {
    const readings = [
      reading(-30, "user"),
      reading(120, "device"),
      reading(90, "sample"),
      reading(240, "user"),
    ];
    expect(nearbyMealReadings(meal, readings).map((r) => r.source)).toEqual(["user"]);
    expect(
      nearbyMealReadings({ ...meal, source: "sample" }, readings).map((r) => r.source),
    ).toEqual(["sample"]);
  });
  it("requires repeated actual observations and does not infer from simulated data", () => {
    const logs = [0, 1, 2].map((day) => ({
      ...meal,
      id: `m-${day}`,
      timestamp: new Date(new Date(meal.timestamp).getTime() + day * 86400000).toISOString(),
    }));
    const readings = logs.flatMap((log) =>
      [-30, 120].map((offset, i) => ({
        ...reading(offset, "user", i ? 9 : 6),
        id: `${log.id}-${i}`,
        timestamp: new Date(new Date(log.timestamp).getTime() + offset * 60000).toISOString(),
      })),
    );
    expect(recurringMeals({ logs, readings } as AppData)).toHaveLength(1);
    expect(
      recurringMeals({
        logs,
        readings: readings.map((r) => ({ ...r, source: "device" })),
      } as AppData),
    ).toEqual([]);
    expect(recurringMeals({ logs: logs.slice(0, 2), readings } as AppData)).toEqual([]);
    expect(
      recurringMeals({ logs: [...logs, { ...logs[0]!, id: "snack" }], readings } as AppData),
    ).toEqual([]);
  });
  it("validates image signatures and limits rather than trusting extensions", () => {
    expect(
      validateMealImage({ type: "image/jpeg", size: 10 }, new Uint8Array([255, 216, 255])),
    ).toBe(true);
    expect(
      validateMealImage({ type: "image/png", size: 10 }, new Uint8Array([255, 216, 255])),
    ).toBe(false);
    expect(
      validateMealImage(
        { type: "image/jpeg", size: 11 * 1024 * 1024 },
        new Uint8Array([255, 216, 255]),
      ),
    ).toBe(false);
    expect(
      validateMealImage({ type: "image/svg+xml", size: 10 }, new Uint8Array([255, 216, 255])),
    ).toBe(false);
  });
});
