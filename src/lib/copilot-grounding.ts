import { z } from "zod";
import { confirmedMeals } from "./food-insights";
import { nutritionTotals } from "./meals";
import { activityHistory } from "./activity";
import type { AppData } from "./types";

export const copilotSelectionSchema = z
  .object({
    intent: z.enum([
      "carbs_today",
      "largest_meals",
      "meal_glucose",
      "walking_week",
      "summary",
      "doctor",
      "unsupported",
    ]),
    mealIds: z.array(z.string()).max(5),
  })
  .strict();
export type CopilotSelection = z.infer<typeof copilotSelectionSchema>;
export function copilotGrounding(
  data: AppData,
  now = new Date(),
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  const since = +now - 14 * 86400000;
  return {
    now: now.toISOString(),
    meals: confirmedMeals(data.logs, now)
      .filter((log) => Date.parse(log.timestamp) >= since)
      .slice(-100)
      .map((log) => ({
        id: log.id,
        time: log.timestamp,
        foods: log.meal!.items.map((item) => ({
          name: item.name.slice(0, 120),
          portion: item.portion.slice(0, 120),
        })),
        carbohydrates: nutritionTotals(log.meal!.items).carbohydrates,
      })),
    readings: data.readings
      .filter(
        (r) =>
          r.source === "user" &&
          Date.parse(r.timestamp) >= since &&
          Date.parse(r.timestamp) <= +now,
      )
      .slice(-200)
      .map((r) => ({ time: r.timestamp, value: r.value, context: r.context, source: "manual" })),
    activities: activityHistory(data.logs, now, timezone).records.map((log) => ({
      time: log.timestamp,
      type: log.activity!.type,
      duration: log.activity!.duration,
    })),
  };
}
export function validateSelection(payload: unknown, data: AppData) {
  const selection = copilotSelectionSchema.parse(payload);
  const ids = new Set(confirmedMeals(data.logs).map((meal) => meal.id));
  if (selection.mealIds.some((id) => !ids.has(id))) throw new Error("Unknown record");
  return selection;
}
