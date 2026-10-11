import { addDays, format, setHours, setMinutes, startOfDay, subDays } from "date-fns";
import type { AppData, GlucoseContext, GlucoseReading, HealthLog, MedicationEvent, Thresholds } from "./types";

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
  const medEvents: MedicationEvent[] = [];
  let n = 0;
  const r = (daysAgo: number, h: number, m: number, value: number, context: GlucoseContext) =>
    readings.push({ id: `s-r${n++}`, timestamp: at(subDays(today, daysAgo), h, m), value, unit: "mmol/L", context, source: "sample" });
  const l = (daysAgo: number, h: number, category: HealthLog["category"], title: string, detail?: string) =>
    logs.push({ id: `s-l${n++}`, timestamp: at(subDays(today, daysAgo), h), category, title, detail, source: "sample" });

  // Fasting: steady baseline (days 13–7), higher in the most recent days (6–1). Day 9 left empty (data gap).
  const fasting: Record<number, number> = { 13: 6.4, 12: 6.1, 11: 6.6, 10: 6.3, 8: 6.5, 7: 6.2, 6: 6.8, 5: 7.6, 4: 7.9, 3: 8.2, 2: 7.8, 1: 8.4 };
  Object.entries(fasting).forEach(([d, v]) => r(Number(d), 7, 10, v, "fasting"));
  const lunch: Record<number, number> = { 13: 5.9, 12: 6.2, 11: 5.8, 10: 6.0, 8: 6.1, 7: 5.7, 6: 6.3, 5: 6.0, 4: 6.4, 3: 6.2, 2: 6.1, 1: 6.5 };
  Object.entries(lunch).forEach(([d, v]) => r(Number(d), 12, 15, v, "before_meal"));
  const dinner: Record<number, number> = { 13: 8.6, 12: 8.9, 11: 9.2, 10: 8.4, 8: 9.0, 7: 8.7, 6: 9.4, 5: 9.1, 4: 10.6, 3: 9.8, 2: 9.3, 1: 9.6 };
  Object.entries(dinner).forEach(([d, v]) => r(Number(d), 21, 0, v, "after_meal"));

  // Self-reported medication events. Some doses deliberately have no record (not the same as missed).
  for (let d = 13; d >= 1; d--) {
    const date = format(subDays(today, d), "yyyy-MM-dd");
    if (d !== 4 && d !== 9)
      medEvents.push({ id: `s-m${n++}`, scheduleId: "med-metformin", date, scheduledTime: "08:00", action: "taken", actualTime: at(subDays(today, d), 8, 10), recordedAt: at(subDays(today, d), 8, 10), source: "sample" });
    if (d === 5) medEvents.push({ id: `s-m${n++}`, scheduleId: "med-metformin", date, scheduledTime: "20:00", action: "skipped", note: "Late dinner with family", recordedAt: at(subDays(today, d), 22), source: "sample" });
    else if (d !== 3 && d !== 9)
      medEvents.push({ id: `s-m${n++}`, scheduleId: "med-metformin", date, scheduledTime: "20:00", action: "taken", actualTime: at(subDays(today, d), 20, 5), recordedAt: at(subDays(today, d), 20, 5), source: "sample" });
    if (d % 2 === 0)
      medEvents.push({ id: `s-m${n++}`, scheduleId: "med-atorva", date, scheduledTime: "21:30", action: "taken", actualTime: at(subDays(today, d), 21, 40), recordedAt: at(subDays(today, d), 21, 40), source: "sample" });
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
  l(6, 21, "note", "Busy week at work", "Dinner times were later than usual");

  const startDate = format(subDays(today, 6), "yyyy-MM-dd");
  const checkIns = [6, 5, 4, 3, 2, 1].map((d) => ({
    date: format(subDays(today, d), "yyyy-MM-dd"),
    completed: true,
    followedGoal: d === 4 ? ("partly" as const) : ("yes" as const),
    glucoseRecorded: true,
    medicationLogged: d !== 4,
    activityDone: d === 3 || d === 6,
    wellbeing: d === 2 ? 3 : 4,
    difficulties: d === 3 ? "Forgot dinner reading, did it late." : d === 4 ? "Busy at work, forgot to log medication." : undefined,
  }));

  return {
    version: 2,
    patient: {
      id: "P-0042",
      name: "Aisyah Rahman",
      age: 54,
      sex: "female",
      diabetesType: "Type 2",
      yearsSinceDiagnosis: 6,
      clinic: "Klinik Kesihatan Taman Demo",
      doctor: "Dr. Lim Wei Ming",
      nextVisit: at(addDays(today, 5), 10, 30),
    },
    readings,
    logs,
    medications: [
      { id: "med-metformin", name: "Metformin", dose: 500, unit: "mg", times: ["08:00", "20:00"], frequency: "daily", startDate: format(subDays(today, 400), "yyyy-MM-dd"), instructions: "Take with breakfast and dinner", paused: false },
      { id: "med-atorva", name: "Atorvastatin", dose: 20, unit: "mg", times: ["21:30"], frequency: "daily", startDate: format(subDays(today, 200), "yyyy-MM-dd"), instructions: "Take at night", paused: false },
    ],
    medEvents,
    goals: [
      {
        id: "goal-1",
        description: "Record fasting glucose before breakfast and 2 hours after dinner, every day for 14 days.",
        explanation: "Consistent readings at the same times help your doctor see your usual pattern and decide whether anything needs to change at your next visit.",
        createdBy: "doctor",
        creatorName: "Dr. Lim Wei Ming",
        startDate,
        targetDate: format(addDays(subDays(today, 6), 13), "yyyy-MM-dd"),
        followUpDate: at(addDays(today, 5), 10, 30),
        doctorFeedback: "Good consistency so far. Please keep noting late meals and late nights so we can review the morning readings together.",
        simulated: true,
      },
      {
        id: "goal-2",
        description: "Take a 20–30 minute gentle walk after dinner on at least 3 days a week, if you feel well.",
        explanation: "Light activity after meals is commonly discussed in diabetes education. Stop and rest if you feel unwell, dizzy or shaky.",
        createdBy: "doctor",
        creatorName: "Dr. Lim Wei Ming",
        startDate,
        targetDate: format(addDays(subDays(today, 6), 27), "yyyy-MM-dd"),
        followUpDate: at(addDays(today, 5), 10, 30),
        simulated: true,
      },
    ],
    checkIns,
    mealPrefs: { preferences: "", allergies: "", vegetarian: false, restrictions: "", budget: "any", cuisine: "any" },
    mealSwaps: {},
    caregiverMode: true,
    caregivers: [
      {
        id: "cg-farid",
        name: "Farid Rahman",
        relationship: "Son",
        contact: "+60 12-000 0000 (fictional)",
        consentAt: at(subDays(today, 20), 10),
        share: { status: true, readings: true, medication: true, carePlan: false, alerts: true },
        categories: { out_of_range: true, baseline_change: true, safety: true, support_request: true },
      },
    ],
    caregiverAlerts: [],
    doctorNotes: [],
    doctorQuestions: null,
    thresholds: DEMO_THRESHOLDS,
  };
}
