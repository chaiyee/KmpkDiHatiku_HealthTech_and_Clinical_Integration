import { addDays, startOfWeek } from "date-fns";
import { useStore } from "@/lib/store";
import { Progress } from "./ui/progress";
import { Check, Circle } from "lucide-react";
import { localDay } from "@/lib/medications";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useLanguage } from "@/lib/i18n";
import { useClock } from "@/hooks/use-clock";
import { Button } from "./ui/button";
import { WEEKDAYS } from "@/lib/medications";

export const DAILY_GUIDES = [
  ["Wholemeal toast, boiled egg, and unsweetened tea.", "Brown rice, grilled fish, and vegetables.", "Vegetable soup, tofu, and a carbohydrate portion suited to your usual care advice.", "Gentle walking, if appropriate for you.", "Choose unsweetened drinks instead of sweetened teh tarik."],
  ["Plain oats, a boiled egg, and unsweetened kopi O.", "Chapati with dhal and vegetables.", "Chicken soup, vegetables, and a rice portion suited to your usual care advice.", "Light stretching, if comfortable and appropriate for you.", "Keep a regular sleep routine where possible."],
  ["Wholemeal bread with egg and cucumber, and unsweetened tea.", "Ikan bakar, vegetables, and a rice portion suited to your usual care advice.", "Clear vegetable soup with tofu and wholemeal toast.", "A relaxed walk around the taman, if appropriate for you.", "Note how you feel and discuss concerns with your healthcare team."],
  ["Plain oats, a boiled egg, and unsweetened kopi O.", "Brown rice, grilled fish, and vegetables.", "Clear vegetable soup with tofu and wholemeal toast.", "Light stretching, if comfortable and appropriate for you.", "Choose unsweetened drinks instead of sweetened teh tarik."],
  ["Wholemeal toast, boiled egg, and unsweetened tea.", "Chapati with dhal and vegetables.", "Chicken soup, vegetables, and a rice portion suited to your usual care advice.", "A relaxed walk around the taman, if appropriate for you.", "Keep a regular sleep routine where possible."],
  ["Wholemeal bread with egg and cucumber, and unsweetened tea.", "Brown rice, grilled fish, and vegetables.", "Vegetable soup, tofu, and a carbohydrate portion suited to your usual care advice.", "Gentle walking, if appropriate for you.", "Note how you feel and discuss concerns with your healthcare team."],
  ["Plain oats, a boiled egg, and unsweetened kopi O.", "Ikan bakar, vegetables, and a rice portion suited to your usual care advice.", "Chicken soup, vegetables, and a rice portion suited to your usual care advice.", "Light stretching, if comfortable and appropriate for you.", "Keep a regular sleep routine where possible."],
];
export function dailyGuide(now: Date) {
  const index = (now.getDay() + 6) % 7;
  return DAILY_GUIDES[index] ?? DAILY_GUIDES[0] ?? [];
}
export function DailyCareGuide({ todayOnly = false, title = "Daily Care Guide" }: { todayOnly?: boolean; title?: string }) {
  const { t } = useLanguage();
  const now = useClock();
  const { data } = useStore();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const day = todayOnly ? (now.getDay() + 6) % 7 : selectedDay ?? (now.getDay() + 6) % 7;
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const selectedDate = localDay(addDays(weekStart, day));
  const dates = Array.from({ length: 7 }, (_, index) => localDay(addDays(weekStart, index)));
  const completed = data?.checkIns.filter((entry) => entry.completed && dates.includes(entry.date)).length ?? 0;
  const check = data?.checkIns.some((entry) => entry.date === selectedDate && entry.completed);
  const meals = data?.logs.filter((entry) => entry.category === "meal" && localDay(new Date(entry.timestamp)) === selectedDate).length ?? 0;
  const activities = data?.logs.filter((entry) => entry.category === "activity" && localDay(new Date(entry.timestamp)) === selectedDate).length ?? 0;
  const labels = ["Breakfast", "Lunch", "Dinner", "Physical activity", "Healthy-lifestyle tip"];
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="h-5 w-5 text-primary" />{t(title)}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("General educational suggestions, not medical treatment instructions or a personalised diet or exercise prescription. Follow your healthcare team's advice and your dietary restrictions.")}</p>
        {!todayOnly && <div className="space-y-2"><p className="flex justify-between text-sm"><span>{t("Completed check-ins this week")}</span><span>{completed} / 7</span></p><Progress value={completed / 7 * 100} className="h-3" /></div>}
        {!todayOnly && <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label={t("Daily Care Guide")}>
          {DAILY_GUIDES.map((_, index) => <Button key={index} className="min-h-12" variant={day === index ? "default" : "outline"} aria-pressed={day === index} onClick={() => setSelectedDay(index)}>{t(WEEKDAYS[(index + 1) % 7] ?? "")}</Button>)}
        </div>}
        <h3 className="font-semibold text-navy">{t(WEEKDAYS[(day + 1) % 7] ?? "")}</h3>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{check ? <Check className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4" />}{t(check ? "Check-in complete" : "Check-in not completed")} · {t("Meal records")}: {meals} · {t("Activity records")}: {activities}</p>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{(DAILY_GUIDES[day] ?? dailyGuide(now)).map((text, index) => <div key={text}><dt className="text-sm font-semibold text-navy">{t(labels[index] ?? "")}</dt><dd className="mt-1 text-[15px]">{t(text)}</dd></div>)}</dl>
      </CardContent>
    </Card>
  );
}