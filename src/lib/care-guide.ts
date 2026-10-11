import type { MealPreferences, MealSlot } from "./types";

// General Malaysian meal & activity education. Text lives in locales under meals.options.<id>.
// These are educational ideas, not a clinically personalised meal plan.

export interface MealOption {
  id: string;
  slot: MealSlot;
  vegetarian: boolean;
  cuisine: "malay" | "chinese" | "indian" | "any";
  budget: "low" | "medium";
}

export const MEAL_OPTIONS: MealOption[] = [
  { id: "wholemealEgg", slot: "breakfast", vegetarian: true, cuisine: "any", budget: "low" },
  { id: "oatsNuts", slot: "breakfast", vegetarian: true, cuisine: "any", budget: "low" },
  { id: "thosaiDhal", slot: "breakfast", vegetarian: true, cuisine: "indian", budget: "low" },
  { id: "nasiLemakSmall", slot: "breakfast", vegetarian: false, cuisine: "malay", budget: "low" },
  { id: "chickenPorridge", slot: "breakfast", vegetarian: false, cuisine: "chinese", budget: "low" },
  { id: "brownRiceFish", slot: "lunch", vegetarian: false, cuisine: "malay", budget: "medium" },
  { id: "nasiCampur", slot: "lunch", vegetarian: false, cuisine: "malay", budget: "low" },
  { id: "yongTauFoo", slot: "lunch", vegetarian: false, cuisine: "chinese", budget: "low" },
  { id: "chapatiDhal", slot: "lunch", vegetarian: true, cuisine: "indian", budget: "low" },
  { id: "steamedChicken", slot: "lunch", vegetarian: false, cuisine: "chinese", budget: "medium" },
  { id: "vegSoupTofu", slot: "dinner", vegetarian: true, cuisine: "chinese", budget: "low" },
  { id: "ikanBakar", slot: "dinner", vegetarian: false, cuisine: "malay", budget: "medium" },
  { id: "chapatiVeg", slot: "dinner", vegetarian: true, cuisine: "indian", budget: "low" },
  { id: "clearSoupChicken", slot: "dinner", vegetarian: false, cuisine: "any", budget: "low" },
  { id: "fruitGuava", slot: "snack", vegetarian: true, cuisine: "any", budget: "low" },
  { id: "nuts", slot: "snack", vegetarian: true, cuisine: "any", budget: "medium" },
  { id: "yogurt", slot: "snack", vegetarian: true, cuisine: "any", budget: "medium" },
  { id: "wholegrainCrackers", slot: "snack", vegetarian: true, cuisine: "any", budget: "low" },
];

export const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

/** Filters only by preferences the patient stated; never infers medical restrictions. */
export function optionsFor(slot: MealSlot, p: MealPreferences): MealOption[] {
  let list = MEAL_OPTIONS.filter((o) => o.slot === slot);
  if (p.vegetarian) list = list.filter((o) => o.vegetarian);
  if (p.budget === "low") list = list.filter((o) => o.budget === "low");
  if (p.cuisine !== "any") {
    const preferred = list.filter((o) => o.cuisine === p.cuisine || o.cuisine === "any");
    if (preferred.length) list = [...preferred, ...list.filter((o) => !preferred.includes(o))];
  }
  return list.length ? list : MEAL_OPTIONS.filter((o) => o.slot === slot);
}

export function pickMeal(slot: MealSlot, p: MealPreferences, dayIndex: number, swaps: number): MealOption {
  const list = optionsFor(slot, p);
  return list[(dayIndex + swaps) % list.length]!;
}

export const ACTIVITIES = ["walk", "stretch", "lowImpact", "chair"] as const;
export const WEEK_ACTIVITY: (typeof ACTIVITIES)[number][] = ["walk", "stretch", "walk", "chair", "walk", "lowImpact", "stretch"];
