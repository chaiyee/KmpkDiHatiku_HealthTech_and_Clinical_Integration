import { useLanguage } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { Check, Circle, Stethoscope, Target, CalendarDays, ArrowRight } from "lucide-react";
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
import { DailyCareGuide } from "@/components/DailyCareGuide";
import { useClock } from "@/hooks/use-clock";
import { CaregiverSupport } from "@/components/CaregiverSupport";

export const Route = createFileRoute("/care-plan")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Care Plan · DiaMonitor Copilot" },
      { name: "description", content: "Your doctor-agreed goal, daily check-ins and follow-up date." },
      { property: "og:title", content: "My Care Plan · DiaMonitor Copilot" },
      { property: "og:description", content: "Your doctor-agreed goal, daily check-ins and follow-up date." },
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
  const days = Array.from({ length: plan.durationDays }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
  const done = data.checkIns.filter((c) => c.completed && days.includes(c.date)).length;
  const todayReadings = data.readings.filter((r) => format(new Date(r.timestamp), "yyyy-MM-dd") === today);
  const fasting = todayReadings.filter((r) => r.context === "fasting").sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  const hasFasting = !!fasting;
  const hour = now.getHours();
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const medsTakenToday = (data.medicationStatuses ?? []).filter((l) => l.status === "taken" && l.date === today).length;
  const hasDinner = todayReadings.some((r) => r.context === "after_meal");

  return (
    <div className="space-y-4">
      <PageHeader title={tr("My Care Plan")} subtitle={tr("A simple goal to follow between visits.")} />
      <p className="rounded-lg bg-secondary px-4 py-3 text-sm">{tr("This is an example goal for demonstration. Real care goals should be agreed with your healthcare professional.")}</p>

      <section className="space-y-4" aria-labelledby="today-plan">
        <h2 id="today-plan" className="flex items-center gap-2 text-xl font-semibold text-navy"><CalendarDays className="h-5 w-5 text-primary" />{tr("Today's Plan")} <span className="ml-auto text-sm font-normal text-muted-foreground">{format(now, "EEE, d MMM")}</span></h2>
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2"><DailyCareGuide todayOnly title="Today's suggestions" /></div>
        <Card>
          <CardHeader><CardTitle className="text-lg">{tr("Today's check-in")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tr("Recorded in the app")}</p>
            <ul className="space-y-2 text-[15px]">
              <li className={`rounded-lg p-2 ${period === "morning" ? "bg-accent ring-1 ring-primary/30" : ""}`}>
                <span className="flex items-center gap-2 [&_svg]:shrink-0">{hasFasting ? <Check className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}{tr("Morning")}: {tr("Fasting reading recorded")}</span>
                {fasting ? <span className="ml-7 block text-sm text-muted-foreground">{fasting.value.toFixed(1)} mmol/L · {format(new Date(fasting.timestamp), "HH:mm")}</span>
                  : <Link to="/health" search={{ tab: "glucose" }} className="ml-7 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline">{tr("Log fasting reading")} <ArrowRight className="h-4 w-4" /></Link>}
              </li>
              <li className={`rounded-lg p-2 ${period === "afternoon" ? "bg-accent ring-1 ring-primary/30" : ""}`}><span className="flex items-center gap-2 [&_svg]:shrink-0">{medsTakenToday ? <Check className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}{tr("Medication doses marked taken today")}: {medsTakenToday}</span></li>
              <li className={`rounded-lg p-2 ${period === "evening" ? "bg-accent ring-1 ring-primary/30" : ""}`}><span className="flex items-center gap-2 [&_svg]:shrink-0">{hasDinner ? <Check className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}{tr("Evening")}: {tr("After-meal reading recorded")}</span></li>
            </ul>
            <p className="border-t pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tr("Self-reported")}</p>
            <div>
              <Label htmlFor="reflection">{tr("How did today go? (optional)")}</Label>
              <Textarea id="reflection" value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder={tr("e.g. Took my reading late because of work")} className="mt-1.5" rows={3} />
            </div>
            {todayCheck?.completed ? (
              <div className="space-y-2">
                <p className="flex items-center gap-2 rounded-lg bg-success-soft p-3 text-sm font-medium text-success"><Check className="h-4 w-4" />{tr("Today's check-in is complete")}</p>
                <Button variant="ghost" className="w-full" onClick={() => { setCheckIn(today, false, reflection); toast.success(tr("Check-in updated.")); }}>{tr("Undo")}</Button>
              </div>
            ) : (
              <Button className="h-12 w-full text-base" onClick={() => { setCheckIn(today, true, reflection.trim() || undefined); toast.success(tr("Check-in complete. Well done!")); }}>
                {tr("Mark today complete")}</Button>
            )}
          </CardContent>
        </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">{tr("Malaysian Food Swap Guide")}</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-[15px]">
                {[["Nasi Lemak", "Smaller rice portion, more cucumber"], ["Teh Tarik", "Teh C Kosong or Kopi O Kosong"], ["Char Kway Teow", "Smaller portion or vegetable-rich soup noodles"], ["Roti Canai", "Consider tosai with dhal"]].map(([a, b]) => (
                  <li key={a} className="flex flex-wrap gap-x-2"><span className="font-medium text-navy">{a}</span><ArrowRight className="h-4 w-4 self-center text-primary" /><span>{tr(b ?? "")}</span></li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">{tr("General ideas only, not a diet restriction. Ask your doctor or dietitian what suits you.")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Target className="h-5 w-5 text-primary" />{tr("Your doctor's goal")}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium text-navy">{tr(plan.goal)}</p>
              <Progress value={(done / plan.durationDays) * 100} />
              <p className="text-sm text-muted-foreground">{done} {tr("of")} {plan.durationDays} {tr("days")} · {tr("Doctor-assigned, read-only")}</p>
            </CardContent>
          </Card>
        </div>
        <div id="medication-reminders" className="scroll-mt-36"><MedicationReminders /></div>
      </section>
      <section className="space-y-4 border-t pt-6" aria-labelledby="weekly-progress">
        <h2 id="weekly-progress" className="flex items-center gap-2 text-xl font-semibold text-navy"><CalendarDays className="h-5 w-5 text-primary" />{tr("My Weekly Progress")}</h2>
        <DailyCareGuide />
      </section>
      <section className="space-y-4 border-t pt-6" aria-labelledby="doctor-goals">
        <h2 id="doctor-goals" className="flex items-center gap-2 text-xl font-semibold text-navy"><Target className="h-5 w-5 text-primary" />{tr("Doctor's Goals")}</h2>
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg"><Target className="h-5 w-5 text-primary" />{tr("Goal from")}{" "}{data.patient.doctor.replace(" (fictional)", "")}</CardTitle>
            <SampleBadge>{data.doctorResponseAt ? "Demo doctor response · not verified" : "Sample data"}</SampleBadge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-medium text-navy">{tr(plan.goal)}</p>
            <p className="text-muted-foreground">{tr(plan.explanation)}</p>
            <div>
              <div className="mb-1 flex justify-between text-sm"><span>{tr("Progress")}</span><span className="font-medium">{done} {tr("of")}{" "}{plan.durationDays} {tr("days")}</span></div>
              <Progress value={plan.durationDays ? (done / plan.durationDays) * 100 : 0} className="h-3" />
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d) => {
                const c = data.checkIns.find((x) => x.date === d);
                const future = d > today;
                return (
                  <div key={d} title={d} className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-xs ${c?.completed ? "border-success/40 bg-success-soft text-success" : future ? "text-muted-foreground/60" : d === today ? "border-primary" : "bg-muted text-muted-foreground"}`}>
                    <span>{format(parseISO(d), "d")}</span>
                    {c?.completed ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2" />}
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">{tr("Follow-up:")}{" "}<span className="font-medium text-foreground">{format(new Date(plan.followUpDate), "EEEE, d MMM yyyy · h:mm a")}</span></p>
          </CardContent>
        </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Stethoscope className="h-5 w-5 text-primary" />{tr("Doctor feedback")}</CardTitle></CardHeader>
        <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{tr(data.doctorResponseAt ? "Demo doctor response · not verified" : "Simulated demo feedback")}{data.doctorResponseAt && ` · ${format(new Date(data.doctorResponseAt), "d MMM yyyy, HH:mm")}`}</p><p className="whitespace-pre-wrap">{tr(plan.doctorFeedback) || tr("No doctor feedback recorded yet.")}</p>{data.doctorNotes && <p className="whitespace-pre-wrap border-t pt-3">{data.doctorNotes}</p>}<h3 className="font-semibold">{tr("Follow-up instructions")}</h3><p className="whitespace-pre-wrap">{data.followUpInstructions || tr("No follow-up instructions recorded yet.")}</p><Button asChild variant="outline" className="min-h-12"><Link to="/doctor">{tr("Doctor Visit")}<ArrowRight /></Link></Button></CardContent>
      </Card>
      </section>
      <CaregiverSupport />
    </div>
  );
}
