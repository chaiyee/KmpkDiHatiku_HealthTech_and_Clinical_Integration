import { mealRecordSchema, nutritionTotals } from "./meals";
import type { AppData, HealthLog, GlucoseReading } from "./types";

export function confirmedMeals(logs: HealthLog[], now = new Date()) {
  return logs.filter(
    (log) =>
      log.source === "user" &&
      log.category === "meal" &&
      mealRecordSchema.safeParse(log.meal).success &&
      Date.parse(log.timestamp) <= +now,
  );
}
export function mealTimeline(meal: HealthLog, logs: HealthLog[], readings: GlucoseReading[]) {
  if (!confirmedMeals([meal]).length) return [];
  const time = Date.parse(meal.timestamp);
  const ambiguous = logs.some(
    (other) =>
      other.id !== meal.id &&
      other.source === "user" &&
      other.category === "meal" &&
      Math.abs(Date.parse(other.timestamp) - time) < 3 * 3600000,
  );
  return readings
    .filter((r) => r.source === "user" && Math.abs(Date.parse(r.timestamp) - time) <= 3 * 3600000)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((reading) => {
      const minutes = Math.round((Date.parse(reading.timestamp) - time) / 60000);
      const relation =
        !ambiguous && reading.context === "before_meal" && minutes >= -60 && minutes <= 0
          ? "Before meal"
          : !ambiguous && reading.context === "after_meal" && minutes >= 90 && minutes <= 150
            ? "After meal"
            : "Nearby reading; meal link uncertain";
      return { reading, minutes, relation };
    });
}
export function foodInsights(data: AppData, now = new Date()) {
  const meals = confirmedMeals(data.logs, now);
  const groups = new Map<string, { count: number; higher: number }>();
  for (const meal of meals) {
    const timeline = mealTimeline(
      meal,
      data.logs,
      data.readings.filter((r) => Date.parse(r.timestamp) <= +now),
    );
    const before = timeline.filter((r) => r.relation === "Before meal").at(-1);
    const after = timeline.find((r) => r.relation === "After meal");
    if (!before || !after) continue;
    const key = meal
      .meal!.items.map(
        (item) =>
          `${item.name.trim().toLowerCase()} (${item.portion.trim().toLowerCase()} × ${item.servings})`,
      )
      .sort()
      .join(", ");
    const group = groups.get(key) ?? { count: 0, higher: 0 };
    group.count++;
    if (after.reading.value > before.reading.value) group.higher++;
    groups.set(key, group);
  }
  const patterns = [...groups]
    .filter(([, g]) => g.count >= 3 && g.higher === g.count)
    .map(([name, g]) => ({ name, ...g }));
  const today = meals.filter(
    (meal) => new Date(meal.timestamp).toDateString() === now.toDateString(),
  );
  const totals = today.map((meal) => nutritionTotals(meal.meal!.items).carbohydrates);
  return {
    meals,
    patterns,
    carbs: totals.some((t) => t.value !== null)
      ? Math.round(totals.reduce((sum, t) => sum + (t.value ?? 0), 0) * 10) / 10
      : null,
    complete: totals.length > 0 && totals.every((t) => t.complete),
  };
}
