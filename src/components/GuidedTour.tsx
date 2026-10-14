import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const WELCOME_KEY = "diamonitor-welcome-dismissed";

type Step = { title: string; to: string; search?: Record<string, string>; target?: string };
const STEPS: Step[] = [
  { title: "Overview: status and key insight", to: "/", target: "key-insight" },
  { title: "Overview: fasting forecast card", to: "/", target: "forecast-card" },
  { title: "My Health > Patterns: personal insights and what-if dinner", to: "/health", search: { tab: "patterns" }, target: "patterns-tab" },
  { title: "My Health > Log activity: scan meal photo", to: "/health", search: { tab: "log" }, target: "log-activity" },
  { title: "AI Copilot: pre-fill a question", to: "/copilot", target: "copilot-input" },
  { title: "Caregiver view", to: "/caregiver", target: "caregiver-view" },
  { title: "Emergency card", to: "/emergency", target: "emergency-card" },
  { title: "Doctor Visit: 30-second consultation brief", to: "/doctor", target: "consultation-brief" },
];

export const TOUR_PREFILL_KEY = "diamonitor-tour-prefill";

interface TourContext {
  active: boolean;
  start: () => void;
  exit: () => void;
}
const Ctx = createContext<TourContext | null>(null);
export function useTour() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTour must be inside TourProvider");
  return ctx;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(WELCOME_KEY)) setWelcomeOpen(true);
    } catch { /* storage may be unavailable */ }
  }, []);

  function dismissWelcome() {
    setWelcomeOpen(false);
    try { localStorage.setItem(WELCOME_KEY, "1"); } catch { /* ignore */ }
  }

  function goToStep(index: number) {
    const s = STEPS[index];
    if (!s) return;
    navigate({ to: s.to, search: s.search ?? {} });
  }

  useEffect(() => {
    document.querySelectorAll(".tour-highlight").forEach((el) => el.classList.remove("tour-highlight"));
    if (!active) return;
    const target = STEPS[step]?.target;
    if (!target) return;
    let tries = 0;
    const id = window.setInterval(() => {
      const el = document.querySelector(`[data-tour="${target}"]`);
      tries += 1;
      if (el) {
        el.classList.add("tour-highlight");
        el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        window.clearInterval(id);
      } else if (tries > 20) {
        window.clearInterval(id);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [active, step, path]);

  function start() {
    dismissWelcome();
    setStep(0);
    setActive(true);
    goToStep(0);
  }
  function exit() {
    setActive(false);
    document.querySelectorAll(".tour-highlight").forEach((el) => el.classList.remove("tour-highlight"));
  }
  function next() {
    if (step === 4) {
      try { localStorage.setItem(TOUR_PREFILL_KEY, t("Why were my mornings high?")); } catch { /* ignore */ }
    }
    if (step >= STEPS.length - 1) { exit(); return; }
    const n = step + 1;
    setStep(n);
    goToStep(n);
  }
  function back() {
    if (step <= 0) return;
    const n = step - 1;
    setStep(n);
    goToStep(n);
  }

  return (
    <Ctx.Provider value={{ active, start, exit }}>
      {children}
      <Dialog open={welcomeOpen} onOpenChange={(open) => { if (!open) dismissWelcome(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Welcome to DiaMonitor Copilot")}</DialogTitle></DialogHeader>
          <ul className="space-y-2 text-[15px]">
            <li>• {t("Predicts your morning trend")}</li>
            <li>• {t("Explains your own patterns")}</li>
            <li>• {t("Malaysian food aware")}</li>
            <li>• {t("Keeps caregivers in the loop")}</li>
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button className="h-12 flex-1" onClick={start}>{t("Take the 2-minute tour")}</Button>
            <Button variant="outline" className="h-12 flex-1" onClick={dismissWelcome}>{t("Explore on my own")}</Button>
          </div>
        </DialogContent>
      </Dialog>
      {active && (
        <div
          role="dialog"
          aria-label={t("Take the tour")}
          className="no-print fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto flex w-[94%] max-w-xl flex-wrap items-center justify-between gap-2 rounded-xl border bg-background p-3 shadow-lg md:bottom-4"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{t("Step {current} of {total}", { current: step + 1, total: STEPS.length })}</p>
            <p className="truncate text-sm font-semibold text-navy">{t(STEPS[step]?.title ?? "")}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" className="h-10" onClick={back} disabled={step === 0}>{t("Back")}</Button>
            <Button size="sm" className="h-10" onClick={next}>{step === STEPS.length - 1 ? t("Finish") : t("Next")}</Button>
            <Button variant="ghost" size="sm" className="h-10" onClick={exit}>{t("Exit")}</Button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
