import { HealthReplay } from "@/components/HealthReplay";
import { useLanguage } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { startOfDay, subDays } from "date-fns";
import { useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  MessageCircleQuestion,
  Plus,
  Lightbulb,
  Bluetooth,
  Pill,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { GlucoseForm } from "@/components/GlucoseForm";
import { PageLoading, SampleBadge, StatusPill, readingStatus } from "@/components/common";
import { useStore } from "@/lib/store";
import { detectPatterns } from "@/lib/patterns";
import { CONTEXT_LABELS } from "@/lib/types";
import { nextMedication } from "@/lib/medications";
import { useClock } from "@/hooks/use-clock";
import { CaregiverAlerts } from "@/components/CaregiverSupport";
import { FastingForecastCard } from "@/components/FastingForecastCard";
import { PersonalInsights } from "@/components/PersonalInsights";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Overview · DiaMonitor Copilot" },
      {
        name: "description",
        content: "Your diabetes summary: latest glucose, 7-day trend and one clear insight.",
      },
      { property: "og:title", content: "Overview · DiaMonitor Copilot" },
      {
        property: "og:description",
        content: "Your diabetes summary: latest glucose, 7-day trend and one clear insight.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { t: tr, format } = useLanguage();
  const { data } = useStore();
  const [open, setOpen] = useState(false);
  const now = useClock();
  if (!data) return <PageLoading />;
  const medication = nextMedication(
    data.medicationSchedules ?? [],
    data.medicationStatuses ?? [],
    now,
  );
  const t = data.thresholds;
  const sorted = [...data.readings].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const latest = sorted[0];
  const week = data.readings.filter(
    (r) => new Date(r.timestamp) >= startOfDay(subDays(now, 6)) && new Date(r.timestamp) <= now,
  );
  const days = new Set(week.map((r) => format(new Date(r.timestamp), "yyyy-MM-dd"))).size;
  const findings = detectPatterns(data.readings, t, now);
  const top =
    findings.find((f) => f.kind === "safety") ??
    findings.find((f) => f.severity !== "info") ??
    findings[0];
  const hour = now.getHours();
  const greet =
    hour < 12 ? tr("Good morning") : hour < 18 ? tr("Good afternoon") : tr("Good evening");

  return (
    <div className="space-y-7">
      <div className="page-header flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{format(now, "EEEE, d MMMM yyyy")}</p>
          <h1 className="font-semibold text-navy">
            {greet}, {data.patient.name.split(" ")[0]}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {tr("Your health today, one step at a time.")}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/copilot">
            <MessageCircleQuestion className="h-5 w-5" />
            {tr("Ask Copilot")}
          </Link>
        </Button>
      </div>
      {findings.some((finding) => finding.kind === "safety") && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive bg-danger-soft p-5 text-destructive"
        >
          <ShieldAlert className="mt-1 h-6 w-6 shrink-0" />
          <p className="font-medium">
            {tr(
              "For potentially urgent symptoms, seek medical assistance immediately; call 999 in Malaysia if needed. Do not wait for caregiver acknowledgement. Follow your clinic's agreed instructions.",
            )}
          </p>
        </div>
      )}
      <div className="grid items-stretch gap-5 xl:grid-cols-5">
        <Card className="primary-reading xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">{tr("Latest glucose")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latest ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <p className="text-4xl font-semibold leading-tight text-navy sm:text-5xl">
                    {latest.value.toFixed(1)}{" "}
                    <span className="text-lg font-normal text-muted-foreground">mmol/L</span>
                  </p>
                  <StatusPill status={readingStatus(latest, t)} />
                </div>
                <p className="text-muted-foreground">
                  {tr(CONTEXT_LABELS[latest.context])} ·{" "}
                  {format(new Date(latest.timestamp), "d MMM, h:mm a")}
                </p>
                <SampleBadge>
                  {tr(
                    latest.source === "sample"
                      ? "Sample reading"
                      : latest.source === "device"
                        ? "Simulated device"
                        : "Manually recorded",
                  )}
                </SampleBadge>
                <p className="text-sm text-muted-foreground">
                  {tr(
                    "Reference ranges in this workspace are for demonstration. Follow the targets agreed with your healthcare team.",
                  )}
                </p>
              </>
            ) : (
              <p>{tr("No readings yet.")}</p>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="min-h-12 w-full sm:w-auto">
                  <Plus />
                  {tr("Record glucose")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{tr("Record a glucose reading")}</DialogTitle>
                </DialogHeader>
                <GlucoseForm onDone={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        <Card className="next-action xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{tr("Your next step")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xl font-semibold text-navy">
              {tr(
                top?.kind === "safety"
                  ? "Review urgent guidance"
                  : "Take a moment for today's care",
              )}
            </p>
            <p className="text-muted-foreground">
              {tr(
                top?.kind === "safety"
                  ? "Follow your agreed safety instructions. Do not wait for a caregiver reply."
                  : "Check your medication reminders and complete your daily check-in.",
              )}
            </p>
            <Button asChild variant="outline" className="min-h-12 w-full">
              <Link to={top?.kind === "safety" ? "/emergency" : "/care-plan"}>
                {tr(top?.kind === "safety" ? "Emergency page" : "Open today's care")}
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <section aria-labelledby="overview-insight" className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 id="overview-insight" className="section-heading">
          <Lightbulb className="h-5 w-5 text-primary" />
          {tr("What to know")}
        </h2>
        <p className="mt-3 font-semibold text-navy">
          {top ? tr(top.title) : tr("No patterns detected.")}
        </p>
        {top && <p className="mt-1 text-muted-foreground">{tr(top.summary)}</p>}
        <Link
          to="/health"
          search={{ tab: "patterns" }}
          className="mt-3 inline-flex min-h-11 items-center gap-2 font-medium text-primary"
        >
          {tr("Review health trends")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <p className="flex items-center gap-2 font-semibold text-navy">
            <Pill className="h-5 w-5 text-primary" />
            {tr("Next medication reminder")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {medication ? (
              <>
                {medication.schedule.name} · {medication.schedule.dose} {medication.schedule.unit} ·{" "}
                {format(medication.at, "EEE, d MMM · HH:mm")}
                {medication.due && <> · {tr("Reminder due")}</>}
              </>
            ) : (
              tr("No medication scheduled.")
            )}
          </p>
          <Link
            to="/care-plan"
            hash="medication-reminders"
            className="mt-2 inline-flex min-h-11 items-center gap-2 font-medium text-primary"
          >
            {tr("Review medication status")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="flex items-center gap-2 font-semibold text-navy">
            <Bluetooth className="h-5 w-5 text-primary" />
            {tr("Connected Health")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr("Explore simulated sensors, reading updates and Guardian check-ins.")}
          </p>
          <Link
            to="/health"
            search={{ tab: "devices" }}
            className="mt-2 inline-flex min-h-11 items-center gap-2 font-medium text-primary"
          >
            {tr("Open monitoring preview")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <details className="disclosure">
        <summary className="font-semibold text-navy">{tr("Trends, progress & next visit")}</summary>
        <div className="mt-4 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{tr("Logging this week")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-navy">
                  {days}
                  <span className="text-base font-normal"> {tr("/ 7 days")}</span>
                </p>
                <Progress value={(days / 7) * 100} className="mt-3" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {week.length} {tr("readings recorded in the last 7 days")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  {tr("Next consultation")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">
                  {format(new Date(data.patient.nextVisit), "EEE, d MMM · h:mm a")}
                </p>
                <p className="mt-1 text-muted-foreground">{tr(data.patient.doctor)}</p>
                <Link
                  to="/doctor"
                  className="mt-2 inline-flex min-h-11 items-center font-medium text-primary"
                >
                  {tr("Prepare report")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
          <FastingForecastCard
            readings={data.readings}
            thresholds={t}
            now={now}
            nextVisit={new Date(data.patient.nextVisit)}
          />
          <PersonalInsights compact now={now} />
        </div>
      </details>
      <details className="disclosure">
        <summary className="font-semibold text-navy">
          {tr("Explore your three-day health story")}
        </summary>
        <div className="mt-4">
          <HealthReplay />
        </div>
      </details>
      <details className="disclosure">
        <summary className="font-semibold text-navy">{tr("Caregiver alert previews")}</summary>
        <div className="mt-4">
          <CaregiverAlerts overview />
        </div>
      </details>
      <p className="text-sm text-muted-foreground">
        {tr("Patterns describe recorded changes, not their cause. They are not a diagnosis.")}
      </p>
    </div>
  );
}
