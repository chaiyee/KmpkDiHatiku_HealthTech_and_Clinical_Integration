import { useLanguage } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { Check, Circle, Target, CalendarDays, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, PageLoading, SampleBadge } from "@/components/common";
import { useStore } from "@/lib/store";
import { MedicationReminders } from "@/components/MedicationReminders";
import { localDay } from "@/lib/medications";
import { DailyCareGuide, dailyGuide } from "@/components/DailyCareGuide";
import { useClock } from "@/hooks/use-clock";
import { CaregiverSupport } from "@/components/CaregiverSupport";

export const Route = createFileRoute("/care-plan")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Care Plan · DiaMonitor Copilot" },
      {
        name: "description",
        content: "Your doctor-agreed goal, daily check-ins and follow-up date.",
      },
      { property: "og:title", content: "My Care Plan · DiaMonitor Copilot" },
      {
        property: "og:description",
        content: "Your doctor-agreed goal, daily check-ins and follow-up date.",
      },
    ],
  }),
  component: CarePlanPage,
});

function CarePlanPage() {
  const { t: tr, format } = useLanguage();
  const { data, setCheckIn } = useStore();
  const now = useClock();
  const today = localDay(now);
  const todayCheck = data?.checkIns.find((c) => c.date === today);
  const [reflection, setReflection] = useState("");
  useEffect(() => setReflection(todayCheck?.reflection ?? ""), [todayCheck?.reflection]);
  if (!data) return <PageLoading />;
  const plan = data.carePlan;
  const start = parseISO(plan.startDate);
  const days = Array.from({ length: plan.durationDays }, (_, i) =>
    format(addDays(start, i), "yyyy-MM-dd"),
  );
  const done = data.checkIns.filter((c) => c.completed && days.includes(c.date)).length;
  const todayReadings = data.readings.filter(
    (r) => format(new Date(r.timestamp), "yyyy-MM-dd") === today,
  );
  const fasting = todayReadings
    .filter((r) => r.context === "fasting")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  const hasFasting = !!fasting;
  const hour = now.getHours();
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const medsTakenToday = (data.medicationStatuses ?? []).filter(
    (l) => l.status === "taken" && l.date === today,
  ).length;
  const hasDinner = todayReadings.some((r) => r.context === "after_meal");

  return (
    <div className="care-page space-y-6">
      <PageHeader
        title={tr("My Care Plan")}
        subtitle={tr("A simple goal to follow between visits.")}
      />

      <section className="space-y-4" aria-labelledby="today-plan">
        <h2 id="today-plan" className="flex items-center gap-2 text-xl font-semibold text-navy">
          <CalendarDays className="h-5 w-5 text-primary" />
          {tr("Today's Plan")}{" "}
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {format(now, "EEE, d MMM")}
          </span>
        </h2>
        <div className="grid items-start gap-5 xl:grid-cols-2">
          <div id="medication-reminders" className="scroll-mt-36">
            <MedicationReminders />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{tr("Today's check-in")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {tr("Recorded in the app")}
              </p>
              <ul className="space-y-2 text-[15px]">
                <li
                  className={`rounded-lg p-2 ${period === "morning" ? "bg-accent ring-1 ring-primary/30" : ""}`}
                >
                  <span className="flex items-center gap-2 [&_svg]:shrink-0">
                    {hasFasting ? (
                      <Check className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    {tr("Morning")}:{" "}
                    {tr(
                      hasFasting ? "Fasting reading recorded" : "No fasting reading recorded yet",
                    )}
                  </span>
                  {fasting ? (
                    <span className="ml-7 block text-sm text-muted-foreground">
                      {fasting.value.toFixed(1)} mmol/L ·{" "}
                      {format(new Date(fasting.timestamp), "HH:mm")}
                    </span>
                  ) : (
                    <Link
                      to="/health"
                      search={{ tab: "glucose" }}
                      className="ml-7 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline"
                    >
                      {tr("Log fasting reading")} <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </li>

                <li
                  className={`rounded-lg p-2 ${period === "evening" ? "bg-accent ring-1 ring-primary/30" : ""}`}
                >
                  <span className="flex items-center gap-2 [&_svg]:shrink-0">
                    {hasDinner ? (
                      <Check className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    {tr("Evening")}:{" "}
                    {tr(
                      hasDinner
                        ? "After-meal reading recorded"
                        : "No after-meal reading recorded yet",
                    )}
                  </span>
                </li>
              </ul>
              <p className="border-t pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {tr("Self-reported")}
              </p>
              <div>
                <Label htmlFor="reflection">{tr("How did today go? (optional)")}</Label>
                <Textarea
                  id="reflection"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder={tr("e.g. Took my reading late because of work")}
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              {todayCheck?.completed ? (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 rounded-lg bg-success-soft p-3 text-sm font-medium text-success">
                    <Check className="h-4 w-4" />
                    {tr("Today's check-in is complete")}
                  </p>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setCheckIn(today, false, reflection);
                      toast.success(tr("Check-in updated."));
                    }}
                  >
                    {tr("Undo")}
                  </Button>
                </div>
              ) : (
                <Button
                  className="h-12 w-full text-base"
                  onClick={() => {
                    setCheckIn(today, true, reflection.trim() || undefined);
                    toast.success(tr("Check-in complete. Well done!"));
                  }}
                >
                  {tr("Mark today complete")}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      <div className="rounded-xl border bg-secondary p-5">
        <p className="eyebrow mb-2">{tr("One idea for today")}</p>
        <p>{tr(dailyGuide(now)[4] ?? "")}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {tr(
            "An educational suggestion. Follow your care team’s advice and dietary restrictions.",
          )}
        </p>
      </div>
      <details className="disclosure" aria-labelledby="doctor-goals">
        <summary id="doctor-goals" className="font-semibold text-navy">
          {tr("Doctor goals & feedback")}
        </summary>
        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                {tr("Goal from")} {data.patient.doctor.replace(" (fictional)", "")}
              </CardTitle>
              <SampleBadge>
                {data.doctorResponseAt ? "Demo doctor response · not verified" : "Sample data"}
              </SampleBadge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg font-medium text-navy">{tr(plan.goal)}</p>
              <p className="rounded-lg bg-secondary px-4 py-3 text-sm">
                {tr(
                  "This is an example goal for demonstration. Real care goals should be agreed with your healthcare professional.",
                )}
              </p>
              <details className="rounded-lg border p-3">
                <summary className="min-h-11 cursor-pointer py-2 font-medium text-primary">
                  {tr("Learn more")}
                </summary>
                <p className="pt-2 text-sm text-muted-foreground">{tr(plan.explanation)}</p>
              </details>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{tr("Progress")}</span>
                  <span className="font-medium">
                    {done} {tr("of")} {plan.durationDays} {tr("days")}
                  </span>
                </div>
                <Progress
                  value={plan.durationDays ? (done / plan.durationDays) * 100 : 0}
                  className="h-3"
                />
              </div>
              <details className="rounded-lg border p-3">
                <summary className="min-h-11 cursor-pointer py-2 font-medium text-primary">
                  {tr("My Weekly Progress")}
                </summary>
                <div className="grid grid-cols-7 gap-1.5 pt-3">
                  {days.map((d) => {
                    const c = data.checkIns.find((x) => x.date === d);
                    const future = d > today;
                    return (
                      <div
                        key={d}
                        title={d}
                        className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-xs ${c?.completed ? "border-success/40 bg-success-soft text-success" : future ? "text-muted-foreground/60" : d === today ? "border-primary" : "bg-muted text-muted-foreground"}`}
                      >
                        <span>{format(parseISO(d), "d")}</span>
                        {c?.completed ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Circle className="h-2 w-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
              <p className="text-sm text-muted-foreground">
                {tr("Follow-up:")}{" "}
                <span className="font-medium text-foreground">
                  {format(new Date(plan.followUpDate), "EEEE, d MMM yyyy · h:mm a")}
                </span>
              </p>
            </CardContent>
          </Card>

          <details className="disclosure">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold text-navy">
              {tr("Doctor feedback")}
            </summary>
            <Card className="mt-3 border-0 shadow-none">
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {tr(
                    data.doctorResponseAt
                      ? "Demo doctor response · not verified"
                      : "Simulated demo feedback",
                  )}
                  {data.doctorResponseAt &&
                    ` · ${format(new Date(data.doctorResponseAt), "d MMM yyyy, HH:mm")}`}
                </p>
                <p className="whitespace-pre-wrap">
                  {tr(plan.doctorFeedback) || tr("No doctor feedback recorded yet.")}
                </p>
                {data.doctorNotes && (
                  <p className="whitespace-pre-wrap border-t pt-3">{data.doctorNotes}</p>
                )}
                <h3 className="font-semibold">{tr("Follow-up instructions")}</h3>
                <p className="whitespace-pre-wrap">
                  {data.followUpInstructions || tr("No follow-up instructions recorded yet.")}
                </p>
                <Button asChild variant="outline" className="min-h-12">
                  <Link to="/doctor">
                    {tr("Doctor Visit")}
                    <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </details>
        </div>
      </details>
      <details className="rounded-xl border bg-card p-4">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-navy">
          {tr("Daily Care Guide")}
        </summary>
        <div className="pt-3">
          <DailyCareGuide />
        </div>
      </details>
      <details className="rounded-xl border bg-card p-4">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-navy">
          {tr("Caregiver support · simulated")}
        </summary>
        <div className="pt-3">
          <CaregiverSupport />
        </div>
      </details>
    </div>
  );
}
