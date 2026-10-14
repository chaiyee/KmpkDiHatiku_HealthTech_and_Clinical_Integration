import { addDays, format, setHours, setMinutes, startOfDay, subDays } from "date-fns";
import type { AppData, CheckIn, GlucoseContext, GlucoseReading, HealthLog, Thresholds } from "./types";

// Fictional patient. All records are generated relative to "now" so the demo always looks recent.

export const DEMO_THRESHOLDS: Thresholds = {
  hypo: 4.0,
  fastingHigh: 7.0,
  postMealHigh: 10.0,
  severeHigh: 16.7,
  minRepeated: 3,
  baselineMinReadings: 5,
  baselineShift: 1.0,
};

export type DemoScenario = "rising" | "stable" | "low_event" | "new_user";

// Short, judge-facing names for the scenario switcher.
export const SCENARIO_LABELS: Record<DemoScenario, string> = {
  rising: "Rising mornings",
  stable: "Stable week",
  low_event: "Low glucose event",
  new_user: "New user",
};

function at(day: Date, h: number, m = 0) {
  return setMinutes(setHours(day, h), m).toISOString();
}

interface Builder {
  readings: GlucoseReading[];
  logs: HealthLog[];
  r: (daysAgo: number, h: number, m: number, value: number, context: GlucoseContext, note?: string) => void;
  l: (daysAgo: number, h: number, category: HealthLog["category"], title: string, detail?: string) => void;
}

function makeBuilder(today: Date): Builder {
  const readings: GlucoseReading[] = [];
  const logs: HealthLog[] = [];
  let n = 0;
  const r = (daysAgo: number, h: number, m: number, value: number, context: GlucoseContext, note?: string) =>
    readings.push({
      id: `s-r${n++}`,
      timestamp: at(subDays(today, daysAgo), h, m),
      value,
      unit: "mmol/L",
      context,
      note,
      source: "sample",
    });
  const l = (daysAgo: number, h: number, category: HealthLog["category"], title: string, detail?: string) =>
    logs.push({ id: `s-l${n++}`, timestamp: at(subDays(today, daysAgo), h), category, title, detail, source: "sample" });
  return { readings, logs, r, l };
}

function buildRising(today: Date) {
  const { readings, logs, r, l } = makeBuilder(today);
  // Fasting readings: steady baseline (days 13–7), higher in the most recent days (6–1). Today left empty.
  const fasting: Record<number, number> = {
    13: 6.4, 12: 6.1, 11: 6.6, 10: 6.3, 8: 6.5, 7: 6.2,
    6: 6.8, 5: 7.6, 4: 7.9, 3: 8.2, 2: 7.8, 1: 8.4,
  };
  Object.entries(fasting).forEach(([d, v]) => r(Number(d), 7, 10, v, "fasting"));
  // Before lunch & after dinner
  const lunch: Record<number, number> = { 13: 5.9, 12: 6.2, 11: 5.8, 10: 6.0, 8: 6.1, 7: 5.7, 6: 6.3, 5: 6.0, 4: 6.4, 3: 6.2, 2: 6.1, 1: 6.5 };
  Object.entries(lunch).forEach(([d, v]) => r(Number(d), 12, 15, v, "before_meal"));
  const dinner: Record<number, number> = { 13: 8.6, 12: 8.9, 11: 9.2, 10: 8.4, 8: 9.0, 7: 8.7, 6: 9.4, 5: 9.1, 4: 10.6, 3: 9.8, 2: 9.3, 1: 9.6 };
  Object.entries(dinner).forEach(([d, v]) => r(Number(d), 21, 0, v, "after_meal"));
  // Day 9: no readings recorded (data gap)

  // Medication records (recorded, not confirmed adherence). Day 4 & 9 have no record.
  for (let d = 13; d >= 1; d--) {
    if (d === 4 || d === 9) continue;
    l(d, 8, "medication", "Metformin 500 mg", "Recorded as taken with breakfast");
  }
  l(12, 13, "meal", "Nasi lemak with egg", "Lunch at work canteen");
  l(10, 19, "meal", "Brown rice, ikan bakar, sayur", "Home-cooked dinner");
  l(5, 20, "meal", "Roti canai with teh tarik", "Late dinner with family");
  l(4, 20, "meal", "Mee goreng mamak", "Dinner out");
  l(2, 19, "meal", "Chicken soup with half portion rice");
  l(12, 18, "activity", "Brisk walk, 30 min", "Taman park");
  l(10, 18, "activity", "Brisk walk, 25 min");
  l(7, 7, "activity", "Gardening, 40 min");
  l(3, 18, "activity", "Brisk walk, 20 min");
  l(5, 23, "symptom", "Slept late (after midnight)", "Self-reported");
  l(3, 23, "symptom", "Slept late (after midnight)", "Self-reported");
  l(2, 8, "symptom", "Feeling tired in the morning", "Mild, self-reported");
  l(4, 15, "symptom", "More thirsty than usual", "Self-reported");

  const checkIns: CheckIn[] = [6, 5, 4, 3, 2, 1].map((d) => ({
    date: format(subDays(today, d), "yyyy-MM-dd"),
    completed: d !== 4,
    reflection: d === 3 ? "Forgot dinner reading, did it late." : undefined,
  }));
  return { readings, logs, checkIns };
}

function buildStable(today: Date) {
  const { readings, logs, r, l } = makeBuilder(today);
  for (let d = 14; d >= 1; d--) {
    r(d, 7, 10, 5.6 + (d % 3 === 0 ? 0.3 : 0), "fasting");
    r(d, 13, 0, 6.2 + (d % 4 === 0 ? 0.2 : 0), "before_meal");
    r(d, 20, 30, 7.4 + (d % 5 === 0 ? 0.3 : -0.2), "after_meal");
    if (d !== 9) l(d, 8, "medication", "Metformin 500 mg", "Recorded as taken with breakfast");
  }
  l(10, 18, "activity", "Brisk walk, 30 min", "Taman park");
  l(6, 18, "activity", "Cycling, 20 min");
  l(3, 18, "activity", "Brisk walk, 25 min");
  l(8, 13, "meal", "Brown rice, grilled fish, vegetables");
  l(4, 19, "meal", "Home-cooked dinner, smaller portion");
  const checkIns: CheckIn[] = [6, 5, 4, 3, 2, 1].map((d) => ({
    date: format(subDays(today, d), "yyyy-MM-dd"),
    completed: true,
    reflection: d === 2 ? "Feeling good, sticking to the plan." : undefined,
  }));
  return { readings, logs, checkIns };
}

function buildLowEvent(today: Date) {
  const { readings, logs, r, l } = makeBuilder(today);
  for (let d = 10; d >= 1; d--) {
    r(d, 7, 10, 5.9 + (d % 3 === 0 ? 0.3 : 0), "fasting");
    r(d, 13, 0, 6.3, "before_meal");
  }
  // 3 low evening readings on 3 different recent days (within the last 5 days).
  r(4, 19, 30, 3.6, "before_meal", "Felt shaky before dinner");
  r(3, 20, 0, 3.4, "after_meal");
  r(1, 19, 45, 3.8, "before_meal");
  for (let d = 10; d >= 1; d--) {
    if (d === 4 || d === 3 || d === 1) continue;
    r(d, 20, 30, 7.6, "after_meal");
  }
  l(4, 19, "symptom", "Felt shaky and sweaty", "Self-reported, before dinner");
  for (let d = 10; d >= 1; d--) l(d, 8, "medication", "Metformin 500 mg", "Recorded as taken with breakfast");
  const checkIns: CheckIn[] = [6, 5, 4, 3, 2, 1].map((d) => ({
    date: format(subDays(today, d), "yyyy-MM-dd"),
    completed: true,
  }));
  return { readings, logs, checkIns };
}

function buildNewUser(today: Date) {
  const { readings, r } = makeBuilder(today);
  r(3, 7, 10, 6.1, "fasting");
  r(2, 13, 0, 6.4, "before_meal");
  r(1, 20, 0, 7.0, "after_meal");
  return { readings, logs: [] as HealthLog[], checkIns: [] as CheckIn[] };
}

export function generateSampleData(now: Date = new Date(), scenario: DemoScenario = "rising"): AppData {
  const today = startOfDay(now);
  const built =
    scenario === "stable" ? buildStable(today) :
    scenario === "low_event" ? buildLowEvent(today) :
    scenario === "new_user" ? buildNewUser(today) :
    buildRising(today);

  const startDate = format(subDays(today, 6), "yyyy-MM-dd");

  return {
    patient: {
      name: "Aisyah Rahman",
      age: 54,
      sex: "Female",
      diabetesType: "Type 2 diabetes",
      yearsSinceDiagnosis: 6,
      clinic: "Klinik Kesihatan Taman Demo (fictional)",
      doctor: "Dr. Lim Wei Ming (fictional)",
      nextVisit: at(addDays(today, 5), 10, 30),
    },
    readings: built.readings,
    logs: built.logs,
    checkIns: built.checkIns,
    carePlan: {
      goal: "Record fasting glucose before breakfast and 2 hours after dinner, every day for 14 days.",
      explanation:
        "Consistent readings at the same times help your doctor see your usual pattern and decide whether anything needs to change at your next visit.",
      startDate,
      durationDays: 14,
      followUpDate: at(addDays(today, 5), 10, 30),
      doctorFeedback:
        "Good consistency so far. Please keep noting late meals and late nights so we can review the morning readings together. (Sample feedback)",
    },
    doctorNotes: "",
    thresholds: DEMO_THRESHOLDS,
    emergency: { allergies: "Penicillin (sample)", notes: "" },
  };
}
