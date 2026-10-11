import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import type { PatternFinding } from "@/lib/patterns";
import type { GlucoseReading, Thresholds } from "@/lib/types";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-navy md:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SampleBadge({ children }: { children?: ReactNode }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center rounded-full border border-dashed px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {children ?? t("common.sampleData")}
    </span>
  );
}

export function PageLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export type Status = "low" | "high" | "in";
export function readingStatus(r: GlucoseReading, t: Thresholds): Status {
  if (r.value < t.hypo) return "low";
  const high = r.context === "after_meal" || r.context === "bedtime" ? t.postMealHigh : t.fastingHigh;
  return r.value > high ? "high" : "in";
}

/** Status uses icon + text + colour (never colour alone). */
export function StatusPill({ status }: { status: Status }) {
  const { t } = useI18n();
  const map = {
    in: [CheckCircle2, "bg-success-soft text-success"],
    high: [AlertTriangle, "bg-warning-soft text-warning"],
    low: [ShieldAlert, "bg-danger-soft text-destructive"],
  } as const;
  const [Icon, cls] = map[status];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" aria-hidden />
      {t(`status.${status}`)}
    </span>
  );
}

export function ReadingValue({ r }: { r: GlucoseReading }) {
  const { t, fmt } = useI18n();
  return (
    <>
      {fmt.number(r.value)} <span className="text-muted-foreground">mmol/L</span>
      {r.originalUnit === "mg/dL" && r.originalValue !== undefined && (
        <span className="ml-1 text-xs text-muted-foreground">({t("glucose.enteredAs", { v: r.originalValue, u: r.originalUnit })})</span>
      )}
    </>
  );
}

export function EvidenceTable({ readings, t: th }: { readings: GlucoseReading[]; t: Thresholds }) {
  const { t, fmt } = useI18n();
  if (!readings.length) return null;
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">{t("common.date")}</th>
            <th className="px-3 py-2 font-medium">{t("glucose.context")}</th>
            <th className="px-3 py-2 text-right font-medium">mmol/L</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="whitespace-nowrap px-3 py-2">{fmt.dateTime(r.timestamp)}</td>
              <td className="px-3 py-2">{t(`context.${r.context}`)}</td>
              <td className="px-3 py-2 text-right font-medium">
                <span className="whitespace-nowrap">{fmt.number(r.value)}</span>{" "}
                <span className="ml-1 align-middle">
                  <StatusPill status={readingStatus(r, th)} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FindingCard({ f, t: th, compact }: { f: PatternFinding; t: Thresholds; compact?: boolean }) {
  const { t, fmt } = useI18n();
  const tone =
    f.severity === "alert"
      ? { Icon: ShieldAlert, cls: "border-destructive/40 bg-danger-soft", ic: "text-destructive" }
      : f.severity === "watch"
        ? { Icon: AlertTriangle, cls: "border-warning/40 bg-warning-soft", ic: "text-warning" }
        : { Icon: Info, cls: "bg-card", ic: "text-muted-foreground" };
  const k = `patterns.${f.id}`;
  return (
    <div className={`rounded-xl border p-4 ${tone.cls}`}>
      <div className="flex gap-3">
        <tone.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.ic}`} aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-semibold">
            <span className="sr-only">{t(`severity.${f.severity}`)}: </span>
            {t(`${k}.title`, f.params)}
          </p>
          <p className="text-[15px]">{t(`${k}.summary`, f.params)}</p>
          {f.dates && f.dates.length > 0 && <p className="text-sm">{f.dates.map((d) => fmt.date(d)).join(" · ")}</p>}
          {!compact && (
            <dl className="grid gap-1 text-sm">
              <div><dt className="inline font-medium">{t("patterns.labels.rule")}: </dt><dd className="inline">{t(`${k}.rule`, f.params)}</dd></div>
              <div><dt className="inline font-medium">{t("patterns.labels.sufficiency")}: </dt><dd className="inline">{t(f.sufficient ? "patterns.labels.sufficient" : "patterns.labels.insufficient")} {t(`${k}.sufficiency`, f.params)}</dd></div>
              <div><dt className="inline font-medium">{t("patterns.labels.next")}: </dt><dd className="inline">{t(`${k}.next`, f.params)}</dd></div>
            </dl>
          )}
          <p className="text-xs text-muted-foreground">
            {t("patterns.labels.evidenceCount", { n: f.evidence.length })} · {t("patterns.labels.demoThresholds")}
          </p>
          {!compact && <EvidenceTable readings={f.evidence} t={th} />}
        </div>
      </div>
    </div>
  );
}

export function UrgentGuidance({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div role="alert" className={`rounded-xl border-2 border-destructive/50 bg-danger-soft p-4 ${className}`}>
      <p className="flex items-center gap-2 font-semibold text-destructive">
        <ShieldAlert className="h-5 w-5" aria-hidden />
        {t("urgent.title")}
      </p>
      <p className="mt-1 text-[15px]">{t("urgent.body")}</p>
      <p className="mt-2 text-xs text-muted-foreground">{t("urgent.review")}</p>
    </div>
  );
}
