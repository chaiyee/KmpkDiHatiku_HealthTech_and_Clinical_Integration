// Shared data models. A backend can replace the demo storage by returning these shapes.

export type GlucoseContext = "fasting" | "before_meal" | "after_meal" | "bedtime" | "random";

export const CONTEXT_LABELS: Record<GlucoseContext, string> = {
  fasting: "Fasting (before breakfast)",
  before_meal: "Before a meal",
  after_meal: "2 hours after a meal",
  bedtime: "Bedtime",
  random: "Other / random",
};

export type RecordSource = "sample" | "user" | "device";

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
  meal?: import("./meals").MealRecord;
  activity?: import("./activity").ActivityRecord | undefined;
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

export interface EmergencyInfo {
  allergies: string;
  notes: string;
}

export interface AppData {
  activityReminder?: { enabled: boolean; time: string; dismissedDate?: string };
  consultationQuestions?: string;
  emergency?: EmergencyInfo;
  pinnedQuestions?: { id: string; text: string; createdAt: string; discussed: boolean }[];
  doctorResponseAt?: string;
  followUpInstructions?: string;
  caregiver?: CaregiverSettings;
  caregiverAlerts?: CaregiverAlert[];
  medicationSchedules?: MedicationSchedule[];
  medicationStatuses?: MedicationStatus[];
  patient: Patient;
  readings: GlucoseReading[];
  logs: HealthLog[];
  checkIns: CheckIn[];
  carePlan: CarePlan;
  doctorNotes: string;
  thresholds: Thresholds;
}

export interface MedicationSchedule {
  id: string;
  name: string;
  dose: string;
  unit: string;
  time: string;
  days: number[]; // Local weekdays: Sunday = 0. Daily = all seven days.
  timing?: string; // Optional prescribed meal-timing instruction entered by the patient.
  purpose?: string; // Optional plain-language purpose as told by the clinician.
}
export const SKIP_REASONS = [
  "Forgot",
  "Side Effects",
  "Ran Out",
  "Felt Unwell",
  "Fasting",
  "Other",
] as const;
export type MedicationAction = "taken" | "skipped" | "later";
export interface MedicationStatus {
  scheduleId: string;
  date: string; // Local yyyy-MM-dd; one self-report per scheduled day.
  status: MedicationAction;
  updatedAt: string;
  remindAt?: string;
  reason?: string;
  note?: string;
}

export interface CaregiverSettings {
  enabled: boolean;
  name: string;
  relationship: string;
  shareRepeated: boolean;
  shareSafety: boolean;
  phone?: string;
}
export interface CaregiverAlert {
  id: string;
  category: "repeated" | "safety";
  title: string;
  summary: string;
  rule: string;
  evidence: GlucoseReading[];
  thresholds: Thresholds;
  createdAt: string;
  acknowledgedAt?: string;
}
