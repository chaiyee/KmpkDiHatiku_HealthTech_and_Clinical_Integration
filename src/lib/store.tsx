import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { generateSampleData } from "./sample-data";
import type { AppData, GlucoseReading, HealthLog } from "./types";

// Demo storage: browser localStorage. Swap these load/save functions for API calls when a backend exists.
const KEY = "diamonitor-demo-v1";

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AppData;
  } catch {
    /* ignore */
  }
  return generateSampleData();
}

interface Store {
  data: AppData | null;
  addReading: (r: Omit<GlucoseReading, "id" | "source" | "unit">) => void;
  addLog: (l: Omit<HealthLog, "id" | "source">) => void;
  setCheckIn: (date: string, completed: boolean, reflection?: string) => void;
  setDoctorNotes: (notes: string) => void;
  resetDemo: () => void;
}

const Ctx = createContext<Store | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => setData(load()), []);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const store = useMemo<Store>(
    () => ({
      data,
      addReading: (r) =>
        update((d) => ({ ...d, readings: [...d.readings, { ...r, id: uid(), unit: "mmol/L", source: "user" }] })),
      addLog: (l) => update((d) => ({ ...d, logs: [...d.logs, { ...l, id: uid(), source: "user" }] })),
      setCheckIn: (date, completed, reflection) =>
        update((d) => {
          const others = d.checkIns.filter((c) => c.date !== date);
          return { ...d, checkIns: [...others, { date, completed, reflection }] };
        }),
      setDoctorNotes: (notes) => update((d) => ({ ...d, doctorNotes: notes })),
      resetDemo: () => {
        const fresh = generateSampleData();
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
