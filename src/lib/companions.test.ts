import { describe, it, expect } from "vitest";
import { generateSampleData } from "./sample-data";
import { blankFood } from "./meals";
import { confirmedMeals, foodInsights, mealTimeline } from "./food-insights";
import { activitySchema, activityHistory, saveActivity, nearbyActivityReadings } from "./activity";
import { copilotGrounding, validateSelection } from "./copilot-grounding";
import { renderRecordAnswer } from "./record-answers";
import { accountKey, emptyAccount, sameCloudVersion } from "./persistence";
import { translationsCompanions } from "./translations-companions";
import { translate } from "./i18n";
import type { HealthLog, GlucoseReading } from "./types";
const now = new Date("2026-10-16T12:00:00Z");
const food = { ...blankFood(), name: "Nasi lemak", portion: "one plate", carbohydrates: 50 };
const meal: HealthLog = {
  id: "m",
  timestamp: "2026-10-16T04:00:00Z",
  category: "meal",
  source: "user",
  title: "Lunch",
  meal: {
    items: [food],
    originalItems: [food],
    entrySource: "manual",
    confirmed: true,
    submissionId: "s",
    questions: [],
    uncertainty: [],
  },
};
const reading = (
  minutes: number,
  source: GlucoseReading["source"] = "user",
  context: GlucoseReading["context"] = minutes < 0 ? "before_meal" : "after_meal",
): GlucoseReading => ({
  id: `r${minutes}${source}`,
  timestamp: new Date(Date.parse(meal.timestamp) + minutes * 60000).toISOString(),
  source,
  context,
  value: minutes < 0 ? 6 : 9,
  unit: "mmol/L",
});
const activity: HealthLog = {
  id: "a",
  source: "user",
  category: "activity",
  title: "Walking",
  timestamp: "2026-10-16T03:00:00Z",
  activity: { type: "Walking", duration: 15, intensity: "Not entered", notes: "Private note" },
};
describe("food record associations", () => {
  it("uses schema-confirmed real meals only and retains unknown nutrients", () => {
    const data = generateSampleData(now);
    data.logs = [
      meal,
      { ...meal, id: "sample", source: "sample" },
      { ...meal, id: "invalid", meal: { ...meal.meal!, confirmed: false } as never },
    ];
    expect(confirmedMeals(data.logs, now)).toHaveLength(1);
    expect(foodInsights(data, now).carbs).toBe(50);
    expect(
      foodInsights(
        {
          ...data,
          logs: [{ ...meal, meal: { ...meal.meal!, items: [{ ...food, carbohydrates: null }] } }],
        },
        now,
      ).carbs,
    ).toBeNull();
  });
  it("does not invent missing or simulated readings", () => {
    expect(mealTimeline(meal, [meal], [])).toEqual([]);
    expect(mealTimeline(meal, [meal], [reading(120, "device"), reading(-20, "sample")])).toEqual(
      [],
    );
  });
  it("requires context and non-overlapping timing for before/after labels", () => {
    expect(mealTimeline(meal, [meal], [reading(-20), reading(120)]).map((r) => r.relation)).toEqual(
      ["Before meal", "After meal"],
    );
    expect(mealTimeline(meal, [meal], [reading(120, "user", "random")])[0]?.relation).toContain(
      "uncertain",
    );
    expect(
      mealTimeline(meal, [meal, { ...meal, id: "overlap" }], [reading(120)])[0]?.relation,
    ).toContain("uncertain");
  });
  it("requires three independent comparable pairs before showing associations", () => {
    const data = generateSampleData(now);
    data.logs = [];
    data.readings = [];
    for (let i = 0; i < 3; i++) {
      const shift = i * 86400000;
      data.logs.push({
        ...meal,
        id: `m${i}`,
        timestamp: new Date(Date.parse(meal.timestamp) - shift).toISOString(),
      });
      data.readings.push(
        ...[reading(-20), reading(120)].map((r) => ({
          ...r,
          id: r.id + i,
          timestamp: new Date(Date.parse(r.timestamp) - shift).toISOString(),
        })),
      );
    }
    expect(foodInsights({ ...data, logs: data.logs.slice(0, 1) }, now).patterns).toEqual([]);
    expect(foodInsights(data, now).patterns[0]?.count).toBe(3);
  });
});
describe("structured activities", () => {
  it("creates and edits by ID without duplicating legacy notes", () => {
    const legacy = { ...activity, id: "old", activity: undefined };
    const logs = saveActivity([legacy], activity, now);
    const edited = saveActivity(
      logs,
      { ...activity, activity: { ...activity.activity!, duration: 30 } },
      now,
    );
    expect(edited).toHaveLength(2);
    expect(activityHistory(edited, now, "Asia/Kuala_Lumpur").minutes).toBe(30);
  });
  it.each([0, -1, 1.5, 721, NaN])("rejects invalid duration %s", (duration) =>
    expect(activitySchema.safeParse({ ...activity.activity, duration }).success).toBe(false),
  );
  it("rejects future timestamps and simulated edits", () => {
    expect(() => saveActivity([], { ...activity, timestamp: "2030-01-01" }, now)).toThrow();
    expect(() => saveActivity([{ ...activity, source: "sample" }], activity, now)).toThrow();
  });
  it("shows empty history without inferring old note durations", () => {
    expect(activityHistory([{ ...activity, activity: undefined }], now).minutes).toBe(0);
    expect(activityHistory([], now).today).toEqual([]);
  });
  it("matches nearby manual readings only", () =>
    expect(nearbyActivityReadings(activity, [reading(-20), reading(-20, "device")])).toHaveLength(
      1,
    ));
  it("uses the patient's local date for day summaries", () => {
    const late = { ...activity, timestamp: "2026-10-15T18:00:00Z" };
    expect(activityHistory([late], now, "Asia/Kuala_Lumpur").today).toHaveLength(1);
    expect(activityHistory([late], now, "UTC").today).toHaveLength(0);
  });
});
describe("grounding and compatibility", () => {
  it("compares cloud timestamps across equivalent timezone encodings", () => {
    expect(sameCloudVersion("2026-10-16T00:00:00Z", "2026-10-16T00:00:00+00:00")).toBe(true);
    expect(sameCloudVersion(null, "2026-10-16T00:00:00Z")).toBe(false);
  });
  it("excludes identity, notes, sample records and unconfirmed estimates", () => {
    const data = generateSampleData(now);
    data.logs = [meal, activity];
    data.readings = [reading(120), reading(120, "device")];
    const context = copilotGrounding(data, now);
    const text = JSON.stringify(context);
    expect(context.readings).toHaveLength(1);
    expect(text).not.toContain(data.patient.name);
    expect(text).not.toContain("Private note");
    expect(() =>
      validateSelection({ intent: "meal_glucose", mealIds: ["invented"] }, data),
    ).toThrow();
  });
  it("renders totals from actual records and retains uncertainty", () => {
    const data = generateSampleData(now);
    data.logs = [meal, activity];
    expect(
      renderRecordAnswer(
        { intent: "carbs_today", mealIds: [] },
        data,
        now,
        "en",
        "Asia/Kuala_Lumpur",
      ),
    ).toContain("50 g");
    expect(renderRecordAnswer({ intent: "walking_week", mealIds: [] }, data, now)).toContain("15");
  });
  it("isolates account keys without deleting the legacy demo", () => {
    expect(accountKey(null)).toBe("diamonitor-demo-v1");
    expect(accountKey("a")).not.toBe(accountKey("b"));
    const sample = generateSampleData(now);
    expect(emptyAccount(sample).readings).toEqual([]);
    expect(sample.readings.length).toBeGreaterThan(0);
  });
  it("translates every new interface key in both languages", () => {
    for (const key of Object.keys(translationsCompanions))
      for (const language of ["ms", "zh"] as const) expect(translate(key, language)).not.toBe(key);
  });
});
