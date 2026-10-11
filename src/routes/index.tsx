import { createFileRoute, Link } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { useState } from "react";
import { ArrowRight, CalendarCheck, CalendarClock, ClipboardList, Droplet, Lightbulb, MessageCircleQuestion, Pill, Plus, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GlucoseChart } from "@/components/GlucoseChart";
import { GlucoseForm } from "@/components/GlucoseForm";
import { MedicationReminderCard } from "@/components/medication";
import { EvidenceTable, FindingCard, PageLoading, ReadingValue, SampleBadge, StatusPill, UrgentGuidance, readingStatus } from "@/components/common";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { detectPatterns, morningSummary } from "@/lib/patterns";
import { nextReminder } from "@/lib/medications";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · DiaMonitor Copilot" },
      { name: "description", content: "Your diabetes summary: latest glucose, trends, medication reminders and one clear insight — in English, Bahasa Melayu and 中文." },
      { property: "og:title", content: "Overview · DiaMonitor Copilot" },
      { property: "og:description", content: "Your diabetes summary: latest glucose, trends, medication reminders and one clear insight." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { data } = useStore();
  const { t, tl, fmt, elderly } = useI18n();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(7);
  if (!data) return <PageLoading />;
  const now = new Date();
  const th = data.thresholds;
  const sorted = [...data.readings].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const latest = sorted[0];
  const stale = latest ? now.getTime() - new Date(latest.timestamp).getTime() > 2 * 86400_000 : false;
  const inRange = data.readings.filter((r) => new Date(r.timestamp) >= subDays(now, range));
  const findings = detectPatterns(data.readings, th, now);
  const safety = findings.filter((f) => f.kind === "safety");
  const top = findings.find((f) => f.severity !== "info");
  const morning = morningSummary(data.readings, th, now);
  const today = format(now, "yyyy-MM-dd");
  const loggedToday = data.readings.filter((r) => format(new Date(r.timestamp), "yyyy-MM-dd") === today).length;
  const checkIn = data.checkIns.find((c) => c.date === today);
  const nextDose = nextReminder(data.medications, data.medEvents, now);
  const hour = now.getHours();
  const greet = t(hour < 12 ? "overview.morning" : hour < 18 ? "overview.afternoon" : "overview.evening");
  const summaryKey = top ? (top.kind === "safety" ? "overview.summarySafety" : "overview.summaryWatch") : "overview.summaryOk";
  const nextStep = top?.kind === "safety" ? "overview.stepSafety" : top?.severity === "watch" ? "overview.stepWatch" : "overview.stepOk";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{fmt.long(now)}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-navy md:text-[28px]">{greet}, {data.patient.name.split(" ")[0]}</h1>
          <p className="mt-1 text-muted-foreground">{t(summaryKey)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-5 text-base"><Plus className="mr-1 h-5 w-5" />{t("actions.recordGlucose")}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader><DialogTitle>{t("glucose.recordTitle")}</DialogTitle></DialogHeader>
            <GlucoseForm onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {safety.length > 0 && <UrgentGuidance />}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Droplet className="h-4 w-4" />{t("overview.latest")}</CardTitle></CardHeader>
          <CardContent>
            {latest ? (
              <>
                <p className="text-4xl font-semibold text-navy">{fmt.number(latest.value)} <span className="text-base font-normal text-muted-foreground">mmol/L</span></p>
                {latest.originalUnit === "mg/dL" && <p className="text-xs text-muted-foreground"><ReadingValue r={latest} /></p>}
                <p className="mt-1 text-sm text-muted-foreground">{t(`context.${latest.context}`)} · {fmt.dateTime(latest.timestamp)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2"><StatusPill status={readingStatus(latest, th)} /><span className="text-xs text-muted-foreground">{t("overview.vsDemo")}</span></div>
                {stale && <p className="mt-2 text-sm text-warning">{t("overview.stale", { when: fmt.relative(latest.timestamp) })}</p>}
              </>
            ) : <p className="text-muted-foreground">{t("overview.noReadings")}</p>}
          </CardContent>
        </Card>
        <div className="md:col-span-2"><MedicationReminderCard compact /></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-lg">{t("overview.trend", { n: range })}</CardTitle>
            <div className="flex items-center gap-2">
              <div role="group" aria-label={t("overview.range")} className={`flex rounded-lg border p-0.5 ${elderly ? "elderly-hide" : ""}`}>
                {[7, 14, 30].map((d) => (
                  <button key={d} type="button" aria-pressed={range === d} onClick={() => setRange(d)} className={`h-9 rounded-md px-3 text-sm font-medium ${range === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                    {t("overview.days", { n: d })}
                  </button>
                ))}
              </div>
              <SampleBadge>{t("common.includesSample")}</SampleBadge>
            </div>
          </CardHeader>
          <CardContent><GlucoseChart readings={inRange} t={th} /></CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Lightbulb className="h-5 w-5 text-primary" />{t("overview.insight")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {morning.total >= 3 ? (
              <p className="text-[17px] font-medium text-navy">{t("overview.morningInsight", { above: morning.above, total: morning.total, high: morning.threshold })}</p>
            ) : (
              <p className="text-muted-foreground">{t("overview.notEnoughMornings")}</p>
            )}
            {top && <FindingCard f={top} t={th} compact />}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 w-full uppercase tracking-wide">{t("overview.viewSupporting")}</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t("overview.supportingTitle")}</DialogTitle>
                  <DialogDescription>{t("overview.morningRule", { n: 5, high: th.fastingHigh })}</DialogDescription>
                </DialogHeader>
                <EvidenceTable readings={[...morning.evidence].reverse()} t={th} />
                <div className="space-y-2 rounded-lg bg-secondary p-3 text-sm">
                  <p className="font-semibold">{t("overview.limitations")}</p>
                  <ul className="list-disc space-y-1 pl-5">{tl("overview.limitationList").map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
                <Link to="/health" search={{ tab: "patterns" }} className="text-sm font-medium text-primary">{t("overview.allPatterns")} →</Link>
              </DialogContent>
            </Dialog>
            <div className="rounded-xl bg-secondary p-4">
              <p className="text-sm font-semibold text-navy">{t("overview.recommended")}</p>
              <p className="mt-1 text-[15px]">{t(nextStep)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{t("overview.todayActions")}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionTile icon={Droplet} label={t("overview.glucoseLogged")} value={loggedToday ? t("overview.readingsToday", { n: loggedToday }) : t("overview.noneToday")} done={loggedToday > 0} />
          <ActionTile icon={Pill} label={t("overview.nextMed")} value={nextDose ? `${nextDose.schedule.name} · ${fmt.hhmm(nextDose.time)}` : "—"} />
          <ActionTile icon={CalendarCheck} label={t("overview.checkIn")} value={checkIn?.completed ? t("overview.checkInDone") : t("overview.checkInPending")} done={!!checkIn?.completed} />
          <ActionTile icon={CalendarClock} label={t("overview.followUp")} value={`${fmt.date(data.patient.nextVisit)} · ${data.patient.doctor}`} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickAction onClick={() => setOpen(true)} icon={Plus} label={t("actions.recordGlucose")} />
        <QuickAction to="/copilot" icon={MessageCircleQuestion} label={t("actions.askCopilot")} />
        <QuickAction to="/care-plan" icon={ClipboardList} label={t("actions.viewCarePlan")} />
        <QuickAction to="/doctor" icon={Stethoscope} label={t("actions.prepareReport")} />
      </div>

      <p className="text-xs text-muted-foreground">{t("overview.disclaimer")}</p>
    </div>
  );
}

function ActionTile({ icon: Icon, label, value, done }: { icon: typeof Droplet; label: string; value: string; done?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${done ? "border-success/40 bg-success-soft" : ""}`}>
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" />{label}</p>
      <p className="mt-1 font-medium text-navy">{value}</p>
    </div>
  );
}

function QuickAction({ to, onClick, icon: Icon, label }: { to?: "/copilot" | "/care-plan" | "/doctor"; onClick?: () => void; icon: typeof Droplet; label: string }) {
  const inner = (
    <>
      <Icon className="h-5 w-5 text-primary" />
      <span className="flex-1 text-left">{label}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </>
  );
  const cls = "flex min-h-14 items-center gap-3 rounded-xl border bg-card px-4 text-[15px] font-medium text-navy shadow-sm transition-colors hover:bg-accent";
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}
