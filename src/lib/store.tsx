import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
  type Context,
} from "react";
import { generateSampleData, DEMO_THRESHOLDS, type DemoScenario } from "./sample-data";
import type {
  AppData,
  GlucoseReading,
  HealthLog,
  MedicationSchedule,
  MedicationAction,
  CaregiverSettings,
  EmergencyInfo,
} from "./types";
import { localDay } from "./medications";
import { saveConfirmedMeal } from "./meals";
import { saveActivity as applyActivity } from "./activity";
import { accountKey, emptyAccount, sameCloudVersion } from "./persistence";
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

function load(key = KEY): AppData {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return normalize(JSON.parse(raw) as AppData);
  } catch {
    /* ignore */
  }
  return key === KEY ? generateSampleData() : emptyAccount(generateSampleData());
}

interface Store {
  data: AppData | null;
  userEmail: string | null;
  syncState: "local" | "syncing" | "saved" | "error";
  retrySync: () => void;
  demoDoctor: boolean;
  setDemoDoctor: (enabled: boolean) => void;
  saveQuestions: (questions: string) => void;
  pinQuestion: (text: string) => void;
  removeQuestion: (id: string) => void;
  toggleDiscussed: (id: string) => void;
  saveDoctorResponse: (response: {
    notes: string;
    feedback: string;
    goal: string;
    explanation: string;
    followUpInstructions: string;
    followUpDate: string;
  }) => void;
  addReading: (r: Omit<GlucoseReading, "id" | "source" | "unit">) => void;
  addLog: (l: Omit<HealthLog, "id" | "source">) => void;
  saveMeal: (log: HealthLog) => void;
  saveActivity: (log: HealthLog) => void;
  removeActivity: (id: string) => void;
  saveActivityReminder: (reminder: NonNullable<AppData["activityReminder"]>) => void;
  dismissMealReminder: (id: string) => void;
  /** Simulated device readings; skips any with a timestamp already recorded from a device. */
  addDeviceReadings: (rs: Omit<GlucoseReading, "id" | "source" | "unit">[]) => void;
  setCheckIn: (date: string, completed: boolean, reflection?: string) => void;
  setDoctorNotes: (notes: string) => void;
  resetDemo: () => void;
  loadScenario: (scenario: DemoScenario) => void;
  saveMedication: (schedule: Omit<MedicationSchedule, "id"> & { id?: string }) => void;
  removeMedication: (id: string) => void;
  markMedication: (
    id: string,
    status: MedicationAction,
    now?: Date,
    extra?: { reason?: string; note?: string },
  ) => void;
  saveCaregiver: (settings: CaregiverSettings) => void;
  revokeCaregiver: () => void;
  acknowledgeCaregiver: (id: string) => void;
  /** Guardian demo check-in: records the feeling once per day; "unwell"/"help" may create one simulated safety alert per day if consent allows. */
  guardianCheckIn: (feeling: "okay" | "unwell" | "help") => { alerted: boolean };
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
  const [syncAttempt, setSyncAttempt] = useState(0);
  const activeKey = useRef(KEY);
  const accountGeneration = useRef(0);
  const cloudVersion = useRef<string | null>(null);
  const dirty = useRef(false);

  useEffect(() => setData(load()), []);

  // Track the signed-in account.
  useEffect(() => {
    let authChanged = false;
    supabase.auth.getUser().then(({ data: u }) => {
      if (authChanged) return;
      setUserId(u.user?.id ?? null);
      setUserEmail(u.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT" &&
        event !== "USER_UPDATED" &&
        event !== "INITIAL_SESSION"
      )
        return;
      authChanged = true;
      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? null);
    });
    return () => {
      authChanged = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // On sign-in: pull the saved record, or upload the current one for a new account.
  useEffect(() => {
    const generation = ++accountGeneration.current;
    setCloudReady(false);
    activeKey.current = accountKey(userId);
    setDemoDoctor(false);
    const cached = load(activeKey.current);
    setData(cached);
    dirty.current = localStorage.getItem(`${activeKey.current}:dirty`) === "true";
    cloudVersion.current = localStorage.getItem(`${activeKey.current}:version`);
    if (!userId) {
      setSyncState("local");
      return;
    }
    let cancelled = false;
    setSyncState("syncing");
    (async () => {
      const { data: row, error } = await supabase
        .from("patient_data")
        .select("data,updated_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setSyncState("error");
        return;
      }
      if (row?.data) {
        if (dirty.current && !sameCloudVersion(cloudVersion.current, row.updated_at)) {
          setSyncState("error");
          return;
        }
        const remote = normalize(row.data as unknown as AppData);
        cloudVersion.current = row.updated_at;
        localStorage.setItem(`${activeKey.current}:version`, row.updated_at);
        if (!dirty.current) {
          localStorage.setItem(activeKey.current, JSON.stringify(remote));
          setData(remote);
        }
      } else {
        const current = cached;
        const version = new Date().toISOString();
        const { error: e2 } = await supabase
          .from("patient_data")
          .insert({ user_id: userId, data: current as unknown as Json, updated_at: version });
        if (cancelled || generation !== accountGeneration.current) return;
        if (e2) {
          setSyncState("error");
          return;
        }
        cloudVersion.current = version;
        localStorage.setItem(`${activeKey.current}:version`, version);
      }
      setCloudReady(true);
      setSyncState(dirty.current ? "syncing" : "saved");
    })().catch(() => {
      if (!cancelled) setSyncState("error");
    });
    return () => {
      cancelled = true;
    };
  }, [userId, syncAttempt]);

  useEffect(() => {
    const retry = () => setSyncAttempt((value) => value + 1);
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, []);

  // Push changes to the account (debounced).
  useEffect(() => {
    if (!userId || !cloudReady || !data || !dirty.current) return;
    const generation = accountGeneration.current;
    const key = accountKey(userId);
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setSyncState("syncing");
      const version = new Date().toISOString();
      const { data: changed, error } = await supabase
        .from("patient_data")
        .update({
          data: data as unknown as Json,
          updated_at: version,
        })
        .eq("user_id", userId)
        .eq("updated_at", cloudVersion.current!)
        .select("updated_at");
      if (generation !== accountGeneration.current) return;
      if (!error && changed?.length) {
        cloudVersion.current = changed[0]!.updated_at;
        localStorage.setItem(`${key}:version`, changed[0]!.updated_at);
        if (!cancelled) {
          dirty.current = false;
          localStorage.removeItem(`${key}:dirty`);
        }
      }
      if (!cancelled) setSyncState(error || !changed?.length ? "error" : "saved");
    }, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [data, userId, cloudReady]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = syncCaregiverAlerts(fn(prev));
      if (next === prev) return prev;
      localStorage.setItem(activeKey.current, JSON.stringify(next));
      dirty.current = true;
      if (activeKey.current !== KEY) setSyncState("syncing");
      localStorage.setItem(`${activeKey.current}:dirty`, "true");
      return next;
    });
  }, []);

  useEffect(() => {
    const refresh = () => update((d) => d);
    refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [data !== null, update]);

  const store = useMemo<Store>(
    () => ({
      data,
      userEmail,
      syncState,
      retrySync: () => setSyncAttempt((value) => value + 1),
      demoDoctor,
      setDemoDoctor,
      saveQuestions: (questions) => update((d) => ({ ...d, consultationQuestions: questions })),
      pinQuestion: (text) =>
        update((d) =>
          (d.pinnedQuestions ?? []).some((q) => q.text === text)
            ? d
            : {
                ...d,
                pinnedQuestions: [
                  ...(d.pinnedQuestions ?? []),
                  { id: uid(), text, createdAt: new Date().toISOString(), discussed: false },
                ],
              },
        ),
      removeQuestion: (id) =>
        update((d) => ({
          ...d,
          pinnedQuestions: (d.pinnedQuestions ?? []).filter((q) => q.id !== id),
        })),
      toggleDiscussed: (id) =>
        update((d) => ({
          ...d,
          pinnedQuestions: (d.pinnedQuestions ?? []).map((q) =>
            q.id === id ? { ...q, discussed: !q.discussed } : q,
          ),
        })),
      saveDoctorResponse: (response) => {
        if (!demoDoctor) return;
        update((d) => ({
          ...d,
          doctorNotes: response.notes,
          doctorResponseAt: new Date().toISOString(),
          followUpInstructions: response.followUpInstructions,
          carePlan: {
            ...d.carePlan,
            goal: response.goal,
            explanation: response.explanation,
            doctorFeedback: response.feedback,
            followUpDate: response.followUpDate,
          },
        }));
      },
      addReading: (r) =>
        update((d) => ({
          ...d,
          readings: [...d.readings, { ...r, id: uid(), unit: "mmol/L", source: "user" }],
        })),
      addDeviceReadings: (rs) =>
        update((d) => {
          const seen = new Set(
            d.readings.filter((r) => r.source === "device").map((r) => r.timestamp.slice(0, 16)),
          );
          const fresh = rs.filter(
            (r) => !seen.has(r.timestamp.slice(0, 16)) && seen.add(r.timestamp.slice(0, 16)),
          );
          if (!fresh.length) return d;
          return {
            ...d,
            readings: [
              ...d.readings,
              ...fresh.map((r) => ({
                ...r,
                id: uid(),
                unit: "mmol/L" as const,
                source: "device" as const,
              })),
            ],
          };
        }),
      addLog: (l) =>
        update((d) => ({ ...d, logs: [...d.logs, { ...l, id: uid(), source: "user" }] })),
      saveMeal: (log) =>
        update((d) => {
          if (log.category !== "meal" || log.source !== "user") return d;
          const logs = saveConfirmedMeal(d.logs, log);
          return logs === d.logs ? d : { ...d, logs };
        }),
      saveActivity: (log) => update((d) => ({ ...d, logs: applyActivity(d.logs, log) })),
      removeActivity: (id) =>
        update((d) => ({
          ...d,
          logs: d.logs.filter(
            (log) => !(log.id === id && log.source === "user" && log.category === "activity"),
          ),
        })),
      saveActivityReminder: (activityReminder) => update((d) => ({ ...d, activityReminder })),
      dismissMealReminder: (id) =>
        update((d) => ({
          ...d,
          logs: d.logs.map((log) =>
            log.id === id && log.meal
              ? { ...log, meal: { ...log.meal, reminderDismissedAt: new Date().toISOString() } }
              : log,
          ),
        })),
      setCheckIn: (date, completed, reflection) =>
        update((d) => {
          const others = d.checkIns.filter((c) => c.date !== date);
          return { ...d, checkIns: [...others, { date, completed, reflection }] };
        }),
      setDoctorNotes: (notes) => {
        if (demoDoctor) update((d) => ({ ...d, doctorNotes: notes }));
      },
      saveCaregiver: (settings) => update((d) => ({ ...d, caregiver: settings })),
      revokeCaregiver: () =>
        update((d) => ({
          ...d,
          caregiver: {
            ...(d.caregiver ?? DEFAULT_CAREGIVER),
            shareRepeated: false,
            shareSafety: false,
          },
        })),
      acknowledgeCaregiver: (id) =>
        update((d) => ({
          ...d,
          caregiverAlerts: (d.caregiverAlerts ?? []).map((alert) =>
            alert.id === id && !alert.acknowledgedAt && sharingAllows(d.caregiver, alert.category)
              ? { ...alert, acknowledgedAt: new Date().toISOString() }
              : alert,
          ),
        })),
      guardianCheckIn: (feeling) => {
        const alerted = feeling !== "okay" && !!data && sharingAllows(data.caregiver, "safety");
        update((d) => {
          const now = new Date();
          const day = localDay(now);
          const titles = {
            okay: "Feeling okay (Guardian check-in)",
            unwell: "Feeling unwell (Guardian check-in)",
            help: "Needs help (Guardian check-in)",
          } as const;
          const title = titles[feeling];
          // Replay-safe: one log per feeling per day.
          const logs = d.logs.some(
            (l) => l.title === title && localDay(new Date(l.timestamp)) === day,
          )
            ? d.logs
            : [
                ...d.logs,
                {
                  id: uid(),
                  source: "user" as const,
                  timestamp: now.toISOString(),
                  category: "symptom" as const,
                  title,
                  detail: "Simulated Guardian Mode demo",
                },
              ];
          let caregiverAlerts = d.caregiverAlerts ?? [];
          if (feeling !== "okay" && sharingAllows(d.caregiver, "safety")) {
            const id = `guardian-${feeling}-${day}`;
            if (!caregiverAlerts.some((a) => a.id === id)) {
              const evidence = d.readings
                .filter((r) => r.source === "device")
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                .slice(0, 3);
              caregiverAlerts = [
                {
                  id,
                  category: "safety" as const,
                  title:
                    feeling === "help"
                      ? "Patient asked for help (Guardian check-in)"
                      : "Patient reported feeling unwell (Guardian check-in)",
                  summary:
                    "Reported during the simulated Guardian Mode check-in after a repeated high fasting pattern.",
                  rule: "Patient-reported symptom with safety-alert sharing consent",
                  evidence: evidence.map((r) => ({ ...r })),
                  thresholds: { ...d.thresholds },
                  createdAt: now.toISOString(),
                },
                ...caregiverAlerts,
              ];
            }
          }
          return { ...d, logs, caregiverAlerts };
        });
        return { alerted };
      },
      saveEmergency: (info) => update((d) => ({ ...d, emergency: info })),
      saveMedication: (schedule) =>
        update((d) => {
          const id = schedule.id ?? uid();
          return {
            ...d,
            medicationSchedules: [
              ...(d.medicationSchedules ?? []).filter((s) => s.id !== id),
              { ...schedule, id },
            ],
          };
        }),
      removeMedication: (id) =>
        update((d) => ({
          ...d,
          medicationSchedules: (d.medicationSchedules ?? []).filter((s) => s.id !== id),
          medicationStatuses: (d.medicationStatuses ?? []).filter((s) => s.scheduleId !== id),
        })),
      markMedication: (id, status, now = new Date(), extra) =>
        update((d) => {
          const schedule = d.medicationSchedules?.find((s) => s.id === id);
          if (!schedule?.days.includes(now.getDay())) return d;
          const date = localDay(now);
          return {
            ...d,
            medicationStatuses: [
              ...(d.medicationStatuses ?? []).filter((s) => s.scheduleId !== id || s.date !== date),
              {
                scheduleId: id,
                date,
                status,
                updatedAt: now.toISOString(),
                ...(status === "skipped" && extra?.reason
                  ? { reason: extra.reason, ...(extra.note ? { note: extra.note } : {}) }
                  : {}),
                ...(status === "later"
                  ? { remindAt: new Date(now.getTime() + 15 * 60000).toISOString() }
                  : {}),
              },
            ],
          };
        }),
      resetDemo: () => {
        const fresh = generateSampleData();
        localStorage.setItem(activeKey.current, JSON.stringify(fresh));
        dirty.current = true;
        localStorage.setItem(`${activeKey.current}:dirty`, "true");
        setData(fresh);
        setDemoDoctor(false);
      },
      loadScenario: (scenario) => {
        const fresh = generateSampleData(new Date(), scenario);
        localStorage.setItem(activeKey.current, JSON.stringify(fresh));
        dirty.current = true;
        localStorage.setItem(`${activeKey.current}:dirty`, "true");
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
