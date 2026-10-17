import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fastingForecast } from "@/lib/forecast";
import { useStore } from "@/lib/store";
import type { GlucoseReading, Thresholds } from "@/lib/types";

export function FastingForecastCard({
  readings,
  thresholds,
  now,
  nextVisit,
}: {
  readings: GlucoseReading[];
  thresholds: Thresholds;
  now: Date;
  nextVisit: Date;
}) {
  const { t: tr } = useLanguage();
  const { data, pinQuestion } = useStore();
  const [added, setAdded] = useState(false);
  const result = fastingForecast(readings, thresholds, now, nextVisit);
  const enough = result.actual.length >= 5;
  const rising = enough && result.available;
  const highDays = result.actual.filter((p) => p.value > thresholds.fastingHigh).length;
  const question = tr("Can we review my recent fasting readings and my agreed care plan?");
  const pinned = added || (data?.pinnedQuestions ?? []).some((q) => q.text === question);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          {tr("Fasting trend band")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`rounded-xl border p-4 ${!enough ? "bg-muted" : rising || highDays > 0 ? "border-warning/40 bg-warning-soft" : "bg-secondary"}`}
        >
          <p className="text-xl font-semibold text-navy">
            {tr(
              !enough
                ? "Not enough data"
                : rising
                  ? "Rising morning trend"
                  : highDays > 0
                    ? "High morning readings recorded"
                    : "No rising morning trend detected",
            )}
          </p>
          <p className="mt-2 text-sm">
            {tr("Based on the latest fasting reading on each recorded day in the last 10 days.")}
          </p>
        </div>
        <p className="text-sm font-medium">
          {tr(
            "Informational estimate only. Do not adjust insulin or oral medications without your doctor's protocol.",
          )}
        </p>
        {enough ? (
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              {tr("{count} days with fasting readings available.", { count: result.actual.length })}
            </li>
            <li>
              {tr("{count} days above the fasting reference of {value} mmol/L.", {
                count: highDays,
                value: thresholds.fastingHigh,
              })}
            </li>
            <li>{tr("Recorded trend, not a forecast.")}</li>
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {tr("Add a few more fasting readings to see your trend.")}
          </p>
        )}
        {enough && (rising || highDays > 0) && (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={pinned}
            onClick={() => {
              pinQuestion(question);
              setAdded(true);
              toast.success(tr("Added to your Doctor Visit questions."));
            }}
          >
            {tr(pinned ? "Added to Doctor Visit questions" : "Add to my doctor questions")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
