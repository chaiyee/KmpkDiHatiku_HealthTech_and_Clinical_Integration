import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  Utensils,
  Activity,
  Pill,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useClock } from "@/hooks/use-clock";
import { sharingAllows } from "@/lib/caregiver";
import { replayDays } from "@/lib/health-replay";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type Feeling = "okay" | "unwell" | "help";
export function HealthReplay() {
  const { t, format } = useLanguage();
  const { data } = useStore();
  const now = useClock();
  const [demo, setDemo] = useState(false);
  const [day, setDay] = useState(2);
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  if (!data) return null;
  const days = replayDays(data, now);
  const selected = days[day]!;
  const values = demo ? [9.2, 9.6, 10.1] : days.map((d) => d.reading?.value);
  const value = values[day];
  const complete = values.every((v) => v !== undefined);
  const rising = complete && values[0]! < values[1]! && values[1]! < values[2]!;
  const sharing = sharingAllows(data.caregiver, "safety");
  function reset(example: boolean) {
    setDemo(example);
    setDay(example ? 0 : 2);
    setFeeling(null);
  }
  const context = [
    {
      category: "meal",
      icon: Utensils,
      title: "Meal",
      example: ["Dinner recorded at 8 pm", "Dinner recorded at 9 pm", "Dinner recorded at 9:30 pm"],
    },
    {
      category: "activity",
      icon: Activity,
      title: "Activity",
      example: ["30-minute walk recorded", "15-minute walk recorded", "No activity record"],
    },
    {
      category: "medication",
      icon: Pill,
      title: "Medication record",
      example: [
        "Medication record available",
        "Medication record available",
        "No medication record",
      ],
    },
  ];
  return (
    <Card className="overflow-hidden border-primary/25">
      <CardHeader className="welcome-panel rounded-none border-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
              {t(demo ? "Interactive example · not saved" : "Your last three days")}
            </p>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("What changed?")}
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("Explore your mornings, then see how a wellbeing check-in works.")}
            </p>
          </div>
          <Button variant="outline" onClick={() => reset(!demo)}>
            {demo ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {t(demo ? "Back to my records" : "Play three-day example")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("Choose a day")}>
          {days.map((d, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={day === i}
              onClick={() => setDay(i)}
              className={`min-h-24 rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary ${day === i ? "border-primary bg-accent" : "bg-muted/40 hover:bg-muted"}`}
            >
              <span className="block text-xs text-muted-foreground">
                {format(d.date, "EEE, d MMM")}
              </span>
              <span className="mt-2 block text-xl font-semibold text-navy">
                {values[i]?.toFixed(1) ?? "—"}
              </span>
              <span className="block text-xs text-muted-foreground">
                {values[i] === undefined ? t("No fasting reading") : "mmol/L"}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-navy">
            {t(
              !complete
                ? "Some days have no fasting reading"
                : rising
                  ? "Morning readings rose across these days"
                  : "Review each day for context",
            )}
          </p>
          {demo && day < 2 && (
            <Button onClick={() => setDay(day + 1)}>
              {t("Next day")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="rounded-xl border p-4">
          <p className="mb-3 text-sm font-semibold">
            {format(selected.date, "EEEE, d MMM")} · {t("Recorded context")}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {context.map(({ category, icon: Icon, title, example }) => {
              const logs = selected.logs.filter((l) => l.category === category);
              return (
                <div key={category} className="rounded-lg bg-muted/50 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-primary" />
                    {t(title)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {demo
                      ? t(example[day]!)
                      : logs.length
                        ? logs
                            .map((l) => `${format(new Date(l.timestamp), "HH:mm")} · ${l.title}`)
                            .join("\n")
                        : t("No record for this day")}
                  </p>
                </div>
              );
            })}
          </div>
          {!demo && value !== undefined && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t(
                selected.reading?.source === "user"
                  ? "You"
                  : selected.reading?.source === "device"
                    ? "Simulated device"
                    : "Sample",
              )}
            </p>
          )}
        </div>
        {demo && day === 2 && (
          <div className="space-y-3 rounded-xl bg-secondary p-4">
            <p className="text-lg font-semibold">{t("How are you feeling?")}</p>
            <p className="text-sm text-muted-foreground">
              {t("Try an answer. This example does not save symptoms or create alerts.")}
            </p>
            <div className="flex flex-wrap gap-2">
              {(["okay", "unwell", "help"] as const).map((f) => (
                <Button
                  key={f}
                  variant={feeling === f ? "default" : "outline"}
                  aria-pressed={feeling === f}
                  onClick={() => setFeeling(f)}
                >
                  {t(
                    f === "okay" ? "I feel okay" : f === "unwell" ? "I feel unwell" : "I need help",
                  )}
                </Button>
              ))}
            </div>
            {feeling && (
              <div role="status" className="space-y-2 rounded-lg border bg-card p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  {t(
                    feeling === "okay"
                      ? "Example outcome: no extra caregiver alert"
                      : sharing
                        ? "Example outcome: caregiver sharing allowed"
                        : "Example outcome: caregiver sharing is off",
                  )}
                </p>
                <p className="text-sm">
                  {t(
                    feeling === "okay"
                      ? "Feeling okay acknowledges the check-in. It does not confirm the readings are safe; monitoring and urgent guidance still apply."
                      : "Preview only · no messages sent",
                  )}
                </p>
                {feeling !== "okay" && (
                  <p className="text-sm font-medium">
                    {t(
                      "If symptoms are severe, seek urgent help. Do not wait for a caregiver response.",
                    )}
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <Link to="/care-plan" className="text-sm font-medium text-primary underline">
                    {t("Change preferences")}
                  </Link>
                  <Link
                    to="/health"
                    search={{ tab: "devices" }}
                    className="text-sm font-medium text-primary underline"
                  >
                    {t("Open Guardian preview")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
        {!demo && (
          <Link
            to="/health"
            search={{ tab: "patterns" }}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
          >
            {t("See supporting records")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
