import { describe, expect, it } from "vitest";
import { mealCopilotAnswer } from "./meal-copilot";
import { blankFood } from "./meals";
import type { AppData } from "./types";
const now = new Date(2026, 9, 15, 15);
const food = { ...blankFood(), name: "Rice", portion: "plate", carbohydrates: 50 };
const meal = {
  id: "meal",
  category: "meal",
  source: "user",
  title: "Rice",
  timestamp: new Date(2026, 9, 15, 12).toISOString(),
  meal: {
    items: [food],
    originalItems: [food],
    entrySource: "manual",
    confirmed: true,
    submissionId: "one",
    uncertainty: [],
    questions: [],
  },
};
describe("meal record answers", () => {
  it("counts only confirmed user records and marks partial intake", () => {
    const data = {
      logs: [
        meal,
        { ...meal, id: "sample", source: "sample" },
        {
          ...meal,
          id: "unknown",
          meal: { ...meal.meal, items: [{ ...food, carbohydrates: null }] },
        },
        { ...meal, id: "unconfirmed", meal: { ...meal.meal, confirmed: false } },
      ],
      readings: [],
    } as unknown as AppData;
    const text = mealCopilotAnswer("How many carbohydrates did I eat today?", data, now)!;
    expect(text).toContain("2 confirmed");
    expect(text).toContain("50 g");
    expect(text).toContain("partial sum");
  });
  it("does not infer from simulated readings or fabricate legacy nutrition", () => {
    const data = {
      logs: [{ ...meal, meal: undefined }],
      readings: [{ id: "device", source: "device", timestamp: now.toISOString(), value: 9 }],
    } as unknown as AppData;
    expect(mealCopilotAnswer("What did I eat before my glucose reading?", data, now)).toContain(
      "no manually recorded",
    );
    expect(mealCopilotAnswer("carbs today", data, now)).toContain("cannot invent");
  });
});
