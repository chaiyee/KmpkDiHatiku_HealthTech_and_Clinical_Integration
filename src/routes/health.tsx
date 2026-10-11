import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { useState } from "react";
import { Activity, Droplet, Pill, Stethoscope, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlucoseChart } from "@/components/GlucoseChart";
import { GlucoseForm } from "@/components/GlucoseForm";
import { FindingCard, PageHeader, PageLoading, SampleBadge, StatusPill, readingStatus } from "@/components/common";
import { useStore } from "@/lib/store";
import { detectPatterns, fastingBaseline } from "@/lib/patterns";
import { CATEGORY_LABELS, CONTEXT_LABELS, type LogCategory } from "@/lib/types";

const TABS = ["glucose", "log", "timeline", "patterns"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/health")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } =>
    TABS.includes(s['tab'] as Tab) ? { tab: s['tab'] as Tab } : {},
  head: () => ({
    meta: [
      { title: "My Health · DiaMonitor Copilot" },
      { name: "description", content: "Record glucose, log meals, activity and symptoms, and review detected patterns." },
      { property: "og:title", content: "My Health · DiaMonitor Copilot" },
      { property: "og:description", content: "Record glucose, log meals, activity and symptoms, and review detected patterns." },
    ],
  }),
  component: HealthPage,
});

function HealthPage() {
  const { data } = useStore();
  const { tab = "glucose" } = Route.useSearch();
  const navigate = useNavigate({ from: "/health" });
  if (!data) return <PageLoading />;
  return (
    <div>
      <PageHeader title="My Health" subtitle="Record readings and see how they change over time." />
      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v as Tab } })}>
        <TabsList className="mb-4 h-auto flex-wrap">
          <TabsTrigger value="glucose" className="h-10 px-4">Glucose</TabsTrigger>
          <TabsTrigger value="log" className="h-10 px-4">Log activity</TabsTrigger>
          <TabsTrigger value="timeline" className="h-10 px-4">Timeline</TabsTrigger>
          <TabsTrigger value="patterns" className="h-10 px-4">Patterns</TabsTrigger>
        </TabsList>
        <TabsContent value="glucose"><GlucoseTab /></TabsContent>
        <TabsContent value="log"><LogTab /></TabsContent>
        <TabsContent value="timeline"><TimelineTab /></TabsContent>
        <TabsContent value="patterns"><PatternsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function GlucoseTab() {
  const { data } = useStore();
  const [range, setRange] = useState("14");
  const d = data!;
  const now = new Date();
  const inRange = d.readings.filter((r) => new Date(r.timestamp) >= subDays(now, Number(range)));
  const b = fastingBaseline(d.readings, d.thresholds, now);
  const recent = [...inRange].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Glucose history</CardTitle>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-10 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <GlucoseChart readings={inRange} t={d.thresholds} height={300} />
            <p className="mt-2 text-xs text-muted-foreground">Green band: demo reference range {d.thresholds.hypo}–{d.thresholds.fastingHigh} mmol/L (not a personal target).</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent readings</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {recent.length === 0 && <p className="text-muted-foreground">No readings in this period.</p>}
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{r.value.toFixed(1)} mmol/L</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(r.timestamp), "EEE d MMM, h:mm a")} · {CONTEXT_LABELS[r.context]}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.source === "sample" ? <SampleBadge>Sample</SampleBadge> : <SampleBadge>You</SampleBadge>}
                  <StatusPill status={readingStatus(r, d.thresholds)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Add a reading</CardTitle></CardHeader>
          <CardContent><GlucoseForm /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Your fasting baseline</CardTitle></CardHeader>
          <CardContent>
            {b.sufficient ? (
              <div className="space-y-2 text-[15px]">
                <p>Earlier average: <span className="font-semibold">{b.baselineMean} mmol/L</span> <span className="text-sm text-muted-foreground">({b.baselineCount} readings, 8–28 days ago)</span></p>
                <p>Last 7 days: <span className="font-semibold">{b.recentMean} mmol/L</span> <span className="text-sm text-muted-foreground">({b.recentCount} readings)</span></p>
              </div>
            ) : (
              <p className="text-muted-foreground">Not enough readings yet to calculate your usual level. Keep recording fasting readings.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LogTab() {
  const { addLog } = useStore();
  const [category, setCategory] = useState<LogCategory>("meal");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [when, setWhen] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [error, setError] = useState("");
  const placeholders: Record<LogCategory, string> = {
    meal: "e.g. Nasi lemak, half portion",
    activity: "e.g. Brisk walk, 30 min",
    symptom: "e.g. Feeling dizzy",
    medication: "e.g. Metformin 500 mg taken",
  };
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Please describe what you'd like to log.");
    const ts = new Date(when);
    if (Number.isNaN(ts.getTime()) || ts.getTime() > Date.now() + 60_000) return setError("Please choose a valid time (not in the future).");
    setError("");
    addLog({ category, title: title.trim(), detail: detail.trim() || undefined, timestamp: ts.toISOString() });
    toast.success(`${CATEGORY_LABELS[category]} saved to your timeline.`);
    setTitle("");
    setDetail("");
  }
  const icons = { meal: Utensils, activity: Activity, symptom: Stethoscope, medication: Pill };
  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle className="text-lg">Log something</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(CATEGORY_LABELS) as LogCategory[]).map((c) => {
              const Icon = icons[c];
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border text-sm font-medium ${
                    category === c ? "border-primary bg-accent text-primary" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {c === "medication" ? "Medication" : CATEGORY_LABELS[c]}
                </button>
              );
            })}
          </div>
          <div>
            <Label htmlFor="l-title">What</Label>
            <Input id="l-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={placeholders[category]} className="mt-1.5 h-12" />
          </div>
          <div>
            <Label htmlFor="l-detail">Details (optional)</Label>
            <Input id="l-detail" value={detail} onChange={(e) => setDetail(e.target.value)} className="mt-1.5 h-12" />
          </div>
          <div>
            <Label htmlFor="l-when">When</Label>
            <Input id="l-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="mt-1.5 h-12" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {category === "medication" && (
            <p className="text-sm text-muted-foreground">Medication logs are your own records. A day without a log doesn't mean a dose was missed.</p>
          )}
          <Button type="submit" className="h-12 w-full text-base">Save to timeline</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TimelineTab() {
  const { data } = useStore();
  const [cat, setCat] = useState<"all" | "glucose" | LogCategory>("all");
  const [range, setRange] = useState("7");
  const d = data!;
  const since = subDays(new Date(), Number(range));
  type Item = { id: string; ts: string; kind: string; title: string; detail?: string | undefined; sample: boolean };
  const items: Item[] = [
    ...d.readings.map((r) => ({ id: r.id, ts: r.timestamp, kind: "glucose", title: `${r.value.toFixed(1)} mmol/L`, detail: CONTEXT_LABELS[r.context] + (r.note ? ` · ${r.note}` : ""), sample: r.source === "sample" })),
    ...d.logs.map((l) => ({ id: l.id, ts: l.timestamp, kind: l.category, title: l.title, detail: l.detail, sample: l.source === "sample" })),
  ]
    .filter((i) => new Date(i.ts) >= since && (cat === "all" || i.kind === cat))
    .sort((a, b) => b.ts.localeCompare(a.ts));
  const groups = items.reduce<Record<string, Item[]>>((acc, i) => {
    const k = format(new Date(i.ts), "EEEE, d MMMM");
    (acc[k] ??= []).push(i);
    return acc;
  }, {});
  const icon = { glucose: Droplet, meal: Utensils, activity: Activity, symptom: Stethoscope, medication: Pill } as Record<string, typeof Droplet>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={cat} onValueChange={(v) => setCat(v as typeof cat)}>
          <SelectTrigger className="h-11 w-48" aria-label="Category"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="glucose">Glucose</SelectItem>
            {(Object.keys(CATEGORY_LABELS) as LogCategory[]).map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="h-11 w-40" aria-label="Date range"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 days</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {items.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">No records match these filters.</CardContent></Card>}
      {Object.entries(groups).map(([day, list]) => (
        <div key={day}>
          <p className="mb-2 text-sm font-semibold text-navy">{day}</p>
          <Card>
            <CardContent className="divide-y p-0">
              {list.map((i) => {
                const Icon = icon[i.kind] ?? Droplet;
                return (
                  <div key={i.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary"><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{i.title}</p>
                      {i.detail && <p className="text-sm text-muted-foreground">{i.detail}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{format(new Date(i.ts), "h:mm a")}</p>
                      {i.sample && <SampleBadge>Sample</SampleBadge>}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

function PatternsTab() {
  const { data } = useStore();
  const d = data!;
  const findings = detectPatterns(d.readings, d.thresholds);
  const t = d.thresholds;
  return (
    <div className="space-y-4">
      {findings.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">No patterns detected in the last 7 days.</CardContent></Card>}
      {findings.map((f) => <FindingCard key={f.id} f={f} t={t} />)}
      <Card>
        <CardHeader><CardTitle className="text-base">How patterns are detected</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>Simple rules check your records — no AI decides these. Demo thresholds (not personal clinical targets):</p>
          <p>Low: below {t.hypo} · Fasting high: above {t.fastingHigh} · After-meal high: above {t.postMealHigh} · Very high: above {t.severeHigh} mmol/L.</p>
          <p>A pattern needs at least {t.minRepeated} readings. Patterns show what changed alongside other records, not what caused it. Your healthcare team should set your personal targets.</p>
        </CardContent>
      </Card>
    </div>
  );
}
