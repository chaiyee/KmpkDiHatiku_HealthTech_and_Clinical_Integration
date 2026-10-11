import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, subDays } from "date-fns";
import { useState, type ReactNode } from "react";
import { Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GlucoseChart } from "@/components/GlucoseChart";
import { DoseStatusBadge } from "@/components/medication";
import { EvidenceTable, PageLoading } from "@/components/common";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { detectPatterns, fastingBaseline } from "@/lib/patterns";
import { dosesForDate } from "@/lib/medications";
import { isActive } from "@/lib/caregiver";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Doctor Visit Report · DiaMonitor Copilot" },
      { name: "description", content: "A printable consultation report from recorded glucose, medication logs, care-plan progress and consented caregiver alerts." },
      { property: "og:title", content: "Doctor Visit Report · DiaMonitor Copilot" },
      { property: "og:description", content: "A printable consultation report built from the patient's recorded data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DoctorPage,
});

type Tag = "recorded" | "patient" | "rule" | "ai" | "doctor" | "suggested";

function Section({ n, title, tag, children }: { n: string; title: string; tag: Tag[]; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <section className="break-inside-avoid border-t py-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-navy">{n}. {title}</h2>
        {tag.map((x) => <span key={x} className="rounded border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{t(`report.tag.${x}`)}</span>)}
      </div>
      {children}
    </section>
  );
}

function DoctorPage() {
  const { data, addDoctorNote, setDoctorQuestions, addGoal } = useStore();
  const { t, fmt } = useI18n();
  const [range, setRange] = useState("14");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [goal, setGoal] = useState("");
  const [newQ, setNewQ] = useState("");
  if (!data) return <PageLoading />;
  const now = new Date();
  const since = subDays(now, Number(range));
  const inPeriod = (iso: string) => new Date(iso) >= since && new Date(iso) <= now;
  const th = data.thresholds;
  const readings = data.readings.filter((r) => inPeriod(r.timestamp)).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const logs = data.logs.filter((l) => inPeriod(l.timestamp)).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const findings = detectPatterns(data.readings, th, now);
  const b = fastingBaseline(data.readings, th, now);
  const vals = readings.map((r) => r.value);
  const avg = vals.length ? fmt.number(vals.reduce((a, c) => a + c, 0) / vals.length) : "—";
  const p = data.patient;
  const days = Array.from({ length: Number(range) }, (_, i) => format(subDays(now, i), "yyyy-MM-dd"));
  const doses = days.flatMap((d) => dosesForDate(data.medications, data.medEvents, d, now)).filter((d) => d.status !== "scheduled");
  const count = (s: string) => doses.filter((d) => d.status === s).length;
  const checkIns = data.checkIns.filter((c) => days.includes(c.date));
  const consentedCaregivers = data.caregivers.filter((c) => isActive(c) && c.share.alerts);
  const alerts = data.caregiverAlerts.filter((a) => inPeriod(a.createdAt) && consentedCaregivers.some((c) => c.id === a.caregiverId));
  const missing: string[] = [];
  if (findings.some((f) => f.id === "data-gap")) missing.push(t("report.missing.gaps"));
  if (!b.sufficient) missing.push(t("report.missing.baseline"));
  if (count("not_logged")) missing.push(t("report.missing.meds", { n: count("not_logged") }));
  if (!logs.some((l) => l.category === "meal")) missing.push(t("report.missing.meals"));

  const generatedQs = [
    ...findings.filter((f) => f.severity !== "info").map((f) => t(`report.q.${f.id}`)),
    count("skipped") + count("not_logged") > 0 ? t("report.q.meds") : "",
    t("report.q.targets"),
    t("report.q.contact"),
  ].filter((x) => x && !x.startsWith("report.q."));
  const questions = data.doctorQuestions ?? generatedQs;
  const editQ = (q: string[]) => setDoctorQuestions(q);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy">{t("nav.doctor")}</h1>
          <p className="text-muted-foreground">{t("report.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-11 w-40" aria-label={t("report.period")}><SelectValue /></SelectTrigger>
            <SelectContent>{["7", "14", "30"].map((d) => <SelectItem key={d} value={d}>{t("common.lastDays", { n: d })}</SelectItem>)}</SelectContent>
          </Select>
          <Button className="h-11" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />{t("report.print")}</Button>
        </div>
      </div>

      <article className="rounded-xl border-2 border-navy/15 bg-card p-5 shadow-sm md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 rounded-lg bg-navy p-4 text-navy-foreground">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">{t("report.header")}</p>
            <p className="mt-1 text-xl font-semibold">{p.name} <span className="text-sm font-normal opacity-80">({p.id})</span></p>
            <p className="text-sm opacity-90">{t("report.profile", { age: p.age, sex: t(`common.sex.${p.sex}`), type: p.diabetesType, years: p.yearsSinceDiagnosis })}</p>
          </div>
          <div className="text-sm opacity-90 sm:text-right">
            <p>{t("report.periodLabel")}: {fmt.dayMonth(since)} – {fmt.long(now)}</p>
            <p>{t("report.visit")}: {fmt.dateTime(p.nextVisit)}</p>
            <p>{p.doctor} · {p.clinic}</p>
          </div>
        </header>
        <p className="mt-3 text-xs text-muted-foreground">{t("report.legend")}</p>

        <Section n="A" title={t("report.s.summary")} tag={["recorded"]}>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="font-medium">{t("report.available")}</p>
              <ul className="mt-1 list-disc pl-5">
                <li>{t("report.avail.readings", { n: readings.length })}</li>
                <li>{t("report.avail.logs", { n: logs.length })}</li>
                <li>{t("report.avail.meds", { n: doses.length })}</li>
                <li>{t("report.avail.checkins", { n: checkIns.length })}</li>
              </ul>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium">{t("report.missingTitle")}</p>
              {missing.length ? <ul className="mt-1 list-disc pl-5">{missing.map((m) => <li key={m}>{m}</li>)}</ul> : <p className="mt-1 text-muted-foreground">—</p>}
            </div>
          </div>
        </Section>

        <Section n="B" title={t("report.s.glucose")} tag={["recorded", "rule"]}>
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              [t("report.readings"), String(readings.length)],
              [t("report.average"), `${avg} mmol/L`],
              [t("report.range"), vals.length ? `${fmt.number(Math.min(...vals))}–${fmt.number(Math.max(...vals))}` : "—"],
              [t("report.fastingAvg"), b.recentMean ? `${b.recentMean} mmol/L` : "—"],
            ].map(([k, v]) => <div key={k} className="rounded-lg border p-3"><p className="text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></div>)}
          </div>
          <GlucoseChart readings={readings} t={th} height={220} />
          <div className="mt-4 space-y-4">
            {findings.filter((f) => f.evidence.length || !f.sufficient).map((f) => (
              <div key={f.id} className="text-sm">
                <p className="font-semibold">{t(`patterns.${f.id}.title`, f.params)}</p>
                <p>{t(`patterns.${f.id}.summary`, f.params)}</p>
                <p className="mb-2 text-xs text-muted-foreground">{t("patterns.labels.rule")}: {t(`patterns.${f.id}.rule`, f.params)}</p>
                <EvidenceTable readings={f.evidence} t={th} />
              </div>
            ))}
          </div>
        </Section>

        <Section n="C" title={t("report.s.medication")} tag={["recorded", "patient"]}>
          <ul className="mb-3 list-disc pl-5 text-sm">
            {data.medications.map((m) => <li key={m.id}>{m.name} {m.dose} {m.unit} · {m.times.map(fmt.hhmm).join(", ")} · {t(`med.freq.${m.frequency}`)}{m.paused ? ` · ${t("med.paused")}` : ""}{m.instructions ? ` — ${m.instructions}` : ""}</li>)}
          </ul>
          <div className="mb-2 flex flex-wrap gap-2 text-sm">
            {(["taken", "skipped", "postponed", "not_logged"] as const).map((s) => <span key={s} className="flex items-center gap-1"><DoseStatusBadge status={s} /> {count(s)}</span>)}
          </div>
          <p className="text-xs text-muted-foreground">{t("report.medNote")}</p>
        </Section>

        <Section n="D" title={t("report.s.lifestyle")} tag={["patient"]}>
          {logs.length === 0 ? <p className="text-sm text-muted-foreground">{t("report.nothing")}</p> : (
            <table className="w-full text-sm">
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="w-36 py-1.5 align-top text-muted-foreground">{fmt.dateTime(l.timestamp)}</td>
                    <td className="w-28 py-1.5 align-top">{t(`category.${l.category}`)}</td>
                    <td className="py-1.5">{l.title}{l.detail ? ` — ${l.detail}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {checkIns.some((c) => c.reflection) && (
            <div className="mt-3 text-sm">
              <p className="font-medium">{t("report.reflections")}</p>
              <ul className="list-disc pl-5">{checkIns.filter((c) => c.reflection).map((c) => <li key={c.date}>{fmt.date(c.date)}: “{c.reflection}”</li>)}</ul>
            </div>
          )}
        </Section>

        <Section n="E" title={t("report.s.carePlan")} tag={["recorded", "patient"]}>
          <ul className="space-y-2 text-sm">
            {data.goals.map((g) => {
              const followed = checkIns.filter((c) => c.followedGoal === "yes").length;
              return (
                <li key={g.id} className="rounded-lg border p-3">
                  <p className="font-medium">{g.description}</p>
                  <p className="text-muted-foreground">{g.creatorName} · {fmt.date(g.startDate)} – {fmt.date(g.targetDate)} · {g.completedAt ? t("care.completed") : t("report.followedDays", { n: followed, total: checkIns.length })}</p>
                </li>
              );
            })}
          </ul>
          {checkIns.some((c) => c.difficulties) && (
            <div className="mt-3 text-sm">
              <p className="font-medium">{t("progress.barriers")}</p>
              <ul className="list-disc pl-5">{checkIns.filter((c) => c.difficulties).map((c) => <li key={c.date}>{fmt.date(c.date)}: {c.difficulties}</li>)}</ul>
            </div>
          )}
          <p className="mt-2 text-sm">{t("report.followUpStatus", { d: fmt.dateTime(p.nextVisit) })}</p>
        </Section>

        <Section n="F" title={t("report.s.caregiver")} tag={["rule"]}>
          {alerts.length === 0 ? <p className="text-sm text-muted-foreground">{t("report.noAlerts")}</p> : (
            <ul className="space-y-1 text-sm">
              {alerts.map((a) => (
                <li key={a.id}>{fmt.dateTime(a.createdAt)} · {t(`cg.cat.${a.category}`)} · {t(`cg.sev.${a.severity}`)} · {a.status === "acknowledged" ? t("cg.acknowledgedAt", { d: fmt.dateTime(a.acknowledgedAt!) }) : t("cg.notAcknowledged")}</li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{t("report.alertNote")}</p>
        </Section>

        <Section n="G" title={t("report.s.explanation")} tag={["ai"]}>
          <p className="text-sm">{findings.some((f) => f.id === "baseline-shift" || f.id === "repeated-fasting") ? t("report.explainShift") : t("report.explainNone")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("report.explainNote")}</p>
        </Section>

        <Section n="H" title={t("report.s.questions")} tag={["suggested"]}>
          <ul className="space-y-2">
            {questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-2.5 text-sm">•</span>
                <Input value={q} aria-label={`${t("report.s.questions")} ${i + 1}`} onChange={(e) => editQ(questions.map((x, j) => (j === i ? e.target.value : x)))} className="h-10 border-transparent text-sm print:border-0 focus:border-input" />
                <Button variant="ghost" size="icon" className="no-print h-10 w-10 shrink-0" aria-label={t("common.remove")} onClick={() => editQ(questions.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
          <div className="no-print mt-2 flex gap-2">
            <Input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder={t("report.addQuestion")} className="h-10" maxLength={300} />
            <Button variant="outline" className="h-10" onClick={() => { if (newQ.trim()) { editQ([...questions, newQ.trim()]); setNewQ(""); } }}><Plus className="h-4 w-4" /></Button>
            {data.doctorQuestions && <Button variant="ghost" className="h-10" onClick={() => setDoctorQuestions(null)} aria-label={t("report.regenerate")}><RotateCcw className="h-4 w-4" /></Button>}
          </div>
        </Section>

        <Section n="I" title={t("report.s.notes")} tag={["doctor"]}>
          <p className="mb-3 rounded-lg border border-warning/40 bg-warning-soft p-2 text-xs">{t("report.simulatedClinician")}</p>
          {data.doctorNotes.map((n) => (
            <div key={n.id} className="mb-3 rounded-lg border p-3 text-sm">
              <p className="text-xs text-muted-foreground">{fmt.dateTime(n.createdAt)} · {n.author}{n.simulated ? ` · ${t("report.simulated")}` : ""}</p>
              {n.assessment && <p><span className="font-medium">{t("report.assessment")}:</span> {n.assessment}</p>}
              {n.plan && <p><span className="font-medium">{t("report.plan")}:</span> {n.plan}</p>}
              {n.followUpGoal && <p><span className="font-medium">{t("report.followUpGoal")}:</span> {n.followUpGoal}</p>}
            </div>
          ))}
          <div className="no-print grid gap-3">
            <div><Label htmlFor="dn-a">{t("report.assessment")}</Label><Textarea id="dn-a" rows={2} value={assessment} onChange={(e) => setAssessment(e.target.value)} className="mt-1.5 text-sm" /></div>
            <div><Label htmlFor="dn-p">{t("report.plan")}</Label><Textarea id="dn-p" rows={2} value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-1.5 text-sm" /></div>
            <div><Label htmlFor="dn-g">{t("report.followUpGoal")}</Label><Input id="dn-g" value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-1.5 h-11 text-sm" placeholder={t("report.followUpGoalPh")} /></div>
            <Button
              className="h-11 justify-self-start"
              onClick={() => {
                if (!assessment.trim() && !plan.trim() && !goal.trim()) return toast.error(t("report.noteEmpty"));
                addDoctorNote({ author: `${p.doctor}`, simulated: true, assessment: assessment.trim(), plan: plan.trim(), followUpGoal: goal.trim() || undefined });
                if (goal.trim()) {
                  const today = format(now, "yyyy-MM-dd");
                  addGoal({ description: goal.trim(), explanation: plan.trim() || t("report.goalFromVisit"), createdBy: "doctor", creatorName: p.doctor, startDate: today, targetDate: format(addDays(now, 13), "yyyy-MM-dd"), followUpDate: addDays(now, 28).toISOString(), simulated: true });
                }
                toast.success(goal.trim() ? t("report.noteSavedGoal") : t("report.noteSaved"));
                setAssessment(""); setPlan(""); setGoal("");
              }}
            >
              {t("report.saveNote")}
            </Button>
          </div>
        </Section>
      </article>
    </div>
  );
}
