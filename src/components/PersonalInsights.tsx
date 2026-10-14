import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { lateNightImpact, mealImpact, whatIfDinner, type MealClass, type MealClassStats } from "@/lib/insights";
import { useStore } from "@/lib/store";
import type { AppData } from "@/lib/types";

function ComparisonBars({ leftLabel, leftValue, rightLabel, rightValue }: { leftLabel: string; leftValue: number; rightLabel: string; rightValue: number }) {
  const max = Math.max(leftValue, rightValue, 1);
  return (
    <div className="space-y-3">
      {[{ label: leftLabel, value: leftValue, color: "bg-success" }, { label: rightLabel, value: rightValue, color: "bg-warning" }].map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span>{row.label}</span>
            <span className="font-semibold">{row.value.toFixed(1)} mmol/L</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${row.color}`} style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AddToQuestionsButton({ question }: { question: string }) {
  const { t: tr } = useLanguage();
  const { data, pinQuestion } = useStore();
  const pinned = (data?.pinnedQuestions ?? []).some((q) => q.text === question);
  return (
    <Button variant="outline" size="sm" className="min-h-10" disabled={pinned} onClick={() => { pinQuestion(question); toast.success(tr("Added to your Doctor Visit questions.")); }}>
      {pinned ? tr("Added to Doctor Visit questions") : tr("Add to doctor questions")}
    </Button>
  );
}

function UnlockHint({ have, need }: { have: number; need: number }) {
  const { t: tr } = useLanguage();
  return (
    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
      <p>{tr("Keep logging meals and after-meal readings to unlock this insight.")}</p>
      <div className="mt-2 flex items-center gap-2">
        <Progress value={(have / need) * 100} className="h-2 flex-1" />
        <span className="shrink-0 text-xs">{tr("{have} of {need} pairs", { have, need })}</span>
      </div>
    </div>
  );
}

function WhatIfSimulator({ data }: { data: AppData }) {
  const { t: tr } = useLanguage();
  const [group, setGroup] = useState<MealClass>("lighter");
  const result = whatIfDinner(data, group);
  const examples: Record<MealClass, string> = {
    lighter: tr("e.g. ikan bakar, sayur, tauhu"),
    heavier: tr("e.g. nasi lemak, mee goreng, roti canai"),
  };
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="font-semibold text-navy">{tr("What if tonight's dinner…")}</p>
      <div className="grid grid-cols-2 gap-2">
        {(["lighter", "heavier"] as MealClass[]).map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={group === g}
            onClick={() => setGroup(g)}
            className={`min-h-16 rounded-lg border p-3 text-left transition-colors ${group === g ? "border-primary bg-accent" : "hover:bg-muted"}`}
          >
            <p className="font-medium">{g === "lighter" ? tr("Lighter dinner") : tr("Heavier dinner")}</p>
            <p className="text-xs text-muted-foreground">{examples[g]}</p>
          </button>
        ))}
      </div>
      {result.status === "ok" ? (
        <div className="space-y-2">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`absolute h-full rounded-full ${group === "lighter" ? "bg-success" : "bg-warning"}`}
              style={{ left: `${Math.min(100, (result.min / data.thresholds.postMealHigh) * 100)}%`, width: `${Math.max(2, ((result.max - result.min) / data.thresholds.postMealHigh) * 100)}%` }}
            />
          </div>
          <p className="text-sm">
            {tr("Your past {group} dinners averaged {avg} mmol/L after meals (range {min}–{max}, from {n} readings), against the after-meal limit of {limit} mmol/L.", {
              group: group === "lighter" ? tr("lighter") : tr("heavier"),
              avg: result.avg.toFixed(1),
              min: result.min.toFixed(1),
              max: result.max.toFixed(1),
              n: result.n,
              limit: data.thresholds.postMealHigh,
            })}
          </p>
          <p className="text-xs italic text-muted-foreground">{tr("Based on your own past readings. Not a prediction.")}</p>
        </div>
      ) : (
        <UnlockHint have={result.n} need={2} />
      )}
    </div>
  );
}

export function PersonalInsights({ compact, now = new Date() }: { compact?: boolean; now?: Date }) {
  const { t: tr } = useLanguage();
  const { data } = useStore();
  if (!data) return null;
  const meal = mealImpact(data, now);
  const lateNight = lateNightImpact(data, now);

  const mealStats = (s: MealClassStats | undefined) => s?.avg ?? 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Lightbulb className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg">{tr("What your records show")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy">{tr("Meal comparison")}</p>
          {meal.valid && meal.lighter && meal.heavier ? (
            <>
              <ComparisonBars
                leftLabel={tr("Lighter dinners avg")}
                leftValue={mealStats(meal.lighter)}
                rightLabel={tr("Heavier or late dinners avg")}
                rightValue={mealStats(meal.heavier)}
              />
              <p className="text-sm">
                {meal.heavier.avg > meal.lighter.avg
                  ? tr("After-meal readings tend to run higher following heavier meals than lighter ones.")
                  : tr("After-meal readings look similar after heavier and lighter meals in your records.")}
              </p>
              <p className="text-xs text-muted-foreground">
                {tr("Based on {n} meals and readings. These records show what happened around the same time, not what caused it.", { n: meal.heavier.count + meal.lighter.count })}
              </p>
              {!compact && <AddToQuestionsButton question={tr("My after-meal readings seem higher following heavier meals — could we talk about meal choices and timing?")} />}
            </>
          ) : (
            <UnlockHint have={Math.min(meal.lighter?.count ?? 0, meal.heavier?.count ?? 0)} need={2} />
          )}
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-semibold text-navy">{tr("Late-night comparison")}</p>
          {lateNight.valid && lateNight.lateNight && lateNight.others ? (
            <>
              <ComparisonBars
                leftLabel={tr("Mornings after an early night avg")}
                leftValue={lateNight.others.avg}
                rightLabel={tr("Mornings after sleeping late avg")}
                rightValue={lateNight.lateNight.avg}
              />
              <p className="text-sm">
                {lateNight.lateNight.avg > lateNight.others.avg
                  ? tr("Fasting readings tend to run higher on mornings after sleeping late, in your records.")
                  : tr("Fasting readings look similar regardless of late nights in your records.")}
              </p>
              <p className="text-xs text-muted-foreground">
                {tr("Based on {n} mornings. These records show what happened around the same time, not what caused it.", { n: lateNight.lateNightCount + lateNight.otherCount })}
              </p>
              {!compact && <AddToQuestionsButton question={tr("My fasting readings seem higher after late nights — is this worth discussing?")} />}
            </>
          ) : (
            <UnlockHint have={lateNight.lateNightCount} need={2} />
          )}
        </div>

        {!compact && (
          <div className="border-t pt-4">
            <WhatIfSimulator data={data} />
          </div>
        )}
        {compact && (
          <Link to="/health" search={{ tab: "patterns" }} className="inline-flex items-center text-sm font-medium text-primary">
            {tr("See more in Patterns")}<ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
