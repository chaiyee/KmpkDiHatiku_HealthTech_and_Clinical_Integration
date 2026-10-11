import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { useState } from "react";
import { Activity, Droplet, NotebookPen, Pill, Stethoscope, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlucoseChart } from "@/components/GlucoseChart";
import { GlucoseForm } from "@/components/GlucoseForm";
import { DoseStatusBadge } from "@/components/medication";
import { FindingCard, PageHeader, PageLoading, ReadingValue, SampleBadge, StatusPill, readingStatus } from "@/components/common";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { detectPatterns, fastingBaseline } from "@/lib/patterns";
import { buildTimeline, type TimelineKind } from "@/lib/health-records";
import { LOG_CATEGORIES, type LogCategory } from "@/lib/types";

const TABS = ["glucose", "log", "timeline", "patterns"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/health")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => (TABS.includes(s["tab"] as Tab) ? { tab: s["tab"] as Tab } : {}),
  head: () => ({
    meta: [
      { title: "My Health · DiaMonitor Copilot" },
      { name: "description", content: "Record glucose in mmol/L or mg/dL, log meals, activity and symptoms, and review transparent pattern detection." },
      { property: "og:title", content: "My Health · DiaMonitor Copilot" },
      { property: "og:description", content: "Record glucose, log meals, activity and symptoms, and review transparent pattern detection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HealthPage,
});

function HealthPage() {
  const { data } = useStore();
  const { t } = useI18n();
  const { tab = "glucose" } = Route.useSearch();
  const navigate = useNavigate({ from: "/health" });
  if (!data) return <PageLoading />;
  return (
    <div>
      <PageHeader title={t("nav.health")} subtitle={t("health.subtitle")} />
      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v as Tab } })}>
        <TabsList className="mb-4 h-auto flex-wrap">
          {TABS.map((k) => <TabsTrigger key={k} value={k} className="h-10 px-4">{t(`health.tabs.${k}`)}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="glucose"><GlucoseTab /></TabsContent>
        <TabsContent value="log"><LogTab /></TabsContent>
        <TabsContent value="timeline"><TimelineTab /></TabsContent>
        <TabsContent value="patterns"><PatternsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function RangeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-40" aria-label={t("overview.range")}><SelectValue /></SelectTrigger>
      <SelectContent>
        {["7", "14", "30"].map((d) => <SelectItem key={d} value={d}>{t("common.lastDays", { n: d })}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function GlucoseTab() {
  const { data } = useStore();
  const { t, fmt } = useI18n();
  const [range, setRange] = useState("14");
  const d = data!;
  const now = new Date();
  const inRange = d.readings.filter((r) => new Date(r.timestamp) >= subDays(now, Number(range)));
  const b = fastingBaseline(d.readings, d.thresholds, now);
  const recent = [...inRange].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">{t("health.history")}</CardTitle>
            <RangeSelect value={range} onChange={setRange} />
          </CardHeader>
          <CardContent><GlucoseChart readings={inRange} t={d.thresholds} height={300} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("health.recent")}</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {recent.length === 0 && <p className="text-muted-foreground">{t("chart.empty")}</p>}
            {recent.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium"><ReadingValue r={r} /></p>
                  <p className="text-sm text-muted-foreground">{fmt.dateTime(r.timestamp)} · {t(`context.${r.context}`)}</p>
                  {[r.note, r.symptoms, r.meal, r.activity, r.medicationContext].filter(Boolean).length > 0 && (
                    <p className="text-sm">{[r.note, r.symptoms, r.meal, r.activity, r.medicationContext].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <SampleBadge>{r.source === "sample" ? t("common.sample") : t("common.you")}</SampleBadge>
                  <StatusPill status={readingStatus(r, d.thresholds)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("health.addReading")}</CardTitle></CardHeader>
          <CardContent><GlucoseForm /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("health.baseline")}</CardTitle></CardHeader>
          <CardContent>
            {b.sufficient ? (
              <div className="space-y-2 text-[15px]">
                <p>{t("health.baselineEarlier")}: <span className="font-semibold">{b.baselineMean} mmol/L</span> <span className="text-sm text-muted-foreground">({t("health.baselineEarlierN", { n: b.baselineCount })})</span></p>
                <p>{t("health.baselineRecent")}: <span className="font-semibold">{b.recentMean} mmol/L</span> <span className="text-sm text-muted-foreground">({t("health.baselineRecentN", { n: b.recentCount })})</span></p>
              </div>
            ) : (
              <p className="text-muted-foreground">{t("health.baselineInsufficient")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const ICONS = { meal: Utensils, activity: Activity, symptom: Stethoscope, medication: Pill, note: NotebookPen, glucose: Droplet } as const;

function LogTab() {
  const { addLog } = useStore();
  const { t } = useI18n();
  const [category, setCategory] = useState<LogCategory>("meal");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [when, setWhen] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [error, setError] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError(t("validation.describe"));
    if (title.trim().length > 200) return setError(t("validation.tooLong"));
    const ts = new Date(when);
    if (Number.isNaN(ts.getTime())) return setError(t("validation.dateInvalid"));
    if (ts.getTime() > Date.now() + 60_000) return setError(t("validation.dateFuture"));
    setError("");
    addLog({ category, title: title.trim(), detail: detail.trim() || undefined, timestamp: ts.toISOString() });
    toast.success(t("health.logSaved", { cat: t(`category.${category}`) }));
    setTitle("");
    setDetail("");
  }
  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle className="text-lg">{t("health.logTitle")}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="group" aria-label={t("health.category")}>
            {LOG_CATEGORIES.map((c) => {
              const Icon = ICONS[c];
              return (
                <button type="button" key={c} onClick={() => setCategory(c)} aria-pressed={category === c}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-center text-sm font-medium ${category === c ? "border-primary bg-accent text-primary" : "hover:bg-muted"}`}>
                  <Icon className="h-5 w-5" />
                  {t(`category.${c}`)}
                </button>
              );
            })}
          </div>
          <div>
            <Label htmlFor="l-title">{t("health.what")}</Label>
            <Input id="l-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t(`health.ph.${category}`)} className="mt-1.5 h-12" />
          </div>
          <div>
            <Label htmlFor="l-detail">{t("health.details")}</Label>
            <Input id="l-detail" value={detail} onChange={(e) => setDetail(e.target.value)} className="mt-1.5 h-12" />
          </div>
          <div>
            <Label htmlFor="l-when">{t("health.when")}</Label>
            <Input id="l-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="mt-1.5 h-12" />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {category === "medication" && <p className="text-sm text-muted-foreground">{t("health.medNoteHint")}</p>}
          <Button type="submit" className="h-12 w-full text-base">{t("health.saveTimeline")}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TimelineTab() {
  const { data } = useStore();
  const { t, fmt } = useI18n();
  const [cat, setCat] = useState<"all" | TimelineKind>("all");
  const [range, setRange] = useState("7");
  const d = data!;
  const since = subDays(new Date(), Number(range)).toISOString();
  const items = buildTimeline(d.readings, d.logs, d.medEvents, d.medications).filter((i) => i.timestamp >= since && (cat === "all" || i.kind === cat));
  const groups = new Map<string, typeof items>();
  for (const i of items) {
    const k = format(new Date(i.timestamp), "yyyy-MM-dd");
    groups.set(k, [...(groups.get(k) ?? []), i]);
  }
  const kinds: TimelineKind[] = ["glucose", "meal", "symptom", "activity", "medication", "note"];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select value={cat} onValueChange={(v) => setCat(v as typeof cat)}>
          <SelectTrigger className="h-10 w-48" aria-label={t("health.category")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("health.allCategories")}</SelectItem>
            {kinds.map((k) => <SelectItem key={k} value={k}>{t(`category.${k}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <RangeSelect value={range} onChange={setRange} />
      </div>
      {items.length === 0 && <p className="text-muted-foreground">{t("health.timelineEmpty")}</p>}
      {[...groups.entries()].map(([day, list]) => (
        <Card key={day}>
          <CardHeader className="pb-2"><CardTitle className="text-base">{fmt.long(day)}</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {list.map((i) => {
              const Icon = ICONS[i.kind];
              return (
                <div key={i.id} className="flex items-start gap-3 py-2.5">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">{fmt.time(i.timestamp)} · {t(`category.${i.kind}`)}</p>
                    {i.reading && <p className="font-medium"><ReadingValue r={i.reading} /> · {t(`context.${i.reading.context}`)}</p>}
                    {i.log && <p className="font-medium">{i.log.title}{i.log.detail && <span className="font-normal text-muted-foreground"> — {i.log.detail}</span>}</p>}
                    {i.medEvent && (
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {i.schedule?.name ?? t("med.removedMed")} ({t("med.scheduledAt", { time: fmt.hhmm(i.medEvent.scheduledTime) })})
                        <DoseStatusBadge status={i.medEvent.action} />
                        {i.medEvent.note && <span className="font-normal text-muted-foreground">{i.medEvent.note}</span>}
                      </p>
                    )}
                  </div>
                  {i.source === "sample" && <SampleBadge>{t("common.sample")}</SampleBadge>}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PatternsTab() {
  const { data } = useStore();
  const { t } = useI18n();
  const d = data!;
  const findings = detectPatterns(d.readings, d.thresholds);
  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-secondary px-4 py-3 text-sm">{t("health.patternsIntro")}</p>
      {findings.map((f) => <FindingCard key={f.id} f={f} t={d.thresholds} />)}
      {findings.length === 0 && <p className="text-muted-foreground">{t("health.noPatterns")}</p>}
    </div>
  );
}
