import { useLanguage } from "@/lib/i18n";

import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GlucoseReading, Thresholds } from "@/lib/types";
import { CONTEXT_LABELS } from "@/lib/types";

type DotGroup = "fasting" | "after_meal" | "other";
const DOT_COLORS: Record<DotGroup, string> = {
  fasting: "var(--color-primary)",
  after_meal: "#f59e0b",
  other: "var(--color-muted-foreground)",
};
const DOT_LABELS: Record<DotGroup, string> = {
  fasting: "Fasting",
  after_meal: "After meal",
  other: "Other",
};
function groupFor(context: GlucoseReading["context"]): DotGroup {
  if (context === "fasting") return "fasting";
  if (context === "after_meal") return "after_meal";
  return "other";
}

export function GlucoseChart({ readings, t, height = 260 }: { readings: GlucoseReading[]; t: Thresholds; height?: number }) {
  const { t: tr, format } = useLanguage();
  if (!readings.length) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground" style={{ height }}>
        {tr("No readings in this period yet.")}</div>
    );
  }
  const data = [...readings]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((r) => ({ x: new Date(r.timestamp).getTime(), value: r.value, context: r.context }));
  const values = data.map((d) => d.value);
  const lowestValue = Math.min(...values);
  const highestValue = Math.max(...values);
  const yMin = Math.min(2, lowestValue - 1);
  const yMax = Math.max(14, highestValue + 1);
  return (
    <div style={{ height }} role="img" aria-label={tr("Glucose readings chart in mmol/L")}>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <ReferenceArea y1={t.hypo} y2={t.fastingHigh} fill="var(--color-success)" fillOpacity={0.08} />
          <ReferenceLine y={t.postMealHigh} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: tr("After-meal limit"), position: "insideTopRight", fontSize: 11, fill: "#f59e0b" }} />
          <XAxis
            dataKey="x"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v) => format(new Date(v), "d MMM")}
            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
            stroke="var(--color-border)"
          />
          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" />
          <Tooltip
            labelFormatter={(v) => format(new Date(v as number), "EEE d MMM, h:mm a")}
            formatter={(v: number, _n, p) => [`${v} mmol/L`, tr(CONTEXT_LABELS[(p.payload as { context: keyof typeof CONTEXT_LABELS }).context])]}
            contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={(props: { cx?: number; cy?: number; payload?: { context: GlucoseReading["context"] }; key?: string }) => {
              const { cx, cy, payload, key } = props;
              const group = groupFor(payload?.context ?? "random");
              return <circle key={key} cx={cx} cy={cy} r={4} fill={DOT_COLORS[group]} stroke="var(--color-background)" strokeWidth={1} />;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
        {(Object.keys(DOT_LABELS) as DotGroup[]).map((g) => (
          <span key={g} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DOT_COLORS[g] }} />
            {tr(DOT_LABELS[g])}
          </span>
        ))}
      </div>
      <p className="sr-only">{tr("Shaded band shows the demo reference range")}{" "}{t.hypo}–{t.fastingHigh} mmol/L.</p>
    </div>
  );
}
