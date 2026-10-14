import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { CartesianGrid, Line, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Area } from "recharts";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fastingForecast } from "@/lib/forecast";
import { useStore } from "@/lib/store";
import type { GlucoseReading, Thresholds } from "@/lib/types";

export function FastingForecastCard({ readings, thresholds, now, nextVisit }: { readings: GlucoseReading[]; thresholds: Thresholds; now: Date; nextVisit: Date }) {
  const { t: tr, format } = useLanguage();
  const { data, pinQuestion } = useStore();
  const [added, setAdded] = useState(false);
  const result = fastingForecast(readings, thresholds, now, nextVisit);

  const question = tr("My morning readings have been rising — can we review my fasting trend and whether anything should change before my next visit?");
  const pinned = added || (data?.pinnedQuestions ?? []).some((q) => q.text === question);

  const chartData = (() => {
    const map = new Map<string, { date: string; actual?: number; projected?: number; low?: number; high?: number; band?: [number, number] }>();
    for (const p of result.actual) map.set(p.date, { date: p.date, actual: p.value });
    for (const p of result.projection) {
      const existing = map.get(p.date) ?? { date: p.date };
      map.set(p.date, { ...existing, projected: p.value, low: p.low, high: p.high, band: [p.low, p.high] });
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  })();

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <TrendingUp className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg">{tr("Fasting trend and projection")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.available && result.projectedAtVisit !== undefined ? (
          <>
            <div>
              <p className="text-xl font-semibold text-navy md:text-2xl">
                {tr("If this pace continues, your morning reading may be around {value} mmol/L by your visit on {date}.", {
                  value: result.projectedAtVisit.toFixed(1),
                  date: format(nextVisit, "EEE d MMM"),
                })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{tr("Simple straight-line projection from your recent fasting readings. It is not a medical prediction.")}</p>
            </div>
            <div style={{ height: 220 }} role="img" aria-label={tr("Fasting trend and projection chart")}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <ReferenceLine y={thresholds.fastingHigh} stroke="var(--color-warning, #f59e0b)" strokeDasharray="4 4" label={{ value: tr("Fasting-high threshold"), position: "insideTopRight", fontSize: 11 }} />
                  {result.visitDate && (
                    <ReferenceLine x={result.visitDate} stroke="var(--color-muted-foreground)" strokeDasharray="3 3" label={{ value: tr("Doctor visit"), position: "top", fontSize: 11 }} />
                  )}
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "d MMM")} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" />
                  <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" />
                  <Tooltip labelFormatter={(v) => format(new Date(v as string), "EEE d MMM")} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)" }} />
                  <Area dataKey="band" stroke="none" fill="var(--color-primary)" fillOpacity={0.12} />
                  <Line type="monotone" dataKey="actual" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                  <Line type="monotone" dataKey="projected" stroke="var(--color-primary)" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <Button variant="outline" className="min-h-11" disabled={pinned} onClick={() => { pinQuestion(question); setAdded(true); toast.success(tr("Added to your Doctor Visit questions.")); }}>
              {pinned ? tr("Added to Doctor Visit questions") : tr("Add to my doctor questions")}
            </Button>
          </>
        ) : result.reason === "flat_or_falling" ? (
          <p className="text-[15px]">{tr("Your mornings look steady.")}</p>
        ) : (
          <p className="text-[15px] text-muted-foreground">{tr("Add a few more fasting readings to see your trend.")}</p>
        )}
      </CardContent>
    </Card>
  );
}
