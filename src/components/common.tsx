import { useLanguage } from "@/lib/i18n";

import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PatternFinding } from "@/lib/patterns";
import { CONTEXT_LABELS, type GlucoseReading, type Thresholds } from "@/lib/types";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const { t: tr, format } = useLanguage();
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy md:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SampleBadge({ children }: { children?: ReactNode }) {
  const { t: tr, format } = useLanguage();
  return (
    <span className="inline-flex items-center rounded-full border border-dashed px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {typeof children === "string" ? tr(children) : children ?? tr("Sample data")}
    </span>
  );
}

export function PageLoading() {
  const { t: tr, format } = useLanguage();
  return (
    <div className="space-y-4" aria-busy="true" aria-label={tr("Loading")}>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export type Status = "low" | "high" | "in" ;
export function readingStatus(r: GlucoseReading, t: Thresholds): Status {
  if (r.value < t.hypo) return "low";
  const high = r.context === "after_meal" ? t.postMealHigh : t.fastingHigh;
  return r.value > high ? "high" : "in";
}

export function StatusPill({ status }: { status: Status }) {
  const { t: tr, format } = useLanguage();
  const map = {
    in: [tr("In demo range"), "bg-success-soft text-success"],
    high: [tr("Above demo range"), "bg-warning-soft text-warning"],
    low: [tr("Below demo range"), "bg-danger-soft text-destructive"],
  } as const;
  const [label, cls] = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{tr(label)}</span>;
}

export function EvidenceTable({ readings, t }: { readings: GlucoseReading[]; t: Thresholds }) {
  const { t: tr, format } = useLanguage();
  if (!readings.length) return null;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">{tr("Date")}</th>
            <th className="px-3 py-2 font-medium">{tr("Context")}</th>
            <th className="px-3 py-2 text-right font-medium">mmol/L</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-3 py-2">{format(new Date(r.timestamp), "EEE d MMM, h:mm a")}</td>
              <td className="px-3 py-2">{tr(CONTEXT_LABELS[r.context])}</td>
              <td className="px-3 py-2 text-right font-medium">
                {r.value.toFixed(1)} <span className="ml-1 align-middle"><StatusPill status={readingStatus(r, t)} /></span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FindingCard({ f, t, compact }: { f: PatternFinding; t: Thresholds; compact?: boolean }) {
  const { t: tr, format } = useLanguage();
  const tone =
    f.severity === "alert"
      ? { Icon: ShieldAlert, cls: "border-destructive/40 bg-danger-soft", ic: "text-destructive" }
      : f.severity === "watch"
        ? { Icon: AlertTriangle, cls: "border-warning/40 bg-warning-soft", ic: "text-warning" }
        : { Icon: Info, cls: "bg-card", ic: "text-muted-foreground" };
  return (
    <div className={`rounded-xl border p-4 ${tone.cls}`}>
      <div className="flex gap-3">
        <tone.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.ic}`} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-semibold">{tr(f.title)}</p>
          <p className="text-[15px]">{tr(f.summary)}</p>
          {f.uncertainty && <p className="text-sm italic text-muted-foreground">{tr(f.uncertainty)}</p>}
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{tr("Rule:")}</span> {tr(f.rule)} · {f.evidence.length} {tr("supporting reading")} {tr("· demo thresholds")}</p>
          {!compact && <EvidenceTable readings={f.evidence} t={t} />}
        </div>
      </div>
    </div>
  );
}
