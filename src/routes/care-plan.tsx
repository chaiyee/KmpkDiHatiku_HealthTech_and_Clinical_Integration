import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { addDays, differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { useEffect, useState } from "react";
import { Activity, Check, Circle, RefreshCw, Stethoscope, Target, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, PageLoading, SampleBadge } from "@/components/common";
import { MedicationHistory, MedicationManager, TodayDoses } from "@/components/medication";
import { CaregiverCentre, SupportRequest } from "@/components/caregiver";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { ACTIVITIES, SLOTS, WEEK_ACTIVITY, pickMeal } from "@/lib/care-guide";
import { dosesForDate, weeklySummary } from "@/lib/medications";
import type { CarePlanGoal, DailyCheckIn, MealPreferences, YesPartlyNo } from "@/lib/types";

const TABS = ["goals", "guide", "medication", "progress", "caregiver"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/care-plan")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => (TABS.includes(s["tab"] as Tab) ? { tab: s["tab"] as Tab } : {}),
  head: () => ({
    meta: [
      { title: "My Care Plan · DiaMonitor Copilot" },
      { name: "description", content: "Doctor-agreed goals, daily check-ins, Malaysian meal and activity guide, medication reminders and caregiver support." },
      { property: "og:title", content: "My Care Plan · DiaMonitor Copilot" },
      { property: "og:description", content: "Doctor-agreed goals, daily check-ins, Malaysian meal guide, medication and caregiver support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CarePlanPage,
});

function CarePlanPage() {
  const { data } = useStore();
  const { t } = useI18n();
  const { tab = "goals" } = Route.useSearch();
  const navigate = useNavigate({ from: "/care-plan" });
  if (!data) return <PageLoading />;
  return (
    <div className="space-y-4">
      <PageHeader title={t("nav.carePlan")} subtitle={t("care.subtitle")} />
      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v as Tab } })}>
        <TabsList className="mb-4 h-auto flex-wrap">
          {TABS.map((k) => <TabsTrigger key={k} value={k} className="h-10 px-4">{t(`care.tabs.${k}`)}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="goals"><GoalsTab /></TabsContent>
        <TabsContent value="guide"><GuideTab /></TabsContent>
        <TabsContent value="medication">
          <div className="grid gap-4 lg:grid-cols-2">
            <TodayDoses />
            <MedicationManager />
            <div className="lg:col-span-2"><MedicationHistory /></div>
          </div>
        </TabsContent>
        <TabsContent value="progress"><ProgressTab /></TabsContent>
        <TabsContent value="caregiver">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2"><CaregiverCentre /></div>
            <Card>
              <CardHeader><CardTitle className="text-lg">{t("cg.askTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <SupportRequest />
                <p className="text-xs text-muted-foreground">{t("cg.manageInSettings")}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function goalDays(g: CarePlanGoal) {
  const start = parseISO(g.startDate);
  const n = differenceInCalendarDays(parseISO(g.targetDate), start) + 1;
  return Array.from({ length: Math.max(1, n) }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
}

function goalProgress(g: CarePlanGoal, checkIns: DailyCheckIn[]) {
  const days = goalDays(g);
  const done = checkIns.filter((c) => days.includes(c.date) && c.followedGoal === "yes").length;
  return { days, done, pct: Math.round((done / days.length) * 100) };
}

function GoalsTab() {
  const { data, setGoalCompleted } = useStore();
  const { t, fmt } = useI18n();
  const d = data!;
  const today = format(new Date(), "yyyy-MM-dd");
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <p className="rounded-lg bg-secondary px-4 py-3 text-sm">{t("care.goalsNotice")}</p>
        {d.goals.map((g, gi) => {
          const p = goalProgress(g, d.checkIns);
          return (
            <Card key={g.id} className={g.completedAt ? "border-success/40" : ""}>
              <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <CardTitle className="flex items-center gap-2 text-lg"><Target className="h-5 w-5 text-primary" />{t("care.goalFrom", { name: g.creatorName })}</CardTitle>
                <div className="flex gap-2">{g.simulated && <SampleBadge>{t("care.simulatedDoctor")}</SampleBadge>}</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg font-medium text-navy">{g.description}</p>
                <p className="text-muted-foreground">{g.explanation}</p>
                <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                  <div><dt className="text-muted-foreground">{t("care.start")}</dt><dd className="font-medium">{fmt.date(g.startDate)}</dd></div>
                  <div><dt className="text-muted-foreground">{t("care.target")}</dt><dd className="font-medium">{fmt.date(g.targetDate)}</dd></div>
                  <div><dt className="text-muted-foreground">{t("care.followUp")}</dt><dd className="font-medium">{fmt.dateTime(g.followUpDate)}</dd></div>
                </dl>
                <div>
                  <div className="mb-1 flex justify-between text-sm"><span>{t("care.progress")}</span><span className="font-medium">{t("care.daysOf", { done: p.done, total: p.days.length })}</span></div>
                  <Progress value={p.pct} className="h-3" aria-label={t("care.progress")} />
                </div>
                {gi === 0 && p.days.length <= 31 && (
                  <div className="grid grid-cols-7 gap-1.5">
                    {p.days.map((day) => {
                      const c = d.checkIns.find((x) => x.date === day);
                      const ok = c?.followedGoal === "yes";
                      const part = c?.followedGoal === "partly";
                      const future = day > today;
                      return (
                        <div key={day} title={`${fmt.date(day)}${c?.followedGoal ? ` · ${t(`care.ynp.${c.followedGoal}`)}` : ""}`}
                          className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-xs ${ok ? "border-success/40 bg-success-soft text-success" : part ? "border-warning/40 bg-warning-soft text-warning" : future ? "text-muted-foreground/60" : day === today ? "border-primary" : "bg-muted text-muted-foreground"}`}>
                          <span>{format(parseISO(day), "d")}</span>
                          {ok ? <Check className="h-3.5 w-3.5" aria-label={t("care.ynp.yes")} /> : part ? <span aria-label={t("care.ynp.partly")}>½</span> : <Circle className="h-2 w-2" aria-hidden />}
                        </div>
                      );
                    })}
                  </div>
                )}
                {g.doctorFeedback && (
                  <div className="rounded-lg border p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold"><Stethoscope className="h-4 w-4 text-primary" />{t("care.feedback")}</p>
                    <p className="mt-1 text-[15px]">{g.doctorFeedback}</p>
                  </div>
                )}
                {g.completedAt ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-success"><Check className="h-4 w-4" />{t("care.completedOn", { d: fmt.date(g.completedAt) })}</p>
                    <Button variant="ghost" size="sm" onClick={() => setGoalCompleted(g.id, false)}>{t("common.undo")}</Button>
                  </div>
                ) : (
                  <Button variant="outline" className="h-11" onClick={() => { setGoalCompleted(g.id, true); toast.success(t("care.goalDone")); }}>{t("care.markGoalDone")}</Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <CheckInCard />
    </div>
  );
}

function YesNo<T extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: T | undefined; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend id={id} className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}
            className={`min-h-11 flex-1 rounded-lg border px-3 text-sm font-medium ${value === o.v ? "border-primary bg-accent text-primary" : "hover:bg-muted"}`}>
            {o.l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function CheckInCard() {
  const { data, saveCheckIn } = useStore();
  const { t } = useI18n();
  const d = data!;
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const existing = d.checkIns.find((c) => c.date === today);
  const autoGlucose = d.readings.some((r) => format(new Date(r.timestamp), "yyyy-MM-dd") === today);
  const autoMed = dosesForDate(d.medications, d.medEvents, today, now).some((x) => x.status === "taken" || x.status === "skipped");
  const [c, setC] = useState<DailyCheckIn>(existing ?? { date: today, completed: false });
  useEffect(() => { if (existing) setC(existing); }, [existing]);
  const set = <K extends keyof DailyCheckIn>(k: K, v: DailyCheckIn[K]) => setC((p) => ({ ...p, [k]: v }));
  const yn = [{ v: "yes" as const, l: t("common.yes") }, { v: "no" as const, l: t("common.no") }];
  const ynp: { v: YesPartlyNo; l: string }[] = (["yes", "partly", "no"] as const).map((v) => ({ v, l: t(`care.ynp.${v}`) }));
  const b = (v: boolean | undefined) => (v === undefined ? undefined : v ? "yes" : "no");
  return (
    <Card className="h-fit">
      <CardHeader><CardTitle className="text-lg">{t("care.checkInTitle")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <YesNo id="ci-goal" label={t("care.ci.goal")} value={c.followedGoal} options={ynp} onChange={(v) => set("followedGoal", v)} />
        <YesNo id="ci-glu" label={t("care.ci.glucose")} value={b(c.glucoseRecorded ?? (autoGlucose || undefined))} options={yn} onChange={(v) => set("glucoseRecorded", v === "yes")} />
        {autoGlucose && <p className="-mt-2 text-xs text-muted-foreground">{t("care.ci.autoGlucose")}</p>}
        <YesNo id="ci-med" label={t("care.ci.med")} value={b(c.medicationLogged ?? (autoMed || undefined))} options={yn} onChange={(v) => set("medicationLogged", v === "yes")} />
        <YesNo id="ci-act" label={t("care.ci.activity")} value={b(c.activityDone)} options={yn} onChange={(v) => set("activityDone", v === "yes")} />
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">{t("care.ci.wellbeing")}</legend>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-pressed={c.wellbeing === n} onClick={() => set("wellbeing", n)}
                className={`flex min-h-12 flex-col items-center justify-center rounded-lg border text-xs ${c.wellbeing === n ? "border-primary bg-accent text-primary" : "hover:bg-muted"}`}>
                <span className="text-base font-semibold">{n}</span>
                <span className="leading-tight">{t(`care.wb.${n}`)}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <Label htmlFor="ci-diff">{t("care.ci.difficulties")}</Label>
          <Textarea id="ci-diff" rows={2} value={c.difficulties ?? ""} onChange={(e) => set("difficulties", e.target.value || undefined)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="ci-ref">{t("care.ci.reflection")}</Label>
          <Textarea id="ci-ref" rows={2} value={c.reflection ?? ""} onChange={(e) => set("reflection", e.target.value || undefined)} className="mt-1.5" />
        </div>
        <Button
          className="h-12 w-full text-base"
          onClick={() => {
            if (!c.followedGoal) return toast.error(t("care.ci.needGoal"));
            saveCheckIn({ ...c, glucoseRecorded: c.glucoseRecorded ?? autoGlucose, medicationLogged: c.medicationLogged ?? autoMed, completed: true });
            toast.success(t("care.ci.saved"));
          }}
        >
          {existing?.completed ? t("care.ci.update") : t("care.ci.submit")}
        </Button>
        {existing?.completed && <p className="flex items-center gap-2 rounded-lg bg-success-soft p-3 text-sm font-medium text-success"><Check className="h-4 w-4" />{t("care.ci.done")}</p>}
      </CardContent>
    </Card>
  );
}

function GuideTab() {
  const { data, swapMeal, setMealPrefs } = useStore();
  const { t, tl, fmt } = useI18n();
  const d = data!;
  const now = new Date();
  const week = Array.from({ length: 7 }, (_, i) => format(addDays(now, i), "yyyy-MM-dd"));
  const [selected, setSelected] = useState(week[0]!);
  const [prefs, setPrefs] = useState<MealPreferences>(d.mealPrefs);
  const dayIndex = (date: string) => differenceInCalendarDays(parseISO(date), new Date(2024, 0, 1));
  const meal = (date: string, slot: (typeof SLOTS)[number]) => pickMeal(slot, d.mealPrefs, dayIndex(date), d.mealSwaps[`${date}:${slot}`] ?? 0);
  const personalised = !!(d.mealPrefs.preferences || d.mealPrefs.allergies || d.mealPrefs.vegetarian || d.mealPrefs.restrictions || d.mealPrefs.budget !== "any" || d.mealPrefs.cuisine !== "any");
  const doses = dosesForDate(d.medications, d.medEvents, selected, now);
  const goal = d.goals.find((g) => !g.completedAt && selected >= g.startDate && selected <= g.targetDate);
  const act = WEEK_ACTIVITY[dayIndex(selected) % 7]!;
  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-sm">{t(personalised ? "meals.prefNotice" : "meals.generalNotice")}</p>

      <Card>
        <CardHeader><CardTitle className="text-lg">{t("meals.weekTitle")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t("meals.weekTitle")}>
            {week.map((day) => (
              <button key={day} role="tab" aria-selected={selected === day} onClick={() => setSelected(day)}
                className={`flex min-h-14 min-w-16 flex-col items-center justify-center rounded-lg border px-2 text-sm ${selected === day ? "border-primary bg-accent font-semibold text-primary" : "hover:bg-muted"}`}>
                <span>{day === week[0] ? t("common.today") : fmt.weekday(day)}</span>
                <span className="text-xs">{fmt.dayMonth(day)}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SLOTS.map((slot) => {
              const m = meal(selected, slot);
              return (
                <div key={slot} className="flex flex-col rounded-xl border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t(`meals.slot.${slot}`)}</p>
                  <p className="mt-1 font-semibold text-navy">{t(`meals.options.${m.id}.name`)}</p>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{t(`meals.options.${m.id}.desc`)}</p>
                  <Button variant="ghost" size="sm" className="mt-2 h-10 self-start" onClick={() => swapMeal(selected, slot)}><RefreshCw className="mr-1 h-4 w-4" />{t("meals.swap")}</Button>
                </div>
              );
            })}
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg bg-secondary p-3"><p className="font-semibold">{t("meals.activity")}</p><p>{t(`activity.${act}.name`)}</p></div>
            <div className="rounded-lg bg-secondary p-3"><p className="font-semibold">{t("meals.medSummary")}</p><p>{doses.length ? doses.map((x) => `${fmt.hhmm(x.time)} ${x.schedule.name}`).join(", ") : "—"}</p></div>
            <div className="rounded-lg bg-secondary p-3"><p className="font-semibold">{t("meals.agreedGoal")}</p><p>{goal?.description ?? "—"}</p></div>
          </div>
          {d.mealPrefs.allergies && <p className="text-sm text-warning"><TriangleAlert className="mr-1 inline h-4 w-4" />{t("meals.allergyNote", { a: d.mealPrefs.allergies })}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("meals.eduTitle")}</CardTitle></CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {["balanced", "carbs", "portion", "drinks", "timing", "labels"].map((k) => (
                <AccordionItem key={k} value={k}>
                  <AccordionTrigger className="text-left">{t(`meals.edu.${k}.title`)}</AccordionTrigger>
                  <AccordionContent className="text-[15px]">{t(`meals.edu.${k}.body`)}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-primary" />{t("activity.title")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {ACTIVITIES.map((a) => (
              <div key={a} className="rounded-lg border p-3">
                <p className="font-semibold">{t(`activity.${a}.name`)}</p>
                <p className="text-sm text-muted-foreground">{t(`activity.${a}.desc`)}</p>
              </div>
            ))}
            <div className="rounded-lg border border-warning/40 bg-warning-soft p-3 text-sm">
              <p className="font-semibold">{t("activity.cautionTitle")}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">{tl("activity.cautions").map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{t("meals.prefsTitle")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("meals.prefsHint")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["preferences", "allergies", "restrictions"] as const).map((k) => (
              <div key={k}>
                <Label htmlFor={`mp-${k}`}>{t(`meals.prefs.${k}`)}</Label>
                <Input id={`mp-${k}`} value={prefs[k]} maxLength={200} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.value })} className="mt-1.5 h-11" />
              </div>
            ))}
            <div>
              <Label>{t("meals.prefs.budget")}</Label>
              <Select value={prefs.budget} onValueChange={(v) => setPrefs({ ...prefs, budget: v as MealPreferences["budget"] })}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{(["any", "low", "medium"] as const).map((v) => <SelectItem key={v} value={v}>{t(`meals.budget.${v}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("meals.prefs.cuisine")}</Label>
              <Select value={prefs.cuisine} onValueChange={(v) => setPrefs({ ...prefs, cuisine: v as MealPreferences["cuisine"] })}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{(["any", "malay", "chinese", "indian"] as const).map((v) => <SelectItem key={v} value={v}>{t(`meals.cuisine.${v}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <label className="flex min-h-11 items-center gap-3 self-end rounded-lg border px-3 text-sm">
              <Checkbox checked={prefs.vegetarian} onCheckedChange={(v) => setPrefs({ ...prefs, vegetarian: v === true })} />
              {t("meals.prefs.vegetarian")}
            </label>
          </div>
          <Button className="h-11" onClick={() => { setMealPrefs(prefs); toast.success(t("meals.prefsSaved")); }}>{t("common.save")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressTab() {
  const { data } = useStore();
  const { t, fmt } = useI18n();
  const d = data!;
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => format(subDays(now, 6 - i), "yyyy-MM-dd"));
  const checks = days.map((day) => d.checkIns.find((c) => c.date === day));
  const doneCount = checks.filter((c) => c?.completed).length;
  const gluDays = days.filter((day) => d.readings.some((r) => format(new Date(r.timestamp), "yyyy-MM-dd") === day)).length;
  const actDays = checks.filter((c) => c?.activityDone).length;
  const med = weeklySummary(d.medications, d.medEvents, now);
  const barriers = d.checkIns.filter((c) => c.difficulties && days.includes(c.date));
  const stats = [
    [t("progress.checkIns"), doneCount, 7],
    [t("progress.glucoseDays"), gluDays, 7],
    [t("progress.activityDays"), actDays, 7],
    [t("progress.medTaken"), med.taken, med.total],
  ] as const;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, v, total]) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-3xl font-semibold text-navy">{v}<span className="text-base font-normal text-muted-foreground"> / {total}</span></p>
              <Progress value={total ? (v / total) * 100 : 0} className="mt-2 h-2" aria-label={label} />
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t("med.selfReported")}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("progress.wellbeing")}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-2" role="img" aria-label={t("progress.wellbeing")}>
              {days.map((day, i) => {
                const w = checks[i]?.wellbeing;
                return (
                  <div key={day} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-medium">{w ?? "—"}</span>
                    <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${((w ?? 0) / 5) * 100}%`, minHeight: w ? 4 : 0 }} />
                    <span className="text-xs text-muted-foreground">{fmt.weekday(day)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("progress.goals")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {d.goals.map((g) => {
              const p = goalProgress(g, d.checkIns);
              return (
                <div key={g.id}>
                  <p className="text-sm font-medium">{g.description}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={g.completedAt ? 100 : p.pct} className="h-2 flex-1" aria-label={g.description} />
                    <span className="text-sm">{g.completedAt ? t("care.completed") : `${p.done}/${p.days.length}`}</span>
                  </div>
                </div>
              );
            })}
            <div>
              <p className="text-sm font-semibold">{t("progress.barriers")}</p>
              {barriers.length ? (
                <ul className="mt-1 space-y-1 text-sm">{barriers.map((c) => <li key={c.date}><span className="text-muted-foreground">{fmt.date(c.date)}:</span> {c.difficulties}</li>)}</ul>
              ) : <p className="text-sm text-muted-foreground">—</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
