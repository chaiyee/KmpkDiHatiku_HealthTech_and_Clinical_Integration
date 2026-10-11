// Shared data models. A backend can replace the demo storage by returning these shapes.

export type GlucoseContext = "fasting" | "before_meal" | "after_meal" | "bedtime" | "random";

export const CONTEXT_LABELS: Record<GlucoseContext, string> = {
  fasting: "Fasting (before breakfast)",
  before_meal: "Before a meal",
  after_meal: "2 hours after a meal",
  bedtime: "Bedtime",
  random: "Other / random",
};

export type RecordSource = "sample" | "user";

export interface GlucoseReading {
  id: string;
  timestamp: string; // ISO
  value: number;
  unit: "mmol/L";
  context: GlucoseContext;
  note?: string | undefined;
  source: RecordSource;
}

export type LogCategory = "symptom" | "meal" | "activity" | "medication";

export const CATEGORY_LABELS: Record<LogCategory, string> = {
  symptom: "Symptom",
  meal: "Meal",
  activity: "Activity",
  medication: "Medication record",
};

export interface HealthLog {
  id: string;
  timestamp: string;
  category: LogCategory;
  title: string;
  detail?: string | undefined;
  source: RecordSource;
}

export interface CheckIn {
  date: string; // yyyy-MM-dd
  completed: boolean;
  reflection?: string | undefined;
}

export interface Patient {
  name: string;
  age: number;
  sex: string;
  diabetesType: string;
  yearsSinceDiagnosis: number;
  clinic: string;
  doctor: string;
  nextVisit: string; // ISO
}

export interface CarePlan {
  goal: string;
  explanation: string;
  startDate: string; // yyyy-MM-dd
  durationDays: number;
  followUpDate: string; // ISO
  doctorFeedback: string;
}

/** Demo reference thresholds (mmol/L). NOT personalised clinical targets. */
export interface Thresholds {
  hypo: number;
  fastingHigh: number;
  postMealHigh: number;
  severeHigh: number;
  minRepeated: number;
  baselineMinReadings: number;
  baselineShift: number;
}

export interface AppData {
  patient: Patient;
  readings: GlucoseReading[];
  logs: HealthLog[];
  checkIns: CheckIn[];
  carePlan: CarePlan;
  doctorNotes: string;
  thresholds: Thresholds;
}
