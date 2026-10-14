import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode, type Context } from "react";
import { generateSampleData, DEMO_THRESHOLDS, type DemoScenario } from "./sample-data";
import type { AppData, GlucoseReading, HealthLog, MedicationSchedule, MedicationAction, CaregiverSettings, EmergencyInfo } from "./types";
import { localDay } from "./medications";
import { DEFAULT_CAREGIVER, sharingAllows, syncCaregiverAlerts } from "./caregiver";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// Storage: localStorage always (demo/offline); when signed in, also synced to the patient_data table.
const KEY = "diamonitor-demo-v1";

function normalize(saved: AppData): AppData {
  return {
    ...saved,
    medicationSchedules: saved.medicationSchedules ?? [],
    medicationStatuses: saved.medicationStatuses ?? [],
    caregiver: saved.caregiver ?? DEFAULT_CAREGIVER,
    caregiverAlerts: saved.caregiverAlerts ?? [],
    emergency: saved.emergency ?? { allergies: "Penicillin (sample)", notes: "" },
    thresholds: { ...DEMO_THRESHOLDS, ...saved.thresholds },
  };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw) as AppData);
  } catch {
    /* ignore */
  }
  return generateSampleData();
}

interface Store {
  data: AppData | null;
  userEmail: string | null;
  syncState: "local" | "syncing" | "saved" | "error";
  demoDoctor: boolean;
  setDemoDoctor: (enabled: boolean) => void;
  saveQuestions: (questions: string) => void;
  pinQuestion: (text: string) => void;
  removeQuestion: (id: string) => void;
  toggleDiscussed: (id: string) => void;
  saveDoctorResponse: (response: { notes: string; feedback: string; goal: string; explanation: string; followUpInstructions: string; followUpDate: string }) => void;
  addReading: (r: Omit<GlucoseReading, "id" | "source" | "unit">) => void;
  addLog: (l: Omit<HealthLog, "id" | "source">) => void;
  /** Simulated device readings; skips any with a timestamp already recorded from a device. */
  addDeviceReadings: (rs: Omit<GlucoseReading, "id" | "source" | "unit">[]) => void;
  setCheckIn: (date: string, completed: boolean, reflection?: string) => void;
  setDoctorNotes: (notes: string) => void;
  resetDemo: () => void;
  loadScenario: (scenario: DemoScenario) => void;
  saveMedication: (schedule: Omit<MedicationSchedule, "id"> & { id?: string }) => void;
  removeMedication: (id: string) => void;
  markMedication: (id: string, status: MedicationAction, now?: Date, extra?: { reason?: string; note?: string }) => void;
  saveCaregiver: (settings: CaregiverSettings) => void;
  revokeCaregiver: () => void;
  acknowledgeCaregiver: (id: string) => void;
  saveEmergency: (info: EmergencyInfo) => void;
}

// Keep one context instance across hot reloads so provider and consumers always match.
const g = globalThis as unknown as { __diamonitorStoreCtx?: Context<Store | null> };
const Ctx = (g.__diamonitorStoreCtx ??= createContext<Store | null>(null));
const uid = () => Math.random().toString(36).slice(2, 10);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  // Presentation-only simulation, never authentication or secure authorisation.
  const [demoDoctor, setDemoDoctor] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<Store["syncState"]>("local");
  const [cloudReady, setCloudReady] = useState(false);

  useEffect(() => setData(load()), []);

  // Track the signed-in account.
  useEffect(() => {
    supabase.auth.getUser().then(({ data: u }) => { setUserId(u.user?.id ?? null); setUserEmail(u.user?.email ?? null); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED" && event !== "INITIAL_SESSION") return;
      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // On sign-in: pull the saved record, or upload the current one for a new account.
  useEffect(() => {
    setCloudReady(false);
    if (!userId) { setSyncState("local"); return; }
    let cancelled = false;
    setSyncState("syncing");
    (async () => {
      const { data: row, error } = await supabase.from("patient_data").select("data").eq("user_id", userId).maybeSingle();
      if (cancelled) return;
      if (error) { setSyncState("error"); return; }
      if (row?.data) {
        const remote = normalize(row.data as unknown as AppData);
        localStorage.setItem(KEY, JSON.stringify(remote));
        setData(remote);
      } else {
        const current = load();
        const { error: e2 } = await supabase.from("patient_data").insert({ user_id: userId, data: current as unknown as Json });
        if (e2) { setSyncState("error"); return; }
      }
      setCloudReady(true);
      setSyncState("saved");
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Push changes to the account (debounced).
  useEffect(() => {
    if (!userId || !cloudReady || !data) return;
    const t = window.setTimeout(async () => {
      setSyncState("syncing");
      const { error } = await supabase.from("patient_data").upsert({ user_id: userId, data: data as unknown as Json, updated_at: new Date().toISOString() });
      setSyncState(error ? "error" : "saved");
    }, 800);
    return () => window.clearTimeout(t);
  }, [data, userId, cloudReady]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = syncCaregiverAlerts(fn(prev));
      if (next === prev) return prev;
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const refresh = () => update((d) => d);
    refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [data !== null, update]);

  const store = useMemo<Store>(
    () => ({
      data, userEmail, syncState,
      demoDoctor, setDemoDoctor,
      saveQuestions: (questions) => update((d) => ({ ...d, consultationQuestions: questions })),
      pinQuestion: (text) => update((d) => (d.pinnedQuestions ?? []).some((q) => q.text === text) ? d : ({ ...d, pinnedQuestions: [...(d.pinnedQuestions ?? []), { id: uid(), text, createdAt: new Date().toISOString(), discussed: false }] })),
      removeQuestion: (id) => update((d) => ({ ...d, pinnedQuestions: (d.pinnedQuestions ?? []).filter((q) => q.id !== id) })),
      toggleDiscussed: (id) => update((d) => ({ ...d, pinnedQuestions: (d.pinnedQuestions ?? []).map((q) => q.id === id ? { ...q, discussed: !q.discussed } : q) })),
      saveDoctorResponse: (response) => {
        if (!demoDoctor) return;
        update((d) => ({ ...d, doctorNotes: response.notes, doctorResponseAt: new Date().toISOString(), followUpInstructions: response.followUpInstructions, carePlan: { ...d.carePlan, goal: response.goal, explanation: response.explanation, doctorFeedback: response.feedback, followUpDate: response.followUpDate } }));
      },
      addReading: (r) =>
        update((d) => ({ ...d, readings: [...d.readings, { ...r, id: uid(), unit: "mmol/L", source: "user" }] })),
      addDeviceReadings: (rs) =>
        update((d) => {
          const seen = new Set(d.readings.filter((r) => r.source === "device").map((r) => r.timestamp.slice(0, 16)));
          const fresh = rs.filter((r) => !seen.has(r.timestamp.slice(0, 16)) && seen.add(r.timestamp.slice(0, 16)));
          if (!fresh.length) return d;
          return { ...d, readings: [...d.readings, ...fresh.map((r) => ({ ...r, id: uid(), unit: "mmol/L" as const, source: "device" as const }))] };
        }),
      addLog: (l) => update((d) => ({ ...d, logs: [...d.logs, { ...l, id: uid(), source: "user" }] })),
      setCheckIn: (date, completed, reflection) =>
        update((d) => {
          const others = d.checkIns.filter((c) => c.date !== date);
          return { ...d, checkIns: [...others, { date, completed, reflection }] };
        }),
      setDoctorNotes: (notes) => { if (demoDoctor) update((d) => ({ ...d, doctorNotes: notes })); },
      saveCaregiver: (settings) => update((d) => ({ ...d, caregiver: settings })),
      revokeCaregiver: () => update((d) => ({ ...d, caregiver: { ...(d.caregiver ?? DEFAULT_CAREGIVER), shareRepeated: false, shareSafety: false } })),
      acknowledgeCaregiver: (id) => update((d) => ({ ...d, caregiverAlerts: (d.caregiverAlerts ?? []).map((alert) => alert.id === id && !alert.acknowledgedAt && sharingAllows(d.caregiver, alert.category) ? { ...alert, acknowledgedAt: new Date().toISOString() } : alert) })),
      saveEmergency: (info) => update((d) => ({ ...d, emergency: info })),
      saveMedication: (schedule) => update((d) => {
        const id = schedule.id ?? uid();
        return { ...d, medicationSchedules: [...(d.medicationSchedules ?? []).filter((s) => s.id !== id), { ...schedule, id }] };
      }),
      removeMedication: (id) => update((d) => ({ ...d,
        medicationSchedules: (d.medicationSchedules ?? []).filter((s) => s.id !== id),
        medicationStatuses: (d.medicationStatuses ?? []).filter((s) => s.scheduleId !== id),
      })),
      markMedication: (id, status, now = new Date(), extra) => update((d) => {
        const schedule = d.medicationSchedules?.find((s) => s.id === id);
        if (!schedule?.days.includes(now.getDay())) return d;
        const date = localDay(now);
        return { ...d, medicationStatuses: [...(d.medicationStatuses ?? []).filter((s) => s.scheduleId !== id || s.date !== date), {
          scheduleId: id, date, status, updatedAt: now.toISOString(),
          ...(status === "skipped" && extra?.reason ? { reason: extra.reason, ...(extra.note ? { note: extra.note } : {}) } : {}),
          ...(status === "later" ? { remindAt: new Date(now.getTime() + 15 * 60000).toISOString() } : {}),
        }] };
      }),
      resetDemo: () => {
        const fresh = generateSampleData();
        localStorage.setItem(KEY, JSON.stringify(fresh));
        setData(fresh);
        setDemoDoctor(false);
      },
      loadScenario: (scenario) => {
        const fresh = generateSampleData(new Date(), scenario);
        localStorage.setItem(KEY, JSON.stringify(fresh));
        setData(fresh);
        setDemoDoctor(false);
      },
    }),
    [data, update, demoDoctor, userEmail, syncState],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be inside StoreProvider");
  return s;
}
