import { addDays, format, setHours, setMinutes, startOfDay, subDays } from "date-fns";
import type { AppData, GlucoseContext, GlucoseReading, HealthLog, Thresholds } from "./types";

// Fictional patient. All records are generated relative to "now" so the demo always looks recent.

export const DEMO_THRESHOLDS: Thresholds = {
  hypo: 3.9,
  fastingHigh: 7.0,
  postMealHigh: 10.0,
  severeHigh: 16.7,
  minRepeated: 3,
  baselineMinReadings: 5,
  baselineShift: 1.0,
};

function at(day: Date, h: number, m = 0) {
  return setMinutes(setHours(day, h), m).toISOString();
}

export function generateSampleData(now: Date = new Date()): AppData {
  const today = startOfDay(now);
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

  const startDate = format(subDays(today, 6), "yyyy-MM-dd");
  const checkIns = [6, 5, 4, 3, 2, 1].map((d) => ({
    date: format(subDays(today, d), "yyyy-MM-dd"),
    completed: d !== 4,
    reflection: d === 3 ? "Forgot dinner reading, did it late." : undefined,
  }));

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
    readings,
    logs,
    checkIns,
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
  };
}
