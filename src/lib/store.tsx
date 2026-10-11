import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { generateSampleData } from "./sample-data";
import { evaluateCaregiverAlerts, supportRequestAlerts } from "./caregiver";
import type {
  AppData,
  CaregiverPermission,
  CarePlanGoal,
  DailyCheckIn,
  DoctorNote,
  GlucoseReading,
  HealthLog,
  MealPreferences,
  MealSlot,
  MedEventAction,
  MedicationSchedule,
} from "./types";

// Demo storage: browser localStorage. Swap load/save for API calls when a backend exists.
const KEY = "diamonitor-demo-v2";

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as AppData;
      if (d.version === 2) return d;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return withAlerts(generateSampleData());
}

function withAlerts(d: AppData): AppData {
  const fresh = evaluateCaregiverAlerts(d);
  return fresh.length ? { ...d, caregiverAlerts: [...d.caregiverAlerts, ...fresh] } : d;
}

const uid = () => Math.random().toString(36).slice(2, 10);

interface Store {
  data: AppData | null;
  addReading: (r: Omit<GlucoseReading, "id" | "source" | "unit">) => void;
  addLog: (l: Omit<HealthLog, "id" | "source">) => void;
  // medication
  saveMedication: (m: Omit<MedicationSchedule, "id"> & { id?: string | undefined }) => void;
  setMedicationPaused: (id: string, paused: boolean) => void;
  removeMedication: (id: string) => void;
  recordDose: (
    scheduleId: string,
    date: string,
    time: string,
    action: MedEventAction,
    opts?: { actualTime?: string | undefined; note?: string | undefined; postponeMinutes?: number | undefined },
  ) => void;
  // care plan
  saveCheckIn: (c: DailyCheckIn) => void;
  setGoalCompleted: (id: string, done: boolean) => void;
  addGoal: (g: Omit<CarePlanGoal, "id">) => void;
  setMealPrefs: (p: MealPreferences) => void;
  swapMeal: (date: string, slot: MealSlot) => void;
  // caregiver
  setCaregiverMode: (on: boolean) => void;
  saveCaregiver: (c: Omit<CaregiverPermission, "id" | "consentAt"> & { id?: string | undefined }) => void;
  revokeCaregiver: (id: string) => void;
  restoreCaregiver: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  requestSupport: (message: string) => number;
  // doctor
  addDoctorNote: (n: Omit<DoctorNote, "id" | "createdAt">) => void;
  setDoctorQuestions: (q: string[] | null) => void;
  resetDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => setData(load()), []);

  // Every change re-runs the deterministic caregiver alert evaluation.
  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = withAlerts(fn(prev));
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage full / disabled */
      }
      return next;
    });
  }, []);

  const store = useMemo<Store>(
    () => ({
      data,
      addReading: (r) => update((d) => ({ ...d, readings: [...d.readings, { ...r, id: uid(), unit: "mmol/L", source: "user" }] })),
      addLog: (l) => update((d) => ({ ...d, logs: [...d.logs, { ...l, id: uid(), source: "user" }] })),
      saveMedication: (m) =>
        update((d) => {
          if (m.id && d.medications.some((x) => x.id === m.id))
            return { ...d, medications: d.medications.map((x) => (x.id === m.id ? ({ ...m, id: x.id } as MedicationSchedule) : x)) };
          return { ...d, medications: [...d.medications, { ...m, id: uid() } as MedicationSchedule] };
        }),
      setMedicationPaused: (id, paused) => update((d) => ({ ...d, medications: d.medications.map((m) => (m.id === id ? { ...m, paused } : m)) })),
      removeMedication: (id) => update((d) => ({ ...d, medications: d.medications.filter((m) => m.id !== id) })),
      recordDose: (scheduleId, date, time, action, opts = {}) =>
        update((d) => {
          const now = new Date();
          return {
            ...d,
            medEvents: [
              ...d.medEvents,
              {
                id: uid(),
                scheduleId,
                date,
                scheduledTime: time,
                action,
                actualTime: action === "taken" ? (opts.actualTime ?? now.toISOString()) : undefined,
                postponedUntil: action === "postponed" ? new Date(now.getTime() + (opts.postponeMinutes ?? 15) * 60_000).toISOString() : undefined,
                note: opts.note,
                recordedAt: now.toISOString(),
                source: "user",
              },
            ],
          };
        }),
      saveCheckIn: (c) => update((d) => ({ ...d, checkIns: [...d.checkIns.filter((x) => x.date !== c.date), c] })),
      setGoalCompleted: (id, done) =>
        update((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, completedAt: done ? new Date().toISOString() : undefined } : g)) })),
      addGoal: (g) => update((d) => ({ ...d, goals: [...d.goals, { ...g, id: uid() }] })),
      setMealPrefs: (p) => update((d) => ({ ...d, mealPrefs: p })),
      swapMeal: (date, slot) =>
        update((d) => {
          const k = `${date}:${slot}`;
          return { ...d, mealSwaps: { ...d.mealSwaps, [k]: (d.mealSwaps[k] ?? 0) + 1 } };
        }),
      setCaregiverMode: (on) => update((d) => ({ ...d, caregiverMode: on })),
      saveCaregiver: (c) =>
        update((d) => {
          if (c.id && d.caregivers.some((x) => x.id === c.id))
            return { ...d, caregivers: d.caregivers.map((x) => (x.id === c.id ? { ...x, ...c, id: x.id } : x)) };
          return { ...d, caregivers: [...d.caregivers, { ...c, id: uid(), consentAt: new Date().toISOString() }] };
        }),
      revokeCaregiver: (id) =>
        update((d) => ({ ...d, caregivers: d.caregivers.map((c) => (c.id === id ? { ...c, revokedAt: new Date().toISOString() } : c)) })),
      restoreCaregiver: (id) =>
        update((d) => ({
          ...d,
          caregivers: d.caregivers.map((c) => (c.id === id ? { ...c, revokedAt: undefined, consentAt: new Date().toISOString() } : c)),
        })),
      acknowledgeAlert: (id) =>
        update((d) => ({
          ...d,
          caregiverAlerts: d.caregiverAlerts.map((a) => (a.id === id ? { ...a, status: "acknowledged", acknowledgedAt: new Date().toISOString() } : a)),
        })),
      requestSupport: (message) => {
        if (!data) return 0;
        const alerts = supportRequestAlerts(data, message);
        if (alerts.length) update((d) => ({ ...d, caregiverAlerts: [...d.caregiverAlerts, ...alerts] }));
        return alerts.length;
      },
      addDoctorNote: (n) => update((d) => ({ ...d, doctorNotes: [...d.doctorNotes, { ...n, id: uid(), createdAt: new Date().toISOString() }] })),
      setDoctorQuestions: (q) => update((d) => ({ ...d, doctorQuestions: q })),
      resetDemo: () => {
        const fresh = withAlerts(generateSampleData());
        localStorage.setItem(KEY, JSON.stringify(fresh));
        setData(fresh);
      },
    }),
    [data, update],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be inside StoreProvider");
  return s;
}
