// Shared data models. A backend can replace the demo storage by returning these shapes.
// Internal glucose representation is always mmol/L; the original entry is retained.

export type Lang = "en" | "ms" | "zh";

export type GlucoseContext = "fasting" | "before_meal" | "after_meal" | "bedtime" | "random";
export const GLUCOSE_CONTEXTS: GlucoseContext[] = ["fasting", "before_meal", "after_meal", "bedtime", "random"];

export type GlucoseUnit = "mmol/L" | "mg/dL";
export type RecordSource = "sample" | "user";

export interface GlucoseReading {
  id: string;
  timestamp: string; // ISO
  value: number; // mmol/L, 1 decimal
  unit: "mmol/L";
  originalValue?: number | undefined;
  originalUnit?: GlucoseUnit | undefined;
  context: GlucoseContext;
  note?: string | undefined;
  symptoms?: string | undefined;
  meal?: string | undefined;
  activity?: string | undefined;
  medicationContext?: string | undefined;
  source: RecordSource;
}

/** Symptom / meal / activity / free-text medication note / patient note. */
export type LogCategory = "symptom" | "meal" | "activity" | "medication" | "note";
export const LOG_CATEGORIES: LogCategory[] = ["meal", "activity", "symptom", "medication", "note"];

export interface HealthLog {
  id: string;
  timestamp: string;
  category: LogCategory;
  title: string;
  detail?: string | undefined;
  source: RecordSource;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: "female" | "male";
  diabetesType: string;
  yearsSinceDiagnosis: number;
  clinic: string;
  doctor: string;
  nextVisit: string; // ISO
}

// ---------- Medication ----------
export type MedFrequency = "daily" | "weekly";

export interface MedicationSchedule {
  id: string;
  name: string;
  dose: number;
  unit: string; // mg, units, tablet...
  times: string[]; // "HH:mm"
  frequency: MedFrequency;
  startDate: string; // yyyy-MM-dd
  endDate?: string | undefined;
  instructions?: string | undefined; // as written on the prescription
  notes?: string | undefined;
  paused: boolean;
}

export type MedEventAction = "taken" | "skipped" | "postponed";
/** Derived display statuses. "not_logged" never means "missed". */
export type DoseStatus = "scheduled" | "taken" | "skipped" | "not_logged" | "postponed";

export interface MedicationEvent {
  id: string;
  scheduleId: string;
  date: string; // yyyy-MM-dd of the scheduled dose
  scheduledTime: string; // HH:mm
  action: MedEventAction;
  actualTime?: string | undefined; // ISO, self-reported
  postponedUntil?: string | undefined; // ISO
  note?: string | undefined;
  recordedAt: string; // ISO
  source: RecordSource;
}

// ---------- Care plan ----------
export interface CarePlanGoal {
  id: string;
  description: string;
  explanation: string;
  createdBy: "doctor"; // AI never creates or edits goals
  creatorName: string;
  startDate: string; // yyyy-MM-dd
  targetDate: string; // yyyy-MM-dd
  followUpDate: string; // ISO
  doctorFeedback?: string | undefined;
  completedAt?: string | undefined;
  simulated: boolean;
}

export type YesPartlyNo = "yes" | "partly" | "no";

export interface DailyCheckIn {
  date: string; // yyyy-MM-dd
  followedGoal?: YesPartlyNo | undefined;
  medicationLogged?: boolean | undefined;
  glucoseRecorded?: boolean | undefined;
  activityDone?: boolean | undefined;
  wellbeing?: number | undefined; // 1-5
  difficulties?: string | undefined;
  reflection?: string | undefined;
  completed: boolean;
}

export interface MealPreferences {
  preferences: string;
  allergies: string;
  vegetarian: boolean;
  restrictions: string;
  budget: "any" | "low" | "medium";
  cuisine: "any" | "malay" | "chinese" | "indian";
}

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

// ---------- Caregiver ----------
export interface ShareSettings {
  status: boolean; // general health status
  readings: boolean; // selected glucose readings (evidence)
  medication: boolean; // medication logging status
  carePlan: boolean; // care-plan progress
  alerts: boolean; // pattern alerts
}

export type AlertCategory = "out_of_range" | "baseline_change" | "safety" | "support_request";
export const ALERT_CATEGORIES: AlertCategory[] = ["out_of_range", "baseline_change", "safety", "support_request"];

export interface CaregiverPermission {
  id: string;
  name: string;
  relationship: string;
  contact?: string | undefined;
  consentAt: string; // ISO — explicit patient consent
  revokedAt?: string | undefined;
  share: ShareSettings;
  categories: Record<AlertCategory, boolean>;
}

export interface CaregiverAlert {
  id: string;
  dedupeKey: string;
  caregiverId: string;
  category: AlertCategory;
  severity: "info" | "urgent";
  findingId?: string | undefined;
  createdAt: string;
  evidenceIds: string[]; // only populated when readings are shared
  message?: string | undefined; // patient support request text
  status: "new" | "acknowledged";
  acknowledgedAt?: string | undefined;
}

// ---------- Doctor ----------
export interface DoctorNote {
  id: string;
  createdAt: string;
  author: string;
  simulated: boolean; // true = not authenticated clinician input
  assessment: string;
  plan: string;
  followUpGoal?: string | undefined;
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
  version: 2;
  patient: Patient;
  readings: GlucoseReading[];
  logs: HealthLog[];
  medications: MedicationSchedule[];
  medEvents: MedicationEvent[];
  goals: CarePlanGoal[];
  checkIns: DailyCheckIn[];
  mealPrefs: MealPreferences;
  mealSwaps: Record<string, number>; // "yyyy-MM-dd:slot" -> offset
  caregiverMode: boolean;
  caregivers: CaregiverPermission[];
  caregiverAlerts: CaregiverAlert[];
  doctorNotes: DoctorNote[];
  doctorQuestions: string[] | null; // null = auto-generated from records
  thresholds: Thresholds;
}
