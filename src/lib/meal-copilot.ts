import { translate, type Language } from "./i18n";
import { nutritionTotals } from "./meals";
import type { AppData } from "./types";

export function mealCopilotAnswer(
  question: string,
  data: AppData,
  now: Date,
  language: Language = "en",
): string | null {
  const t = (text: string, values?: Record<string, string | number>) =>
    translate(text, language, values);
  if (
    /teh tarik|拉茶/.test(question) &&
    /alternative|less|lower|sugar|替代|少糖|kurang|ganti/.test(question)
  )
    return t(
      "For teh tarik, you could ask for less sugar or choose water. Recipes vary; confirm the ingredients and follow your care team's advice.",
    );
  const before =
    /before|sebelum|之前/.test(question) && /glucose|reading|bacaan|血糖|读数/.test(question);
  const carbs = /carbohydrate|carbs|karbohidrat|碳水/.test(question);
  if (!before && !carbs) return null;
  const meals = data.logs.filter(
    (log) =>
      log.category === "meal" &&
      log.source === "user" &&
      log.meal?.confirmed &&
      new Date(log.timestamp) <= now,
  );
  if (before) {
    const reading = data.readings
      .filter((r) => r.source === "user" && new Date(r.timestamp) <= now)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
    if (!reading)
      return t(
        "There is no manually recorded glucose reading to compare with your confirmed meals.",
      );
    const nearby = meals
      .filter(
        (log) =>
          new Date(log.timestamp) <= new Date(reading.timestamp) &&
          new Date(reading.timestamp).getTime() - new Date(log.timestamp).getTime() <= 4 * 3600000,
      )
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (!nearby.length)
      return t(
        "No confirmed meal was recorded in the four hours before your latest manually recorded glucose reading.",
      );
    return t(
      "Before your latest manually recorded glucose reading ({value} mmol/L), you logged: {meals}. Timing does not prove a meal caused the reading.",
      { value: reading.value, meals: nearby.map((log) => log.title).join(", ") },
    );
  }
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const today = /today|hari ini|今天/.test(question);
  const selected = today ? meals.filter((log) => new Date(log.timestamp) >= start) : meals;
  if (!selected.length)
    return t(
      "No confirmed meals with nutrition estimates are available for this period. Older meal notes are kept, but I cannot invent their nutrients.",
    );
  const estimates = selected.map((log) => ({
    title: log.title,
    ...nutritionTotals(log.meal!.items).carbohydrates,
  }));
  const complete = estimates.every((estimate) => estimate.complete);
  if (/most|highest|which|paling|tertinggi|最多|最高|哪些/.test(question)) {
    const ranked = estimates
      .filter((estimate) => estimate.value !== null)
      .sort((a, b) => b.value! - a.value!)
      .slice(0, 3);
    return t(
      "Meals with the largest recorded carbohydrate estimates: {meals}. These are estimates, not verified measurements.",
      {
        meals: ranked.length
          ? ranked.map((estimate) => `${estimate.title}: ${estimate.value} g`).join("; ")
          : t("Not entered"),
      },
    );
  }
  const sum =
    Math.round(estimates.reduce((total, estimate) => total + (estimate.value ?? 0), 0) * 10) / 10;
  return (
    t("Across {count} confirmed meals, recorded carbohydrate estimates add up to {value} g.", {
      count: selected.length,
      value: sum,
    }) +
    "\n\n" +
    t(
      complete
        ? "These are estimates from your confirmed records, not verified nutritional measurements."
        : "This is a partial sum. Missing nutrients and unlogged meals are not included; it is not your complete intake.",
    )
  );
}
