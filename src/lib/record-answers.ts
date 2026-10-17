import { translate, type Language } from "./i18n";
import { foodInsights, mealTimeline, confirmedMeals } from "./food-insights";
import { activityHistory } from "./activity";
import { nutritionTotals } from "./meals";
import type { AppData } from "./types";
import type { CopilotSelection } from "./copilot-grounding";

export function renderRecordAnswer(
  selection: CopilotSelection,
  data: AppData,
  now = new Date(),
  language: Language = "en",
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  const t = (key: string, values?: Record<string, string | number>) =>
    translate(key, language, values);
  const day = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
  const history = activityHistory(data.logs, now, timezone);
  const meals = confirmedMeals(data.logs, now);
  const todayMeals = meals.filter((meal) => day(new Date(meal.timestamp)) === day(now));
  const totals = todayMeals.map((meal) => nutritionTotals(meal.meal!.items).carbohydrates);
  const carbs = totals.some((item) => item.value !== null)
    ? Math.round(totals.reduce((sum, item) => sum + (item.value ?? 0), 0) * 10) / 10
    : t("Not entered");
  const disclaimer = t(
    "Estimates include confirmed meals only. Missing nutrients and unlogged meals are not included.",
  );
  const walking = t("Walking this week: {minutes} logged minutes", {
    minutes: history.records
      .filter((log) => log.activity!.type === "Walking")
      .reduce((sum, log) => sum + log.activity!.duration, 0),
  });
  if (selection.intent === "walking_week") return walking;
  if (selection.intent === "carbs_today")
    return `${t("Today's recorded carbohydrate estimates: {value} g", { value: carbs })}\n\n${disclaimer}`;
  if (selection.intent === "largest_meals")
    return (
      meals
        .map((meal) => ({ meal, carbs: nutritionTotals(meal.meal!.items).carbohydrates.value }))
        .filter((entry) => entry.carbs !== null)
        .sort((a, b) => b.carbs! - a.carbs!)
        .slice(0, 3)
        .map((entry) => `${entry.meal.title}: ${entry.carbs} g`)
        .join("\n") + `\n\n${disclaimer}`
    );
  if (selection.intent === "meal_glucose") {
    const selected = meals.filter((meal) => selection.mealIds.includes(meal.id));
    if (!selected.length)
      return t(
        "More information is needed. Choose a confirmed meal and record suitable glucose readings.",
      );
    return (
      selected
        .map((meal) => {
          const readings = mealTimeline(meal, data.logs, data.readings);
          return `${meal.title}\n${readings.length ? readings.map(({ reading, minutes, relation }) => `${reading.value} mmol/L · ${t(relation)} · ${t("{minutes} minutes from meal", { minutes })} · ${t("Manual entry")}`).join("\n") : t("No nearby manually recorded glucose readings.")}`;
        })
        .join("\n\n") +
      "\n\n" +
      t(
        "Nearby readings show timing only. Meals, activity, medicines and other factors may contribute.",
      )
    );
  }
  if (selection.intent === "doctor")
    return t(
      "Discuss your recorded meals, activity, missing readings and any symptoms with your healthcare team. Ask how to interpret these records within your own care plan.",
    );
  if (selection.intent === "summary")
    return `${t("Today's recorded carbohydrate estimates: {value} g", { value: carbs })}\n${walking}\n${t("Real glucose records available: {count}", { count: data.readings.filter((r) => r.source === "user" && Date.parse(r.timestamp) <= +now).length })}\n\n${disclaimer}\n${foodInsights(data, now).patterns.length ? t("Repeated meal associations are available in Daily Log. They do not establish cause.") : t("More information is needed. Choose a confirmed meal and record suitable glucose readings.")}`;
  return t(
    "I can help review your meals, activity and glucose records. Try a question about your day.",
  );
}
