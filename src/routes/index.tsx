import { createFileRoute, Link } from "@tanstack/react-router";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { useState } from "react";
import { ArrowRight, CalendarClock, Lightbulb, MessageCircleQuestion, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { GlucoseChart } from "@/components/GlucoseChart";
import { GlucoseForm } from "@/components/GlucoseForm";
import { FindingCard, PageLoading, SampleBadge, StatusPill, readingStatus } from "@/components/common";
import { useStore } from "@/lib/store";
import { detectPatterns } from "@/lib/patterns";
import { CONTEXT_LABELS } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · DiaMonitor Copilot" },
      { name: "description", content: "Your diabetes summary: latest glucose, 7-day trend and one clear insight." },
      { property: "og:title", content: "Overview · DiaMonitor Copilot" },
      { property: "og:description", content: "Your diabetes summary: latest glucose, 7-day trend and one clear insight." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { data } = useStore();
  const [open, setOpen] = useState(false);
  if (!data) return <PageLoading />;
  const now = new Date();
  const t = data.thresholds;
  const sorted = [...data.readings].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const latest = sorted[0];
  const week = data.readings.filter((r) => new Date(r.timestamp) >= subDays(now, 7));
  const days = new Set(week.map((r) => format(new Date(r.timestamp), "yyyy-MM-dd"))).size;
  const findings = detectPatterns(data.readings, t, now);
  const top = findings.find((f) => f.severity !== "info") ?? findings[0];
  const hour = now.getHours();
  const greet = hour < 12 ? "Selamat pagi" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy md:text-[28px]">
            {greet}, {data.patient.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">Here's what matters from your recent records.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-5 text-base"><Plus className="mr-1 h-5 w-5" />Record glucose</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record a glucose reading</DialogTitle></DialogHeader>
              <GlucoseForm onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button asChild variant="outline" className="h-12 px-5 text-base">
            <Link to="/copilot"><MessageCircleQuestion className="mr-1 h-5 w-5" />Ask Copilot</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Latest reading</CardTitle></CardHeader>
          <CardContent>
            {latest ? (
              <>
                <p className="text-4xl font-semibold text-navy">{latest.value.toFixed(1)} <span className="text-base font-normal text-muted-foreground">mmol/L</span></p>
                <p className="mt-1 text-sm text-muted-foreground">{CONTEXT_LABELS[latest.context]} · {formatDistanceToNow(new Date(latest.timestamp), { addSuffix: true })}</p>
                <div className="mt-2"><StatusPill status={readingStatus(latest, t)} /></div>
              </>
            ) : <p className="text-muted-foreground">No readings yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Logging this week</CardTitle></CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-navy">{days}<span className="text-base font-normal text-muted-foreground"> / 7 days</span></p>
            <Progress value={(days / 7) * 100} className="mt-3 h-2" />
            <p className="mt-2 text-sm text-muted-foreground">{week.length} readings recorded in the last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><CalendarClock className="h-4 w-4" />Next consultation</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-navy">{format(new Date(data.patient.nextVisit), "EEE, d MMM · h:mm a")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{data.patient.doctor}</p>
            <Link to="/doctor" className="mt-3 inline-flex items-center text-sm font-medium text-primary">Prepare report <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">7-day glucose trend</CardTitle>
            <SampleBadge>Includes sample data</SampleBadge>
          </CardHeader>
          <CardContent><GlucoseChart readings={week} t={t} /></CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Lightbulb className="h-5 w-5 text-primary" />Key insight</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {top ? <FindingCard f={top} t={t} compact /> : <p className="text-muted-foreground">No patterns detected.</p>}
            <div className="rounded-xl bg-secondary p-4">
              <p className="text-sm font-semibold text-navy">Recommended next step</p>
              <p className="mt-1 text-[15px]">
                {top?.kind === "safety"
                  ? "Contact your clinic about this reading. If you feel unwell, seek urgent care (999)."
                  : top?.severity === "watch"
                    ? "Keep recording your morning readings, and add this to your questions for your next visit."
                    : "Keep logging at your agreed times so patterns can be checked."}
              </p>
            </div>
            <Link to="/health" search={{ tab: "patterns" }} className="inline-flex items-center text-sm font-medium text-primary">
              See supporting records <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        Insights come from simple, transparent rules applied to your records using demo thresholds. They show what changed — not why — and are not a diagnosis.
      </p>
    </div>
  );
}
