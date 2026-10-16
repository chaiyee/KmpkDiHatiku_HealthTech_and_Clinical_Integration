import { nutritionTotals } from "@/lib/meals";
import { MealCompanion, MealEditDialog } from "@/components/MealCompanion";
import { ActivityCompanion } from "@/components/ActivityCompanion";
import { useLanguage } from "@/lib/i18n";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { subDays } from "date-fns";
import { useState } from "react";
import { Activity, Droplet, Pill, Stethoscope, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlucoseChart } from "@/components/GlucoseChart";
import { GlucoseForm } from "@/components/GlucoseForm";
import {
  FindingCard,
  PageHeader,
  PageLoading,
  SampleBadge,
  StatusPill,
  readingStatus,
} from "@/components/common";
import { useStore } from "@/lib/store";
import { detectPatterns, fastingBaseline } from "@/lib/patterns";
import { CATEGORY_LABELS, CONTEXT_LABELS, type LogCategory } from "@/lib/types";
import { PersonalInsights } from "@/components/PersonalInsights";
import { ConnectedHealth } from "@/components/ConnectedHealth";

const TABS = ["glucose", "log", "timeline", "patterns", "devices"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/health")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } =>
    TABS.includes(s["tab"] as Tab) ? { tab: s["tab"] as Tab } : {},
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Health · DiaMonitor Copilot" },
      {
        name: "description",
        content: "Record glucose, log meals, activity and symptoms, and review detected patterns.",
      },
      { property: "og:title", content: "My Health · DiaMonitor Copilot" },
      {
        property: "og:description",
        content: "Record glucose, log meals, activity and symptoms, and review detected patterns.",
      },
    ],
  }),
  component: HealthPage,
});

function HealthPage() {
  const { t: tr } = useLanguage();
  const { data } = useStore();
  const { tab = "glucose" } = Route.useSearch();
  const navigate = useNavigate({ from: "/health" });
  if (!data) return <PageLoading />;
  return (
    <div>
      <PageHeader
        title={tr("My Health")}
        subtitle={tr("Record readings and see how they change over time.")}
      />
      <p className="mb-5 max-w-3xl text-sm text-muted-foreground">
        {tr(
          tab === "devices"
            ? "Preview sensor updates and supportive Guardian check-ins. All device activity here is simulated."
            : tab === "patterns"
              ? "Explore recorded changes and the readings behind them."
              : tab === "log"
                ? "Record meals, movement and how you feel. Your notes add context to your readings."
                : tab === "timeline"
                  ? "Your readings and daily records, together in time."
                  : "Add a glucose reading or review your latest records.",
        )}
      </p>
      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v as Tab } })}>
        <TabsList className="mb-5 grid h-auto w-full grid-cols-2 gap-1 rounded-xl border bg-card p-1.5 sm:grid-cols-3 xl:grid-cols-5">
          <TabsTrigger value="glucose" className="h-11 px-4">
            {tr("Glucose records")}
          </TabsTrigger>
          <TabsTrigger value="log" className="h-11 px-4">
            {tr("Daily log")}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="h-11 px-4">
            {tr("History")}
          </TabsTrigger>
          <TabsTrigger value="patterns" className="h-11 px-4">
            {tr("Health trends")}
          </TabsTrigger>
          <TabsTrigger value="devices" className="h-11 px-4">
            {tr("Monitoring")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="glucose">
          <GlucoseTab />
        </TabsContent>
        <TabsContent value="log">
          <LogTab />
        </TabsContent>
        <TabsContent value="timeline">
          <TimelineTab />
        </TabsContent>
        <TabsContent value="patterns">
          <PatternsTab />
        </TabsContent>
        <TabsContent value="devices" forceMount className="data-[state=inactive]:hidden">
          <ConnectedHealth />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GlucoseTab() {
  const { t: tr, format } = useLanguage();
  const { data } = useStore();
  const [range, setRange] = useState("14");
  if (!data) return <PageLoading />;
  const d = data;
  const now = new Date();
  const inRange = d.readings.filter((r) => new Date(r.timestamp) >= subDays(now, Number(range)));
  const b = fastingBaseline(d.readings, d.thresholds, now);
  const recent = [...inRange].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8);
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <div className="order-1 space-y-5 xl:order-1">
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">{tr("Add a reading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <GlucoseForm />
          </CardContent>
        </Card>
        <details className="rounded-xl border bg-card p-4">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold text-navy">
            {tr("Your fasting baseline")}
          </summary>
          <Card className="border-0 shadow-none">
            <CardContent>
              {b.sufficient ? (
                <div className="space-y-2 text-[15px]">
                  <p>
                    {tr("Earlier average:")}{" "}
                    <span className="font-semibold">{b.baselineMean} mmol/L</span>{" "}
                    <span className="text-sm text-muted-foreground">
                      ({b.baselineCount} {tr("readings, 8–28 days ago)")}
                    </span>
                  </p>
                  <p>
                    {tr("Last 7 days:")}{" "}
                    <span className="font-semibold">{b.recentMean} mmol/L</span>{" "}
                    <span className="text-sm text-muted-foreground">
                      ({b.recentCount} {tr("readings)")}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {tr(
                    "Not enough readings yet to calculate your usual level. Keep recording fasting readings.",
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        </details>
      </div>
      <div className="order-2 space-y-5 xl:order-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{tr("Recent readings")}</CardTitle>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-11 w-full sm:w-40" aria-label={tr("Date range")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{tr("Last 7 days")}</SelectItem>
                <SelectItem value="14">{tr("Last 14 days")}</SelectItem>
                <SelectItem value="30">{tr("Last 30 days")}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="divide-y">
            {recent.length === 0 && (
              <p className="text-muted-foreground">{tr("No readings in this period.")}</p>
            )}
            {recent.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{r.value.toFixed(1)} mmol/L</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(r.timestamp), "EEE d MMM, h:mm a")} ·{" "}
                    {tr(CONTEXT_LABELS[r.context])}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.source === "sample" ? (
                    <SampleBadge>{tr("Sample")}</SampleBadge>
                  ) : r.source === "device" ? (
                    <SampleBadge>{tr("Simulated device")}</SampleBadge>
                  ) : (
                    <SampleBadge>{tr("You")}</SampleBadge>
                  )}
                  <StatusPill status={readingStatus(r, d.thresholds)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LogTab() {
  const { t: tr, format } = useLanguage();
  const { addLog } = useStore();
  const navigate = useNavigate({ from: "/health" });
  const [category, setCategory] = useState<LogCategory>("meal");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [when, setWhen] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [error, setError] = useState("");
  const [symptomSaved, setSymptomSaved] = useState(false);

  const placeholders: Record<LogCategory, string> = {
    meal: tr("e.g. Nasi lemak, half portion"),
    activity: tr("e.g. Brisk walk, 30 min"),
    symptom: tr("e.g. Feeling dizzy"),
    medication: tr("e.g. Metformin 500 mg taken"),
  };
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Please describe what you'd like to log.");
    const ts = new Date(when);
    if (Number.isNaN(ts.getTime()) || ts.getTime() > Date.now() + 60_000)
      return setError("Please choose a valid time (not in the future).");
    setError("");
    addLog({
      category,
      title: title.trim(),
      detail: detail.trim() || undefined,
      timestamp: ts.toISOString(),
    });
    toast.success(
      tr("{category} saved to your timeline.", { category: tr(CATEGORY_LABELS[category]) }),
    );
    if (category === "symptom") setSymptomSaved(true);
    setTitle("");
    setDetail("");
  }
  const icons = { meal: Utensils, activity: Activity, symptom: Stethoscope, medication: Pill };
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg">{tr("Record a meal, activity or symptom")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(CATEGORY_LABELS) as LogCategory[]).map((c) => {
              const Icon = icons[c];
              return (
                <Button
                  variant="outline"
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border text-sm font-medium ${
                    category === c ? "border-primary bg-accent text-primary" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {c === "medication" ? tr("Medication") : tr(CATEGORY_LABELS[c])}
                </Button>
              );
            })}
          </div>
          {category === "meal" ? (
            <MealCompanion />
          ) : category === "activity" ? (
            <ActivityCompanion />
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="l-title">{tr("What")}</Label>
                <Input
                  id="l-title"
                  aria-invalid={!!error}
                  aria-describedby={error ? "l-error" : undefined}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={placeholders[category]}
                  className="mt-1.5 h-12"
                />
              </div>
              <div>
                <Label htmlFor="l-detail">{tr("Details (optional)")}</Label>
                <Input
                  id="l-detail"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  className="mt-1.5 h-12"
                />
              </div>
              <div>
                <Label htmlFor="l-when">{tr("When")}</Label>
                <Input
                  id="l-when"
                  type="datetime-local"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className="mt-1.5 h-12"
                />
              </div>
              {error && (
                <p id="l-error" role="alert" className="text-sm text-destructive">
                  {tr(error)}
                </p>
              )}
              {symptomSaved && category === "symptom" && (
                <div
                  role="alert"
                  className="space-y-3 rounded-lg border border-warning/40 bg-warning-soft p-4"
                >
                  <p className="font-medium">
                    {tr(
                      "Symptoms like dizziness, shaking or sweating can be linked to low or high glucose.",
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tr(
                      "Please check your glucose now if you can. If you feel very unwell, confused or drowsy, seek medical help immediately (999 in Malaysia).",
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="min-h-12"
                      onClick={() => navigate({ search: { tab: "glucose" } })}
                    >
                      <Droplet />
                      {tr("Check glucose now")}
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-12"
                      onClick={() => setSymptomSaved(false)}
                    >
                      {tr("Dismiss")}
                    </Button>
                  </div>
                </div>
              )}
              {category === "medication" && (
                <p className="text-sm text-muted-foreground">
                  {tr(
                    "Medication logs are your own records. A day without a log doesn't mean a dose was missed.",
                  )}
                </p>
              )}
              <Button type="submit" className="h-12 w-full text-base">
                {tr("Save to timeline")}
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineTab() {
  const { t: tr, format } = useLanguage();
  const { data } = useStore();
  const [editingMeal, setEditingMeal] = useState<import("@/lib/types").HealthLog | undefined>();
  const [cat, setCat] = useState<"all" | "glucose" | LogCategory>("all");
  const [range, setRange] = useState("7");
  if (!data) return <PageLoading />;
  const d = data;
  const since = subDays(new Date(), Number(range));
  type Item = {
    id: string;
    ts: string;
    kind: string;
    title: string;
    detail?: string | undefined;
    sample: boolean;
    device?: boolean;
    logId?: string;
  };
  const items: Item[] = [
    ...d.readings.map((r) => ({
      id: r.id,
      ts: r.timestamp,
      kind: "glucose",
      title: `${r.value.toFixed(1)} mmol/L`,
      detail: tr(CONTEXT_LABELS[r.context]) + (r.note ? ` · ${r.note}` : ""),
      sample: r.source === "sample",
      device: r.source === "device",
    })),
    ...d.logs.map((l) => ({
      id: l.id,
      ts: l.timestamp,
      kind: l.category,
      title: l.title,
      detail: l.detail,
      sample: l.source === "sample",
      logId: l.id,
    })),
  ]
    .filter((i) => new Date(i.ts) >= since && (cat === "all" || i.kind === cat))
    .sort((a, b) => b.ts.localeCompare(a.ts));
  const groups = items.reduce<Record<string, Item[]>>((acc, i) => {
    const k = format(new Date(i.ts), "EEEE, d MMMM");
    (acc[k] ??= []).push(i);
    return acc;
  }, {});
  const icon = {
    glucose: Droplet,
    meal: Utensils,
    activity: Activity,
    symptom: Stethoscope,
    medication: Pill,
  } as Record<string, typeof Droplet>;
  return (
    <div className="space-y-4">
      {editingMeal && (
        <MealEditDialog log={editingMeal} onClose={() => setEditingMeal(undefined)} />
      )}
      <div className="flex flex-wrap gap-3">
        <Select value={cat} onValueChange={(v) => setCat(v as typeof cat)}>
          <SelectTrigger className="h-11 w-48" aria-label={tr("Category")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tr("All categories")}</SelectItem>
            <SelectItem value="glucose">{tr("Glucose")}</SelectItem>
            {(Object.keys(CATEGORY_LABELS) as LogCategory[]).map((c) => (
              <SelectItem key={c} value={c}>
                {tr(CATEGORY_LABELS[c])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="h-11 w-40" aria-label={tr("Date range")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">{tr("Last 3 days")}</SelectItem>
            <SelectItem value="7">{tr("Last 7 days")}</SelectItem>
            <SelectItem value="14">{tr("Last 14 days")}</SelectItem>
            <SelectItem value="30">{tr("Last 30 days")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {items.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {tr("No records match these filters.")}
          </CardContent>
        </Card>
      )}
      {Object.entries(groups).map(([day, list]) => (
        <div key={day}>
          <p className="mb-2 text-sm font-semibold text-navy">{day}</p>
          <Card>
            <CardContent className="divide-y p-0">
              {list.map((i) => {
                const Icon = icon[i.kind] ?? Droplet;
                const mealLog =
                  i.kind === "meal" ? d.logs.find((log) => log.id === i.logId) : undefined;
                return (
                  <div key={i.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{i.sample ? tr(i.title) : i.title}</p>
                      {mealLog?.meal && (
                        <p className="text-sm font-semibold text-primary">
                          {tr("Estimated carbohydrates: {value} g", {
                            value:
                              nutritionTotals(mealLog.meal.items).carbohydrates.value ??
                              tr("Not entered"),
                          })}
                        </p>
                      )}
                      {mealLog?.source === "user" && (
                        <Button
                          variant="outline"
                          className="mt-2 min-h-11"
                          onClick={() => setEditingMeal(mealLog)}
                        >
                          {tr("Edit meal")}
                        </Button>
                      )}
                      {i.detail && (
                        <p className="text-sm text-muted-foreground">
                          {i.sample ? tr(i.detail) : i.detail}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(i.ts), "h:mm a")}
                      </p>
                      {i.sample && <SampleBadge>{tr("Sample")}</SampleBadge>}
                      {i.device && <SampleBadge>{tr("Simulated device")}</SampleBadge>}
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
  const { t: tr, format } = useLanguage();
  const { data } = useStore();
  const [range, setRange] = useState("14");
  if (!data) return <PageLoading />;
  const d = data;
  const findings = detectPatterns(d.readings, d.thresholds);
  const t = d.thresholds;
  const inRange = d.readings.filter(
    (r) => new Date(r.timestamp) >= subDays(new Date(), Number(range)),
  );
  return (
    <div className="space-y-5">
      {findings
        .filter((f) => f.kind === "safety")
        .map((f) => (
          <FindingCard key={f.id} f={f} t={t} />
        ))}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">{tr("Glucose history")}</CardTitle>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-11 w-36" aria-label={tr("Date range")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{tr("Last 7 days")}</SelectItem>
              <SelectItem value="14">{tr("Last 14 days")}</SelectItem>
              <SelectItem value="30">{tr("Last 30 days")}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <GlucoseChart readings={inRange} t={d.thresholds} height={300} />
          <p className="mt-2 text-xs text-muted-foreground">
            {tr("Green band: demo reference range")} {d.thresholds.hypo}–{d.thresholds.fastingHigh}{" "}
            {tr("mmol/L (not a personal target).")}
          </p>
        </CardContent>
      </Card>

      {findings.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {tr("No patterns detected in the last 7 days.")}
          </CardContent>
        </Card>
      )}
      {findings
        .filter((f) => f.kind !== "safety")
        .map((f) => (
          <FindingCard key={f.id} f={f} t={t} />
        ))}
      <PersonalInsights />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tr("How patterns are detected")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>
            {tr(
              "Simple rules check your records — no AI decides these. Demo thresholds (not personal clinical targets):",
            )}
          </p>
          <p>
            {tr("Low: below")} {t.hypo} {tr("· Fasting high: above")} {t.fastingHigh}{" "}
            {tr("· After-meal high: above")} {t.postMealHigh} {tr("· Very high: above")}{" "}
            {t.severeHigh} mmol/L.
          </p>
          <p>
            {tr("A pattern needs at least")} {t.minRepeated}{" "}
            {tr(
              "readings. Patterns show what changed alongside other records, not what caused it. Your healthcare team should set your personal targets.",
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
