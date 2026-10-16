import type { AppData } from "./types";
export const DEMO_KEY = "diamonitor-demo-v1";
export function sameCloudVersion(left: string | null, right: string) {
  return (
    left === right ||
    (left !== null && Number.isFinite(Date.parse(left)) && Date.parse(left) === Date.parse(right))
  );
}
export const accountKey = (id: string | null) => (id ? `diamonitor-account-v1:${id}` : DEMO_KEY);
export function emptyAccount(sample: AppData): AppData {
  return {
    ...sample,
    patient: {
      name: "",
      age: 0,
      sex: "",
      diabetesType: "",
      yearsSinceDiagnosis: 0,
      clinic: "",
      doctor: "",
      nextVisit: "",
    },
    readings: [],
    logs: [],
    checkIns: [],
    carePlan: {
      goal: "",
      explanation: "",
      startDate: "",
      durationDays: 0,
      followUpDate: "",
      doctorFeedback: "",
    },
    doctorNotes: "",
    emergency: { allergies: "", notes: "" },
    medicationSchedules: [],
    medicationStatuses: [],
    caregiverAlerts: [],
    caregiver: {
      enabled: false,
      name: "",
      relationship: "",
      shareRepeated: false,
      shareSafety: false,
    },
  };
}
