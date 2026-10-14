import { parseISO } from "date-fns";
import { Timer } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { consultationBrief } from "@/lib/consultation";
import { detectPatterns } from "@/lib/patterns";
import { visibleCaregiverAlerts } from "@/lib/caregiver";
import type { AppData } from "@/lib/types";

export function ConsultationBrief({ data, since, now }: { data: AppData; since: Date; now: Date }) {
  const { t: tr, format } = useLanguage();
  const b = consultationBrief(data, since, now);
  const insufficient = tr("Insufficient data");
  const mm = (v: number | null) => (v === null ? insufficient : `${v.toFixed(1)} mmol/L`);
  const patterns = detectPatterns(data.readings, data.thresholds, now).filter((f) => f.kind === "repeated_high" && f.evidence.length);
  const name = (id: string) => data.medicationSchedules?.find((s) => s.id === id)?.name ?? tr("Medication record");
  const day = (d: string) => format(parseISO(d), "d MMM");
  const questions = data.pinnedQuestions ?? [];
  const alerts = visibleCaregiverAlerts(data).filter((a) => new Date(a.createdAt) >= since);
  const row = "flex flex-wrap gap-x-2 border-b py-1.5 last:border-0";
  return (
    <section className="mt-4 break-inside-avoid rounded-lg border-2 border-primary/40 p-4" aria-labelledby="brief-title">
      <h2 id="brief-title" className="flex items-center gap-2 text-lg font-semibold text-navy"><Timer className="h-5 w-5 text-primary" />{tr("30-Second Consultation Brief")}</h2>
      <p className="mb-3 text-xs text-muted-foreground">{tr("From recorded data only")} · {format(since, "d MMM")} – {format(now, "d MMM yyyy")} · {tr("No HbA1c estimate, diagnosis or risk score.")}</p>
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
        {[[tr("Readings"), String(b.count)], [tr("Average"), mm(b.average)], [tr("Lowest"), mm(b.lowest)], [tr("Highest"), mm(b.highest)], [tr("Within range"), b.inRangePct === null ? insufficient : `${b.inRangePct}%`]].map(([k, v]) => (
          <div key={k} className="rounded-md border p-2"><p className="text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></div>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{tr("Share of discrete finger-prick readings within demo thresholds (fasting or after-meal). Not continuous Time in Range.")}</p>
      <ul className="mt-3 text-sm">
        <li className={row}><b>{tr("Repeated patterns")}:</b>{patterns.length ? patterns.map((f) => <span key={f.id}>{tr(f.title)} ({f.evidence.map((r) => `${r.value.toFixed(1)} · ${format(new Date(r.timestamp), "d MMM")}`).join("; ")})</span>) : <span>{tr("None detected")}</span>}</li>
        <li className={row}><b>{tr("Taken (self-reported)")}:</b><span>{b.taken.length}</span></li>
        <li className={row}><b>{tr("Skipped")}:</b><span>{b.skipped.length ? b.skipped.map((s) => `${name(s.scheduleId)} ${day(s.date)}${s.reason ? ` – ${tr(s.reason)}` : ""}`).join("; ") : "0"}</span></li>
        <li className={row}><b>{tr("Not logged")}:</b><span>{b.unlogged.length} {tr("(not the same as missed)")}</span></li>
        <li className={row}><b>{tr("Patient questions from Copilot")}:</b><span>{questions.length ? questions.map((q) => tr(q.text)).join(" · ") : tr("None")}</span></li>
        <li className={row}><b>{tr("Caregiver alerts (consented, simulated)")}:</b><span>{alerts.length ? `${alerts.length} · ${alerts.filter((a) => a.acknowledgedAt).length} ${tr("acknowledged")}` : tr("None")}</span></li>
      </ul>
    </section>
  );
}
