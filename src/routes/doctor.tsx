import { createFileRoute } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GlucoseChart } from "@/components/GlucoseChart";
import { EvidenceTable, PageLoading } from "@/components/common";
import { useStore } from "@/lib/store";
import { detectPatterns, fastingBaseline } from "@/lib/patterns";
import { CATEGORY_LABELS } from "@/lib/types";
import type { ReactNode } from "react";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Doctor Visit Report · DiaMonitor Copilot" },
      { name: "description", content: "A concise, printable consultation report built from the patient's recorded data." },
      { property: "og:title", content: "Doctor Visit Report · DiaMonitor Copilot" },
      { property: "og:description", content: "A concise, printable consultation report built from the patient's recorded data." },
    ],
  }),
  component: DoctorPage,
});

function Section({ n, title, tag, children }: { n: number; title: string; tag: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid border-t py-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-navy">{n}. {title}</h2>
        <span className="rounded border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{tag}</span>
      </div>
      {children}
    </section>
  );
}

function DoctorPage() {
  const { data, setDoctorNotes } = useStore();
  const [range, setRange] = useState("7");
  const [notes, setNotes] = useState("");
  useEffect(() => { if (data) setNotes(data.doctorNotes); }, [data?.doctorNotes]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!data) return <PageLoading />;
  const now = new Date();
  const since = subDays(now, Number(range));
  const t = data.thresholds;
  const readings = data.readings.filter((r) => new Date(r.timestamp) >= since).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const logs = data.logs.filter((l) => new Date(l.timestamp) >= since).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const findings = detectPatterns(data.readings, t, now).filter((f) => f.evidence.length || f.uncertainty);
  const b = fastingBaseline(data.readings, t, now);
  const vals = readings.map((r) => r.value);
  const avg = vals.length ? (vals.reduce((a, c) => a + c, 0) / vals.length).toFixed(1) : "—";
  const meds = logs.filter((l) => l.category === "medication");
  const medDays = new Set(meds.map((m) => format(new Date(m.timestamp), "yyyy-MM-dd"))).size;
  const p = data.patient;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy">Doctor Visit</h1>
          <p className="text-muted-foreground">Your consultation report, ready to share or print.</p>
        </div>
        <div className="flex gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-11 w-40" aria-label="Report period"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button className="h-11" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print / Save PDF</Button>
        </div>
      </div>

      <article className="rounded-xl border-2 border-navy/15 bg-card p-5 shadow-sm md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 rounded-lg bg-navy p-4 text-navy-foreground">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Pre-consultation summary · DEMO</p>
            <p className="mt-1 text-xl font-semibold">{p.name}</p>
            <p className="text-sm opacity-90">{p.age} y · {p.sex} · {p.diabetesType} ({p.yearsSinceDiagnosis} y)</p>
          </div>
          <div className="text-sm opacity-90 sm:text-right">
            <p>Period: {format(since, "d MMM")} – {format(now, "d MMM yyyy")}</p>
            <p>Visit: {format(new Date(p.nextVisit), "d MMM yyyy, h:mm a")}</p>
            <p>{p.doctor}</p>
          </div>
        </header>
        <p className="mt-3 text-xs text-muted-foreground">
          Fictional patient. Legend: <b>Recorded</b> = entered by patient · <b>Rule-detected</b> = deterministic rules, demo thresholds · <b>AI-generated</b> = explanatory text (demo, not verified). Nothing here is a diagnosis.
        </p>

        <Section n={1} title="Glucose overview" tag="Recorded">
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["Readings", String(readings.length)],
              ["Average", `${avg} mmol/L`],
              ["Range", vals.length ? `${Math.min(...vals).toFixed(1)}–${Math.max(...vals).toFixed(1)}` : "—"],
              ["Fasting avg (7d)", b.recentMean ? `${b.recentMean} mmol/L` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border p-3"><p className="text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></div>
            ))}
          </div>
          <GlucoseChart readings={readings} t={t} height={220} />
        </Section>

        <Section n={2} title="Detected patterns" tag="Rule-detected">
          {findings.length === 0 ? <p className="text-sm text-muted-foreground">No patterns detected.</p> : (
            <div className="space-y-4">
              {findings.map((f) => (
                <div key={f.id} className="text-sm">
                  <p className="font-semibold">{f.title}</p>
                  <p>{f.summary}</p>
                  <p className="mb-2 text-xs text-muted-foreground">Rule: {f.rule}{f.uncertainty ? ` · ${f.uncertainty}` : ""}</p>
                  <EvidenceTable readings={f.evidence} t={t} />
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section n={3} title="Symptoms & lifestyle context" tag="Recorded">
          {logs.filter((l) => l.category !== "medication").length === 0 ? <p className="text-sm text-muted-foreground">Nothing logged in this period.</p> : (
            <table className="w-full text-sm">
              <tbody>
                {logs.filter((l) => l.category !== "medication").map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="w-32 py-1.5 text-muted-foreground">{format(new Date(l.timestamp), "d MMM, h:mm a")}</td>
                    <td className="w-24 py-1.5">{CATEGORY_LABELS[l.category]}</td>
                    <td className="py-1.5">{l.title}{l.detail ? ` — ${l.detail}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section n={4} title="Medication records" tag="Recorded">
          <p className="text-sm">{meds.length ? `${meds[0]!.title}: recorded on ${medDays} of ${range} days.` : "No medication records in this period."}</p>
          <p className="mt-1 text-xs text-muted-foreground">These are patient-entered records, not confirmed adherence. A day without a record does not mean a dose was missed.</p>
        </Section>

        <Section n={5} title="Plain-language explanation" tag="AI-generated · demo">
          <p className="text-sm">
            {findings.some((f) => f.kind === "baseline_shift" && f.severity === "watch")
              ? "Morning readings have been higher this week than earlier. Late nights and late, heavier dinners were also logged on some of these days. These occurred around the same time; the records do not show that one caused the other."
              : "Readings in this period look broadly similar to earlier records based on the available data."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Template-generated demo text. Not reviewed by a clinician; no sources retrieved.</p>
        </Section>

        <Section n={6} title="Questions the patient may want to discuss" tag="Suggested">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>What could be contributing to my higher morning readings?</li>
            <li>Are my target ranges right for me?</li>
            <li>Should late dinners or sleep timing be something I work on?</li>
            <li>When should I contact the clinic between visits?</li>
          </ul>
        </Section>

        <Section n={7} title="Clinician review notes" tag="Doctor">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Observations reviewed, plan discussed…" className="text-sm print:border-0" />
          <Button variant="outline" className="no-print mt-2" onClick={() => { setDoctorNotes(notes); toast.success("Notes saved."); }}>Save notes</Button>
        </Section>
      </article>
    </div>
  );
}
