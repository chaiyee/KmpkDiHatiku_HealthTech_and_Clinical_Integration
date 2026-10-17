import { useLanguage } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, parseISO, subDays } from "date-fns";
import { useEffect, useState } from "react";
import { Printer, ClipboardCheck, Stethoscope, CalendarCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { GlucoseChart } from "@/components/GlucoseChart";
import { EvidenceTable, PageLoading } from "@/components/common";
import { useStore } from "@/lib/store";
import { detectPatterns, fastingBaseline } from "@/lib/patterns";
import { CATEGORY_LABELS } from "@/lib/types";
import type { ReactNode } from "react";
import { visibleCaregiverAlerts, URGENT_NOTICE } from "@/lib/caregiver";
import { CaregiverAlertDetails } from "@/components/CaregiverSupport";
import { localDay, statusFor, WEEKDAYS } from "@/lib/medications";
import { ConsultationBrief } from "@/components/ConsultationBrief";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Doctor Visit Report · DiaMonitor Copilot" },
      {
        name: "description",
        content: "A concise, printable consultation report built from the patient's recorded data.",
      },
      { property: "og:title", content: "Doctor Visit Report · DiaMonitor Copilot" },
      {
        property: "og:description",
        content: "A concise, printable consultation report built from the patient's recorded data.",
      },
    ],
  }),
  component: DoctorPage,
});

function Section({
  n,
  title,
  tag,
  children,
}: {
  n: number;
  title: string;
  tag: string;
  children: ReactNode;
}) {
  return (
    <details open={n === 6} className="break-inside-avoid border-t py-4">
      <summary className="min-h-12 cursor-pointer content-center text-navy marker:text-primary">
        <span className="inline-flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-navy">{title}</span>
          <span className="rounded border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {tag}
          </span>
        </span>
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}

function DoctorPage() {
  const { t: tr, format } = useLanguage();
  const { data, saveQuestions, removeQuestion, toggleDiscussed } = useStore();
  const [range, setRange] = useState("7");
  const [questions, setQuestions] = useState("");
  const consultationQuestions = data?.consultationQuestions;
  useEffect(() => {
    setQuestions(consultationQuestions ?? "");
  }, [consultationQuestions]);
  if (!data) return <PageLoading />;
  const now = new Date();
  const since = subDays(now, Number(range));
  const t = data.thresholds;
  const readings = data.readings
    .filter((r) => new Date(r.timestamp) >= since)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const logs = data.logs
    .filter((l) => new Date(l.timestamp) >= since)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const findings = detectPatterns(data.readings, t, now).filter(
    (f) => f.evidence.length || f.uncertainty,
  );
  const b = fastingBaseline(data.readings, t, now);
  const vals = readings.map((r) => r.value);
  const avg = vals.length ? (vals.reduce((a, c) => a + c, 0) / vals.length).toFixed(1) : "—";
  const inRangeCount = readings.filter(
    (r) => r.value >= t.hypo && r.value <= t.postMealHigh,
  ).length;
  const inRangePct = readings.length ? Math.round((inRangeCount / readings.length) * 100) : null;
  const meds = logs.filter((l) => l.category === "medication");
  const medDays = new Set(meds.map((m) => format(new Date(m.timestamp), "yyyy-MM-dd"))).size;
  const p = data.patient;
  const schedules = data.medicationSchedules ?? [];
  const statuses = (data.medicationStatuses ?? []).filter(
    (status) => status.date >= localDay(since) && status.date <= localDay(now),
  );
  const plan = data.carePlan;
  const planDays = Array.from({ length: plan.durationDays }, (_, index) =>
    localDay(addDays(parseISO(plan.startDate), index)),
  );
  const completed = data.checkIns.filter(
    (checkIn) => checkIn.completed && planDays.includes(checkIn.date),
  ).length;
  const reflections = data.checkIns.filter(
    (checkIn) =>
      checkIn.reflection && checkIn.date >= localDay(since) && checkIn.date <= localDay(now),
  );
  const caregiverAlerts = visibleCaregiverAlerts(data).filter(
    (alert) => new Date(alert.createdAt) >= since && new Date(alert.createdAt) <= now,
  );
  const medicationLabels = { taken: "Taken", skipped: "Skipped", later: "Remind Later" };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="page-header no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy">{tr("Doctor Visit")}</h1>
          <p className="text-muted-foreground">
            {tr("Your consultation report, ready to share or print.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-11 w-40" aria-label={tr("Report period")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{tr("Last 7 days")}</SelectItem>
              <SelectItem value="14">{tr("Last 14 days")}</SelectItem>
              <SelectItem value="30">{tr("Last 30 days")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="h-11"
            onClick={() => {
              const sections = Array.from(document.querySelectorAll("article details"));
              const closed = sections.filter((section) => !section.hasAttribute("open"));
              sections.forEach((section) => section.setAttribute("open", ""));
              const restore = () => {
                closed.forEach((section) => section.removeAttribute("open"));
              };
              window.addEventListener("afterprint", restore, { once: true });
              window.print();
            }}
          >
            <Printer className="mr-2 h-4 w-4" />
            {tr("Print / Save PDF")}
          </Button>
        </div>
      </div>

      <nav
        aria-label={tr("Visit preparation sections")}
        className="no-print mb-5 flex flex-wrap gap-2"
      >
        {[
          ["before-visit", "Before Your Visit"],
          ["feedback-section", "Doctor's Feedback"],
          ["after-visit", "After Your Visit"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex min-h-11 items-center rounded-lg border bg-card px-4 py-2 font-medium text-primary"
          >
            {tr(label ?? "")}
          </a>
        ))}
      </nav>
      <article className="report-paper bg-card p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4 rounded-lg bg-navy p-4 text-navy-foreground">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">
              {tr("Consultation summary")}
            </p>
            <p className="mt-1 text-xl font-semibold">{p.name}</p>
            {(readings.some((r) => r.source !== "user") ||
              logs.some((log) => log.source !== "user")) && (
              <p className="text-xs opacity-90">{tr("Includes sample or simulated records")}</p>
            )}
            <p className="text-sm opacity-90">
              {p.age} {tr("y ·")} {tr(p.sex)} · {tr(p.diabetesType)} ({p.yearsSinceDiagnosis}{" "}
              {tr("y)")}
            </p>
          </div>
          <div className="text-sm opacity-90 sm:text-right">
            <p>
              {tr("Period:")} {format(since, "d MMM")} – {format(now, "d MMM yyyy")}
            </p>
            <p>
              {tr("Visit:")} {format(new Date(p.nextVisit), "d MMM yyyy, h:mm a")}
            </p>
            <p>{tr(p.doctor)}</p>
          </div>
        </header>
        {findings.some((finding) => finding.kind === "safety") && (
          <p className="mt-3 rounded-md bg-danger-soft p-3 text-sm text-destructive">
            {tr(URGENT_NOTICE)}
          </p>
        )}
        <ConsultationBrief data={data} since={since} now={now} />

        <h2
          id="before-visit"
          className="mt-6 mb-4 scroll-mt-28 flex items-center gap-2 text-xl font-semibold text-navy"
        >
          <ClipboardCheck className="h-5 w-5 text-primary" />
          {tr("Before Your Visit")}
        </h2>
        <div className="no-print mb-4 grid gap-2 sm:grid-cols-3">
          {["Review recent readings", "Bring your medication list", "Write your questions"].map(
            (text) => (
              <label key={text} className="flex min-h-12 items-center gap-3 rounded-lg border p-3">
                <input type="checkbox" className="h-5 w-5 accent-primary" />
                {tr(text)}
              </label>
            ),
          )}
        </div>
        <Section n={1} title={tr("Glucose overview")} tag={tr("Recorded")}>
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
            {[
              [tr("Readings"), String(readings.length)],
              [tr("Average"), `${avg} mmol/L`],
              [tr("Lowest"), vals.length ? `${Math.min(...vals).toFixed(1)} mmol/L` : "—"],
              [tr("Highest"), vals.length ? `${Math.max(...vals).toFixed(1)} mmol/L` : "—"],
              [tr("Within range"), inRangePct !== null ? `${inRangePct}%` : "—"],
              [tr("Fasting avg (7d)"), b.recentMean ? `${b.recentMean} mmol/L` : "—"],
            ].map(([k, v]) => (
              <div key={tr(k ?? "")} className="rounded-lg border p-3">
                <p className="text-muted-foreground">{tr(k ?? "")}</p>
                <p className="font-semibold">{v}</p>
              </div>
            ))}
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            {tr("Reading-based range summary · not CGM time in range")}
          </p>
          <GlucoseChart readings={readings} t={t} height={220} />
        </Section>

        <Section n={2} title={tr("Detected patterns")} tag={tr("Rule-detected")}>
          <p className="mb-3 text-xs text-muted-foreground">
            {tr(
              "Detected patterns use the existing 7-day monitoring window, regardless of report period.",
            )}
          </p>
          {findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tr("No patterns detected.")}</p>
          ) : (
            <div className="space-y-4">
              {findings.map((f) => (
                <div key={f.id} className="text-sm">
                  <p className="font-semibold">{tr(f.title)}</p>
                  <p>{tr(f.summary)}</p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {tr("Rule:")} {tr(f.rule)}
                    {f.uncertainty ? ` · ${tr(f.uncertainty)}` : ""}
                  </p>
                  <EvidenceTable readings={f.evidence} t={t} />
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section n={3} title={tr("Symptoms & lifestyle context")} tag={tr("Recorded")}>
          {logs.filter((l) => l.category !== "medication").length === 0 ? (
            <p className="text-sm text-muted-foreground">{tr("Nothing logged in this period.")}</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {logs
                  .filter((l) => l.category !== "medication")
                  .map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="w-32 py-1.5 text-muted-foreground">
                        {format(new Date(l.timestamp), "d MMM, h:mm a")}
                      </td>
                      <td className="w-24 py-1.5">{tr(CATEGORY_LABELS[l.category])}</td>
                      <td className="py-1.5">
                        {l.source === "sample" ? tr(l.title) : l.title}
                        {l.detail ? ` — ${l.source === "sample" ? tr(l.detail) : l.detail}` : ""}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section n={4} title={tr("Medication records")} tag={tr("Patient-reported")}>
          <p className="text-sm">
            {meds[0]
              ? tr("{title}: recorded on {days} of {range} days.", {
                  title: meds[0].source === "sample" ? tr(meds[0].title) : meds[0].title,
                  days: medDays,
                  range,
                })
              : tr("No medication records in this period.")}
          </p>
          <h3 className="mt-4 font-semibold">{tr("Medication schedules")}</h3>
          {!schedules.length && (
            <p className="mt-2 text-sm text-muted-foreground">{tr("No medication scheduled.")}</p>
          )}
          <ul className="mt-2 space-y-2 text-sm">
            {schedules.map((schedule) => {
              const status = statusFor(data.medicationStatuses ?? [], schedule.id, localDay(now));
              return (
                <li key={schedule.id}>
                  <p className="font-medium">
                    {schedule.name} · {schedule.dose} {schedule.unit}
                  </p>
                  <p className="text-muted-foreground">
                    {schedule.time} ·{" "}
                    {schedule.days.length === 7
                      ? tr("Daily")
                      : schedule.days.map((day) => tr(WEEKDAYS[day] ?? "")).join(", ")}
                  </p>
                  <p>
                    {tr("Today's medication status")}:{" "}
                    {schedule.days.includes(now.getDay())
                      ? tr(status ? medicationLabels[status.status] : "Not Logged")
                      : tr("Not scheduled today")}
                  </p>
                </li>
              );
            })}
          </ul>
          <h3 className="mt-4 font-semibold">{tr("Medication history · patient-entered")}</h3>
          {!statuses.length && (
            <p className="mt-2 text-sm text-muted-foreground">
              {tr("No medication updates in this period.")}
            </p>
          )}
          <ul className="mt-2 space-y-2 text-sm">
            {statuses.map((status) => (
              <li key={`${status.scheduleId}-${status.date}`}>
                {schedules.find((schedule) => schedule.id === status.scheduleId)?.name ??
                  tr("Medication record")}{" "}
                · {format(parseISO(status.date), "d MMM yyyy")} ·{" "}
                {tr({ taken: "Taken", skipped: "Skipped", later: "Delayed" }[status.status])}
                {status.reason && (
                  <>
                    {" "}
                    · {tr("Reason")}: {tr(status.reason)}
                  </>
                )}
                {status.note && <> · “{status.note}”</>}
                <span className="block text-xs text-muted-foreground">
                  {tr("Reported at")}: {format(new Date(status.updatedAt), "d MMM yyyy, HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section n={5} title={tr("Plain-language explanation")} tag={tr("Record summary")}>
          <p className="text-sm">
            {findings.some((f) => f.kind === "baseline_shift" && f.severity === "watch")
              ? tr(
                  "Morning readings have been higher this week than earlier. Late nights and late, heavier dinners were also logged on some of these days. These occurred around the same time; the records do not show that one caused the other.",
                )
              : tr(
                  "Readings in this period look broadly similar to earlier records based on the available data.",
                )}
          </p>
        </Section>

        <Section n={6} title={tr("Questions and concerns")} tag={tr("Patient-reported")}>
          <div className="no-print mb-4 space-y-3">
            <Label htmlFor="visit-questions">{tr("Your questions and concerns")}</Label>
            <Textarea
              id="visit-questions"
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              rows={3}
              className="text-base"
              maxLength={5000}
            />
            <Button
              onClick={() => {
                saveQuestions(questions.trim());
                toast.success(tr("Questions saved."));
              }}
            >
              {tr("Save questions")}
            </Button>
          </div>
          <p className="mb-3 whitespace-pre-wrap">
            {data.consultationQuestions || tr("No questions recorded yet.")}
          </p>
          <h3 className="mb-2 font-medium">{tr("Saved questions from Copilot")}</h3>
          {(data.pinnedQuestions ?? []).length ? (
            <ul className="mb-4 space-y-2">
              {(data.pinnedQuestions ?? []).map((q) => (
                <li key={q.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
                  <span
                    className={`flex-1 ${q.discussed ? "text-muted-foreground line-through" : ""}`}
                  >
                    {tr(q.text)}
                  </span>
                  <span className="no-print flex gap-2">
                    <Button
                      variant="outline"
                      className="min-h-11"
                      onClick={() => toggleDiscussed(q.id)}
                    >
                      {q.discussed ? tr("Mark not discussed") : tr("Mark discussed")}
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-11"
                      onClick={() => {
                        removeQuestion(q.id);
                        toast.success(tr("Question removed."));
                      }}
                    >
                      {tr("Remove")}
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-muted-foreground">
              {tr('No saved questions yet. Use "Add to Doctor Visit Questions" in the Copilot.')}
            </p>
          )}
          <h3 className="mb-2 font-medium">{tr("Questions the patient may want to discuss")}</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>{tr("What could be contributing to my higher morning readings?")}</li>
            <li>{tr("Are my target ranges right for me?")}</li>
            <li>{tr("Should late dinners or sleep timing be something I work on?")}</li>
            <li>{tr("When should I contact the clinic between visits?")}</li>
          </ul>
        </Section>

        <section id="feedback-section" className="mt-6 scroll-mt-28 border-t py-6">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-navy">
            <Stethoscope className="h-5 w-5 text-primary" />
            {tr("Doctor's Feedback")}
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            {tr(p.doctor)} · {tr("Sample feedback")}
            {data.doctorResponseAt &&
              ` · ${format(new Date(data.doctorResponseAt), "d MMM yyyy, HH:mm")}`}
          </p>
          <div className="space-y-4 border-l-4 border-primary pl-4">
            <div>
              <h3 className="font-semibold">{tr("Clinician review notes")}</h3>
              <p className="mt-1 whitespace-pre-wrap">
                {data.doctorNotes || tr("No doctor feedback recorded yet.")}
              </p>
            </div>
            <div>
              <h3 className="font-semibold">{tr("Doctor feedback")}</h3>
              <p className="mt-1 whitespace-pre-wrap">
                {tr(plan.doctorFeedback) || tr("No doctor feedback recorded yet.")}
              </p>
            </div>
          </div>
        </section>
        <section className="border-t py-5">
          <h2
            id="after-visit"
            className="mb-4 flex scroll-mt-28 items-center gap-2 text-xl font-semibold text-navy"
          >
            <CalendarCheck className="h-5 w-5 text-primary" />
            {tr("After Your Visit")}
          </h2>
          <h3 className="font-semibold">{tr("Doctor's goal")}</h3>
          <p className="mt-2 whitespace-pre-wrap">{tr(plan.goal)}</p>
          <p className="mt-2 text-muted-foreground">{tr(plan.explanation)}</p>
          <p className="mt-4 text-sm">
            {tr("Progress")}: {completed} {tr("of")} {plan.durationDays} {tr("days")}
          </p>
          <Progress
            className="mt-2 h-3"
            value={plan.durationDays ? (completed / plan.durationDays) * 100 : 0}
          />
          <h3 className="mt-4 font-semibold">{tr("Follow-up instructions")}</h3>
          <p className="mt-2 whitespace-pre-wrap">
            {data.followUpInstructions || tr("No follow-up instructions recorded yet.")}
          </p>
          <p className="mt-3">
            {tr("Follow-up:")} {format(new Date(plan.followUpDate), "d MMM yyyy, HH:mm")}
          </p>
          <Button asChild className="no-print mt-4 min-h-12">
            <Link to="/care-plan">
              {tr("View My Care Plan")}
              <ArrowRight />
            </Link>
          </Button>
        </section>
        <Section n={8} title={tr("Patient reflections")} tag={tr("Patient-reported")}>
          {!reflections.length && (
            <p className="text-muted-foreground">{tr("No patient reflections in this period.")}</p>
          )}
          <ul className="space-y-2">
            {reflections.map((checkIn) => (
              <li key={checkIn.date}>
                {format(parseISO(checkIn.date), "d MMM yyyy")} · {checkIn.reflection}
              </li>
            ))}
          </ul>
        </Section>
        <Section
          n={9}
          title={tr("Caregiver alert history · simulated")}
          tag={tr("Rule-detected · simulated")}
        >
          <p className="mb-3 text-xs text-muted-foreground">
            {tr("Preview only · no messages sent")}
          </p>
          {!caregiverAlerts.length && (
            <p className="text-sm text-muted-foreground">
              {tr("No permitted caregiver alerts in this report period.")}
            </p>
          )}
          <div className="space-y-5">
            {caregiverAlerts.slice(0, 10).map((alert) => (
              <CaregiverAlertDetails key={alert.id} alert={alert} report />
            ))}
          </div>
        </Section>
      </article>
    </div>
  );
}
