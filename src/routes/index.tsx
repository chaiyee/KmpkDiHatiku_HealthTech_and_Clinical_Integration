import { HealthReplay } from "@/components/HealthReplay";
import { useLanguage } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { startOfDay, subDays } from "date-fns";
import { useState } from "react";
import { ArrowRight, CalendarClock, ChevronDown, MessageCircleQuestion, Plus } from "lucide-react";
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
import { GlucoseChart } from "@/components/GlucoseChart";
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
  const hour = now.getHours();
  const greet =
    hour < 12 ? tr("Good morning") : hour < 18 ? tr("Good afternoon") : tr("Good evening");

  return (
    <div className="space-y-6">
      <div className="welcome-panel flex flex-wrap items-end justify-between gap-4 rounded-2xl p-5 sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy md:text-[28px]">
            {greet}, {data.patient.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {tr("Here's what matters from your recent records.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-5 text-base">
                <Plus className="mr-1 h-5 w-5" />
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
          <Button asChild variant="outline" className="h-12 px-5 text-base">
            <Link to="/copilot">
              <MessageCircleQuestion className="mr-1 h-5 w-5" />
              {tr("Ask Copilot")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 text-sm">
        <div>
          <p className="font-semibold text-navy">{tr("Next medication reminder")}</p>
          <p className="mt-1 text-muted-foreground">
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
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/care-plan" hash="medication-reminders">
              {tr("Review medication status")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/health" search={{ tab: "log" }}>
              {tr("Daily log")}
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="overview-stats grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tr("Latest reading")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latest ? (
              <>
                <p className="text-4xl font-semibold text-navy">
                  {latest.value.toFixed(1)}{" "}
                  <span className="text-base font-normal text-muted-foreground">mmol/L</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tr(CONTEXT_LABELS[latest.context])} ·{" "}
                  {format(new Date(latest.timestamp), "d MMM, h:mm a")}
                </p>
                <div className="mt-2">
                  <StatusPill status={readingStatus(latest, t)} />
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">{tr("No readings yet.")}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tr("Logging this week")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-navy">
              {days}
              <span className="text-base font-normal text-muted-foreground"> {tr("/ 7 days")}</span>
            </p>
            <Progress value={(days / 7) * 100} className="mt-3 h-2" />
            <p className="mt-2 text-sm text-muted-foreground">
              {week.length} {tr("readings recorded in the last 7 days")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              {tr("Next consultation")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-navy">
              {format(new Date(data.patient.nextVisit), "EEE, d MMM · h:mm a")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{tr(data.patient.doctor)}</p>
            <Link
              to="/doctor"
              className="mt-3 inline-flex items-center text-sm font-medium text-primary"
            >
              {tr("Prepare report")}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {findings.some((finding) => finding.kind === "safety") && (
        <p
          role="alert"
          className="rounded-lg border border-destructive bg-danger-soft p-3 text-sm font-medium text-destructive"
        >
          {tr(
            "For potentially urgent symptoms, seek medical assistance immediately; call 999 in Malaysia if needed. Do not wait for caregiver acknowledgement. Follow your clinic's agreed instructions.",
          )}
        </p>
      )}
      <HealthReplay />
      <CaregiverAlerts overview />
      <details className="group rounded-lg border bg-card p-4">
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-lg font-semibold text-navy">
          <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          {tr("More details: trend, forecast and insights")}
        </summary>
        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">{tr("7-day glucose trend")}</CardTitle>
              <SampleBadge>{tr("Includes sample data")}</SampleBadge>
            </CardHeader>
            <CardContent>
              <GlucoseChart readings={week} t={t} />
            </CardContent>
          </Card>
          <FastingForecastCard
            readings={data.readings}
            thresholds={t}
            now={now}
            nextVisit={new Date(data.patient.nextVisit)}
          />
          <PersonalInsights compact now={now} />
        </div>
      </details>
      <p className="text-xs text-muted-foreground">
        {tr(
          "Insights come from simple, transparent rules applied to your records using demo thresholds. They show what changed — not why — and are not a diagnosis.",
        )}
      </p>
    </div>
  );
}
