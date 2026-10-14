import { format, isSameDay, startOfDay, subDays } from "date-fns";
import type { AppData, GlucoseReading, HealthLog } from "./types";

// Transparent, deterministic rules over the patient's own records.
// No AI, no diagnosis: just pairing and averaging recorded events.

export type MealClass = "heavier" | "lighter";

const HEAVIER_KEYWORDS = [
  "roti canai",
  "mee goreng",
  "nasi lemak",
  "char kway teow",
  "char kuey teow",
  "nasi goreng",
  "laksa",
  "teh tarik",
  "kuih",
  "fried",
  "goreng",
];
const LIGHTER_KEYWORDS = [
  "brown rice",
  "nasi perang",
  "ikan bakar",
  "grilled",
  "sayur",
  "vegetable",
  "soup",
  "sup",
  "tauhu",
  "tofu",
  "oats",
  "dhal",
  "tosai",
];

export function classifyMeal(title: string): MealClass | undefined {
  const text = title.toLowerCase();
  if (HEAVIER_KEYWORDS.some((k) => text.includes(k))) return "heavier";
  if (LIGHTER_KEYWORDS.some((k) => text.includes(k))) return "lighter";
  return undefined;
}

const LATE_NIGHT_PATTERN = /slept late|tidur lewat|熬夜/i;

export interface MealPair {
  mealLog: HealthLog;
  reading: GlucoseReading;
  cls: MealClass;
}

/** Pair each meal log with the first after-meal reading logged 30min-4h later, same day. */
export function pairMeals(data: AppData, now: Date, days = 30): MealPair[] {
  const since = subDays(now, days).getTime();
  const meals = data.logs.filter((l) => l.category === "meal" && new Date(l.timestamp).getTime() >= since && new Date(l.timestamp) <= now);
  const afterMeals = data.readings.filter((r) => r.context === "after_meal");
  const pairs: MealPair[] = [];
  for (const meal of meals) {
    const cls = classifyMeal(meal.title + " " + (meal.detail ?? ""));
    if (!cls) continue;
    const mealTime = new Date(meal.timestamp).getTime();
    const candidates = afterMeals
      .filter((r) => {
        const t = new Date(r.timestamp).getTime();
        return t - mealTime >= 30 * 60_000 && t - mealTime <= 4 * 60 * 60_000 && isSameDay(new Date(r.timestamp), new Date(meal.timestamp));
      })
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const reading = candidates[0];
    if (reading) pairs.push({ mealLog: meal, reading, cls });
  }
  return pairs;
}

export interface MealClassStats {
  count: number;
  avg: number;
  min: number;
  max: number;
}

export interface MealImpactResult {
  heavier?: MealClassStats | undefined;
  lighter?: MealClassStats | undefined;
  valid: boolean;
  pairs: MealPair[];
}

const round1 = (x: number) => Math.round(x * 10) / 10;

function statsFor(pairs: MealPair[], cls: MealClass): MealClassStats | undefined {
  const values = pairs.filter((p) => p.cls === cls).map((p) => p.reading.value);
  if (!values.length) return undefined;
  return { count: values.length, avg: round1(values.reduce((a, b) => a + b, 0) / values.length), min: round1(Math.min(...values)), max: round1(Math.max(...values)) };
}

/** Compare after-meal readings following "heavier" vs "lighter" meals, last 30 days. */
export function mealImpact(data: AppData, now: Date): MealImpactResult {
  const pairs = pairMeals(data, now, 30);
  const heavier = statsFor(pairs, "heavier");
  const lighter = statsFor(pairs, "lighter");
  const valid = (heavier?.count ?? 0) >= 2 && (lighter?.count ?? 0) >= 2;
  return { heavier, lighter, valid, pairs };
}

export interface LateNightImpactResult {
  lateNight?: MealClassStats | undefined;
  others?: MealClassStats | undefined;
  valid: boolean;
  lateNightCount: number;
  otherCount: number;
}

/** Compare the next morning's fasting reading after a "slept late" log vs other mornings, last 14 days. */
export function lateNightImpact(data: AppData, now: Date): LateNightImpactResult {
  const since = subDays(now, 14).getTime();
  const lateLogs = data.logs.filter((l) => l.category === "symptom" && LATE_NIGHT_PATTERN.test(l.title) && new Date(l.timestamp).getTime() >= since && new Date(l.timestamp) <= now);
  const fasting = data.readings.filter((r) => r.context === "fasting" && new Date(r.timestamp).getTime() >= since && new Date(r.timestamp) <= now);
  const fastingByDay = new Map<string, GlucoseReading>();
  for (const r of fasting) {
    const day = format(startOfDay(new Date(r.timestamp)), "yyyy-MM-dd");
    const existing = fastingByDay.get(day);
    if (!existing || r.timestamp < existing.timestamp) fastingByDay.set(day, r);
  }
  const lateMorningDays = new Set<string>();
  const lateValues: number[] = [];
  for (const log of lateLogs) {
    const nextDay = startOfDay(new Date(new Date(log.timestamp).getTime() + 24 * 60 * 60_000));
    const key = format(nextDay, "yyyy-MM-dd");
    const reading = fastingByDay.get(key);
    if (reading && !lateMorningDays.has(key)) {
      lateMorningDays.add(key);
      lateValues.push(reading.value);
    }
  }
  const otherValues = [...fastingByDay.entries()].filter(([day]) => !lateMorningDays.has(day)).map(([, r]) => r.value);
  const toStats = (values: number[]): MealClassStats | undefined =>
    values.length ? { count: values.length, avg: round1(values.reduce((a, b) => a + b, 0) / values.length), min: round1(Math.min(...values)), max: round1(Math.max(...values)) } : undefined;
  const valid = lateValues.length >= 2 && otherValues.length >= 3;
  return { lateNight: toStats(lateValues), others: toStats(otherValues), valid, lateNightCount: lateValues.length, otherCount: otherValues.length };
}

export type WhatIfResult = { status: "ok"; min: number; avg: number; max: number; n: number } | { status: "insufficient"; n: number };

/** The patient's own historical after-meal range for "heavier" or "lighter" meals (any time window on record). */
export function whatIfDinner(data: AppData, group: MealClass, now: Date = new Date()): WhatIfResult {
  const pairs = pairMeals(data, now, 365).filter((p) => p.cls === group);
  const values = pairs.map((p) => p.reading.value);
  if (values.length < 2) return { status: "insufficient", n: values.length };
  return { status: "ok", min: round1(Math.min(...values)), avg: round1(values.reduce((a, b) => a + b, 0) / values.length), max: round1(Math.max(...values)), n: values.length };
}
