import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { Check, Circle, Stethoscope, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, PageLoading, SampleBadge } from "@/components/common";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/care-plan")({
  head: () => ({
    meta: [
      { title: "My Care Plan · DiaMonitor Copilot" },
      { name: "description", content: "Your doctor-agreed goal, daily check-ins and follow-up date." },
      { property: "og:title", content: "My Care Plan · DiaMonitor Copilot" },
      { property: "og:description", content: "Your doctor-agreed goal, daily check-ins and follow-up date." },
    ],
  }),
  component: CarePlanPage,
});

function CarePlanPage() {
  const { data, setCheckIn } = useStore();
  const today = format(new Date(), "yyyy-MM-dd");
  const todayCheck = data?.checkIns.find((c) => c.date === today);
  const [reflection, setReflection] = useState("");
  useEffect(() => setReflection(todayCheck?.reflection ?? ""), [todayCheck?.reflection]);
  if (!data) return <PageLoading />;
  const plan = data.carePlan;
  const start = parseISO(plan.startDate);
  const days = Array.from({ length: plan.durationDays }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
  const done = data.checkIns.filter((c) => c.completed && days.includes(c.date)).length;
  const todayReadings = data.readings.filter((r) => format(new Date(r.timestamp), "yyyy-MM-dd") === today);
  const hasFasting = todayReadings.some((r) => r.context === "fasting");
  const hasDinner = todayReadings.some((r) => r.context === "after_meal");

  return (
    <div className="space-y-4">
      <PageHeader title="My Care Plan" subtitle="A simple goal to follow between visits." />
      <p className="rounded-lg bg-secondary px-4 py-3 text-sm">This is an example goal for demonstration. Real care goals should be agreed with your healthcare professional.</p>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg"><Target className="h-5 w-5 text-primary" />Goal from {data.patient.doctor.replace(" (fictional)", "")}</CardTitle>
            <SampleBadge />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-medium text-navy">{plan.goal}</p>
            <p className="text-muted-foreground">{plan.explanation}</p>
            <div>
              <div className="mb-1 flex justify-between text-sm"><span>Progress</span><span className="font-medium">{done} of {plan.durationDays} days</span></div>
              <Progress value={(done / plan.durationDays) * 100} className="h-3" />
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
            <p className="text-sm text-muted-foreground">Follow-up: <span className="font-medium text-foreground">{format(new Date(plan.followUpDate), "EEEE, d MMM yyyy · h:mm a")}</span></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Today's check-in</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-[15px]">
              <li className="flex items-center gap-2">{hasFasting ? <Check className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}Fasting reading recorded</li>
              <li className="flex items-center gap-2">{hasDinner ? <Check className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}After-dinner reading recorded</li>
            </ul>
            <div>
              <Label htmlFor="reflection">How did today go? (optional)</Label>
              <Textarea id="reflection" value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="e.g. Took my reading late because of work" className="mt-1.5" rows={3} />
            </div>
            {todayCheck?.completed ? (
              <div className="space-y-2">
                <p className="flex items-center gap-2 rounded-lg bg-success-soft p-3 text-sm font-medium text-success"><Check className="h-4 w-4" />Today's check-in is complete</p>
                <Button variant="ghost" className="w-full" onClick={() => setCheckIn(today, false, reflection)}>Undo</Button>
              </div>
            ) : (
              <Button className="h-12 w-full text-base" onClick={() => { setCheckIn(today, true, reflection.trim() || undefined); toast.success("Check-in complete. Well done!"); }}>
                Mark today complete
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Stethoscope className="h-5 w-5 text-primary" />Doctor feedback</CardTitle></CardHeader>
        <CardContent><p className="text-[15px]">{plan.doctorFeedback}</p></CardContent>
      </Card>
    </div>
  );
}
