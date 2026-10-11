import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GlucoseContext, GlucoseReading, Thresholds } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

// Only recorded points are drawn; gaps between days are not interpolated into fake readings
// (the line connects recorded points only, each shown as a dot).
export function GlucoseChart({ readings, t: th, height = 260 }: { readings: GlucoseReading[]; t: Thresholds; height?: number }) {
  const { t, fmt } = useI18n();
  if (!readings.length) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground" style={{ height }}>
        {t("chart.empty")}
      </div>
    );
  }
  const data = [...readings]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((r) => ({ x: new Date(r.timestamp).getTime(), value: r.value, context: r.context }));
  const max = Math.max(14, Math.ceil(Math.max(...data.map((d) => d.value)) + 1));
  return (
    <div>
      <div style={{ height }} role="img" aria-label={t("chart.aria", { n: data.length })}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <ReferenceArea y1={th.hypo} y2={th.fastingHigh} fill="var(--color-success)" fillOpacity={0.08} />
            <ReferenceLine y={th.hypo} stroke="var(--color-destructive)" strokeDasharray="4 4" />
            <ReferenceLine y={th.postMealHigh} stroke="var(--color-warning)" strokeDasharray="4 4" />
            <XAxis
              dataKey="x"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => fmt.dayMonth(new Date(v))}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              stroke="var(--color-border)"
              minTickGap={24}
            />
            <YAxis domain={[2, max]} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" />
            <Tooltip
              labelFormatter={(v) => fmt.dateTime(new Date(v as number))}
              formatter={(v: number, _n, p) => [`${v} mmol/L`, t(`context.${(p.payload as { context: GlucoseContext }).context}`)]}
              contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)" }}
            />
            <Line type="linear" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-primary)" }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span><span className="mr-1 inline-block h-2.5 w-4 rounded-sm bg-success/20 align-middle" />{t("chart.band", { lo: th.hypo, hi: th.fastingHigh })}</span>
        <span><span className="mr-1 inline-block w-4 border-t-2 border-dashed border-destructive align-middle" />{t("chart.low", { v: th.hypo })}</span>
        <span><span className="mr-1 inline-block w-4 border-t-2 border-dashed border-warning align-middle" />{t("chart.postMeal", { v: th.postMealHigh })}</span>
      </p>
    </div>
  );
}
