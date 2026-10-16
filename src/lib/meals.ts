import { z } from "zod";
import type { AppData, GlucoseReading, HealthLog } from "./types";

const nutrient = z.number().finite().min(0).max(10000).nullable();
export const foodItemSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    portion: z.string().trim().min(1).max(120),
    servings: z.number().finite().min(0.05).max(20),
    ingredients: z.string().max(400),
    sweetness: z.enum(["unknown", "none", "less", "regular"]),
    carbohydrates: nutrient,
    calories: nutrient,
    protein: nutrient,
    fat: nutrient,
    fibre: nutrient,
  })
  .strict();
export const analysisSchema = z
  .object({
    items: z.array(foodItemSchema).min(1).max(20),
    uncertainty: z.array(z.string().min(1).max(300)).max(5),
    questions: z.array(z.string().min(1).max(300)).max(5),
  })
  .strict();
export type FoodItem = z.infer<typeof foodItemSchema>;
export type MealAnalysis = z.infer<typeof analysisSchema>;
export const mealRecordSchema = analysisSchema.extend({
  originalItems: z.array(foodItemSchema).min(1).max(20),
  entrySource: z.enum(["manual", "ai", "ai-edited"]),
  confirmed: z.literal(true),
  submissionId: z.string().min(1).max(100),
  reminderAt: z.string().datetime().optional(),
  reminderDismissedAt: z.string().datetime().optional(),
});
export type MealRecord = z.infer<typeof mealRecordSchema>;
export const NUTRIENTS = ["carbohydrates", "calories", "protein", "fat", "fibre"] as const;
export function blankFood(): FoodItem {
  return {
    name: "",
    portion: "",
    servings: 1,
    ingredients: "",
    sweetness: "unknown",
    carbohydrates: null,
    calories: null,
    protein: null,
    fat: null,
    fibre: null,
  };
}
export function nutritionTotals(items: FoodItem[]) {
  return Object.fromEntries(
    NUTRIENTS.map((key) => {
      const known = items.filter((item) => item[key] !== null);
      return [
        key,
        {
          value: known.length
            ? Math.round(known.reduce((sum, item) => sum + item[key]! * item.servings, 0) * 10) / 10
            : null,
          complete: known.length === items.length && items.length > 0,
        },
      ];
    }),
  ) as Record<(typeof NUTRIENTS)[number], { value: number | null; complete: boolean }>;
}
export function saveConfirmedMeal(logs: HealthLog[], incoming: HealthLog): HealthLog[] {
  const meal = mealRecordSchema.parse(incoming.meal);
  const normalized = { ...incoming, meal };
  const existing = logs.find((log) => log.id === incoming.id);
  if (existing && (existing.category !== "meal" || existing.source !== "user"))
    throw new Error("Meal cannot be edited");
  if (existing) return logs.map((log) => (log.id === incoming.id ? normalized : log));
  if (logs.some((log) => log.meal?.submissionId === meal.submissionId)) return logs;
  return [...logs, normalized];
}
export function nearbyMealReadings(meal: HealthLog, readings: GlucoseReading[]) {
  const timestamp = new Date(meal.timestamp).getTime();
  const source = meal.source === "user" ? "user" : meal.source;
  return readings
    .filter(
      (reading) =>
        reading.source === source &&
        Math.abs(new Date(reading.timestamp).getTime() - timestamp) <= 3 * 3600000,
    )
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
export function recurringMeals(data: AppData) {
  const groups = new Map<string, { count: number; higher: number }>();
  for (const meal of data.logs.filter(
    (log) => log.category === "meal" && log.source === "user" && log.meal?.confirmed,
  )) {
    const timestamp = new Date(meal.timestamp).getTime();
    const overlapping = data.logs.some(
      (log) =>
        log.id !== meal.id &&
        log.category === "meal" &&
        Math.abs(new Date(log.timestamp).getTime() - timestamp) < 3 * 3600000,
    );
    if (overlapping) continue;
    const readings = nearbyMealReadings(meal, data.readings);
    const before = readings
      .filter(
        (r) =>
          new Date(r.timestamp).getTime() <= timestamp &&
          timestamp - new Date(r.timestamp).getTime() <= 3600000 &&
          r.context === "before_meal",
      )
      .at(-1);
    const after = readings.find(
      (r) =>
        r.context === "after_meal" &&
        new Date(r.timestamp).getTime() - timestamp >= 90 * 60000 &&
        new Date(r.timestamp).getTime() - timestamp <= 150 * 60000,
    );
    if (!before || !after) continue;
    const key = meal.title.trim().toLowerCase();
    const group = groups.get(key) ?? { count: 0, higher: 0 };
    group.count++;
    if (after.value > before.value) group.higher++;
    groups.set(key, group);
  }
  return [...groups.entries()]
    .filter(([, group]) => group.count >= 3 && group.higher >= 3)
    .map(([name, group]) => ({ name, ...group }));
}
export function mealSuggestionKeys(items: FoodItem[]) {
  const names = items
    .map((item) => `${item.name} ${item.ingredients}`)
    .join(" ")
    .toLowerCase();
  const suggestions: string[] = [];
  if (/teh|milo|drink|juice|soda|饮料|茶|minuman/.test(names))
    suggestions.push(
      "If it suits your care plan, ask for less sugar in your drink or choose water.",
    );
  if (/rice|nasi|noodle|mee|roti|chapati|laksa|kuey|米|面/.test(names))
    suggestions.push(
      "Confirm your rice, noodle or bread portion. You can compare a smaller serving without avoiding the whole dish.",
    );
  if (/sauce|sambal|kuih|酱/.test(names))
    suggestions.push(
      "Confirm sweet sauces or toppings; the amount and ingredients may be uncertain.",
    );
  return suggestions.slice(0, 2);
}
export const MALAYSIAN_MEALS = [
  "Nasi lemak",
  "Nasi kandar",
  "Economy rice",
  "Chicken rice",
  "Nasi goreng",
  "Mee goreng",
  "Char kuey teow",
  "Roti canai",
  "Chapati",
  "Curry laksa",
  "Asam laksa",
  "Wantan mee",
  "Satay",
  "Rendang",
  "Kuih",
  "Teh tarik",
  "Milo",
];

export function validImageHeader(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n);
  if (mime === "image/webp")
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  return false;
}
export function validateMealImage(file: { type: string; size: number }, bytes: Uint8Array) {
  return file.size > 0 && file.size <= 10 * 1024 * 1024 && validImageHeader(bytes, file.type);
}
