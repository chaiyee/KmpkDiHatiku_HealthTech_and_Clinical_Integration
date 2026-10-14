import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Phone, Play, X } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { sharingAllows } from "@/lib/caregiver";

const CARBS = [
  "3 teaspoons of sugar dissolved in a small glass of water",
  "1 tablespoon of honey",
  "120 ml regular soft drink or fruit juice — check the label for 15 g carbohydrate",
  "Glucose tablets or hard sweets — check the pack for 15 g",
];
const TOTAL = 15 * 60;

export function LowGlucoseRescue({
  value,
  onRecheck,
  onClose,
}: {
  value: number;
  onRecheck: () => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const { data, addLog } = useStore();
  const [left, setLeft] = useState(TOTAL);
  const [running, setRunning] = useState(false);
  const started = useRef(false);
  const deadline = useRef<number | null>(null);
  const sound = useRef<AudioContext | null>(null);
  const [needsHelp, setNeedsHelp] = useState(false);
  useEffect(
    () => () => {
      void sound.current?.close();
    },
    [],
  );
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil(((deadline.current ?? Date.now()) - Date.now()) / 1000),
      );
      setLeft(remaining);
      if (remaining === 0) {
        setRunning(false);
        const ctx = sound.current;
        if (ctx?.state === "running") {
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          gain.gain.value = 0.15;
          oscillator.connect(gain);
          gain.connect(ctx.destination);
          oscillator.frequency.value = 660;
          oscillator.start();
          oscillator.stop(ctx.currentTime + 1);
        }
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running]);
  const hypo = data?.thresholds?.hypo ?? 4.0;
  const caregiverOk = sharingAllows(data?.caregiver, "safety");
  const phone = data?.caregiver?.phone?.trim();
  function start() {
    if (typeof window.AudioContext === "function") {
      try {
        sound.current ??= new AudioContext();
        void sound.current.resume().catch(() => {});
      } catch {
        /* Visual reminder remains available. */
      }
    }
    if (!started.current) {
      started.current = true;
      addLog({
        category: "symptom",
        title: t("Low glucose rescue started"),
        detail: `${value.toFixed(1)} mmol/L · ${t("15 g fast-acting carbohydrate, 15-minute recheck timer")}`,
        timestamp: new Date().toISOString(),
      });
    }
    deadline.current = Date.now() + TOTAL * 1000;
    setLeft(TOTAL);
    setRunning(true);
  }
  const mm = String(Math.floor(left / 60)).padStart(2, "0"),
    ss = String(left % 60).padStart(2, "0");
  return (
    <section
      role="alertdialog"
      aria-labelledby="rescue-title"
      className="mb-4 space-y-4 rounded-lg border-2 border-destructive bg-danger-soft p-4 text-[16px]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          id="rescue-title"
          className="flex items-center gap-2 text-lg font-bold text-destructive"
        >
          <AlertTriangle className="h-6 w-6 shrink-0" />
          {t("Low blood sugar")}: {value.toFixed(1)} mmol/L
        </h3>
        <Button variant="ghost" size="icon" aria-label={t("Close")} onClick={onClose}>
          <X />
        </Button>
      </div>
      <div className="rounded-md bg-card p-3">
        <p className="font-bold text-destructive">
          {t(
            "Call 999 now if the person is drowsy, confused, having a seizure, unconscious, or cannot swallow safely.",
          )}
        </p>
        <p className="mt-1">
          {t(
            "Never give food, drink or sugar by mouth to someone who is unconscious or cannot swallow — they may choke.",
          )}
        </p>
        <Button asChild variant="destructive" className="mt-3 h-12 w-full text-base">
          <a href="tel:999">
            <Phone />
            {t("Call 999")}
          </a>
        </Button>
      </div>
      <div>
        <p className="font-semibold">
          {t("If you are awake and can swallow safely, follow the 15-15 rule:")}
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-6">
          <li>{t("Take 15 g of fast-acting sugar now.")}</li>
          <li>{t("Sit down and rest for 15 minutes.")}</li>
          <li>
            {t(
              "Recheck after 15 minutes. If still below {threshold} mmol/L, repeat the steps. Seek urgent help if symptoms worsen or you cannot treat the low safely.",
              { threshold: hypo.toFixed(1) },
            )}
          </li>
          <li>
            {t(
              "When it is {threshold} or higher, eat your next meal or a small snack (e.g. bread or biscuits).",
              { threshold: hypo.toFixed(1) },
            )}
          </li>
        </ol>
      </div>
      <Button
        variant="destructive"
        className="min-h-12 w-full whitespace-normal"
        onClick={() => setNeedsHelp(true)}
      >
        {t("I don't have sugar / I feel dizzy")}
      </Button>
      {needsHelp && (
        <div role="alert" className="rounded-md border border-destructive bg-card p-3">
          <p className="font-semibold">
            {t(
              "Ask someone nearby to help now. If you cannot treat the low safely or symptoms are severe, call 999. Do not wait for the timer or caregiver notification.",
            )}
          </p>
        </div>
      )}
      <div>
        <p className="font-semibold">{t("15 g fast-acting sugar — choose ONE:")}</p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          {CARBS.map((c) => (
            <li key={c}>{t(c)}</li>
          ))}
        </ul>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Chocolate and kuih are slower — not for treating a low.")}
        </p>
      </div>
      <div className="rounded-md bg-card p-3 text-center">
        <p className="text-4xl font-bold tabular-nums" role="timer" aria-label={t("Recheck timer")}>
          {mm}:{ss}
        </p>
        {left === 0 && (
          <p role="alert" className="font-bold text-destructive">
            {t("15 minutes are up. Recheck your glucose now.")}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {left === 0 ? t("15 minutes are up. Recheck your glucose now.") : t("Recheck timer")}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="min-h-12 whitespace-normal"
            onClick={start}
            disabled={running || left === 0}
          >
            <Play />
            {t(running ? "Timer running" : "I've taken sugar — start 15 minutes")}
          </Button>
          <Button
            className="h-12"
            onClick={() => {
              setRunning(false);
              onRecheck();
            }}
          >
            {t("Recheck Now")}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t(
            "Keep this page open. Sound depends on your browser and device volume; this is not a background alarm.",
          )}
        </p>
      </div>
      <p className="text-sm">
        {caregiverOk
          ? t(
              "A simulated safety alert is visible to your caregiver in this app. No SMS or WhatsApp was sent.",
            )
          : t("Caregiver sharing is off, so no caregiver alert was created.")}
      </p>
      {phone && (
        <Button asChild variant="outline" className="h-12 w-full">
          <a href={`tel:${phone}`}>
            <Phone />
            {t("Call Caregiver")}
          </a>
        </Button>
      )}
      <a
        className="inline-block text-sm text-primary underline"
        href="https://www.cdc.gov/diabetes/treatment/treatment-low-blood-sugar-hypoglycemia.html"
        target="_blank"
        rel="noreferrer"
      >
        {t("Source: CDC low blood sugar guidance")}
      </a>
    </section>
  );
}
