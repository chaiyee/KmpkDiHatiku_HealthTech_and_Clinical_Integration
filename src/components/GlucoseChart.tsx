import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GlucoseReading, Thresholds } from "@/lib/types";
import { CONTEXT_LABELS } from "@/lib/types";

export function GlucoseChart({ readings, t, height = 260 }: { readings: GlucoseReading[]; t: Thresholds; height?: number }) {
  if (!readings.length) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground" style={{ height }}>
        No readings in this period yet.
      </div>
    );
  }
  const data = [...readings]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((r) => ({ x: new Date(r.timestamp).getTime(), value: r.value, context: r.context }));
  return (
    <div style={{ height }} role="img" aria-label="Glucose readings chart in mmol/L">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <ReferenceArea y1={t.hypo} y2={t.fastingHigh} fill="var(--color-success)" fillOpacity={0.08} />
          <XAxis
            dataKey="x"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v) => format(new Date(v), "d MMM")}
            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
            stroke="var(--color-border)"
          />
          <YAxis domain={[2, 14]} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" />
          <Tooltip
            labelFormatter={(v) => format(new Date(v as number), "EEE d MMM, h:mm a")}
            formatter={(v: number, _n, p) => [`${v} mmol/L`, CONTEXT_LABELS[(p.payload as { context: keyof typeof CONTEXT_LABELS }).context]]}
            contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)" }}
          />
          <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-primary)" }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="sr-only">Shaded band shows the demo reference range {t.hypo}–{t.fastingHigh} mmol/L.</p>
    </div>
  );
}
