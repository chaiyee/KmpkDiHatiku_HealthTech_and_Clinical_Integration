import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, Bluetooth, ChevronDown, HeartPulse, Phone, ShieldCheck, Watch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FindingCard, SampleBadge } from "@/components/common";
import { useLanguage } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { detectPatterns } from "@/lib/patterns";
import type { GlucoseContext } from "@/lib/types";

// Demo-only simulation: no Bluetooth, no hardware, no network. Device state is volatile on purpose.
type Device = { connected: boolean; lastSync: Date | null };
type Step = 0 | 1 | 2 | 3 | 4;
type Feeling = "okay" | "unwell" | "help";

/** Fixed, reproducible Guardian scenario: three high fasting mornings ending today. */
export function guardianReadings(now: Date) {
  return [10.1, 9.6, 9.2].map((value, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(7, 0, 0, 0);
    if (d > now) d.setDate(d.getDate() - 3);
    return { timestamp: d.toISOString(), value, context: "fasting" as GlucoseContext, note: "Simulated CGM (demo)" };
  });
}

export function ConnectedHealth() {
  const { t: tr, format } = useLanguage();
  const { data, addDeviceReadings, guardianCheckIn } = useStore();
  const [alerted, setAlerted] = useState(false);
  const [cgm, setCgm] = useState<Device>({ connected: true, lastSync: null });
  const [watch, setWatch] = useState<Device>({ connected: true, lastSync: null });
  const [vitals, setVitals] = useState({ hr: 74, steps: 3120, sleep: 6.8 });
  const [step, setStep] = useState<Step>(0);
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [urgent, setUrgent] = useState(false);
  if (!data) return null;

  const t = data.thresholds;
  const sync = (value?: number, context: GlucoseContext = "random") => {
    const now = new Date();
    if (cgm.connected) {
      const v = value ?? Math.round((5.6 + Math.random() * 3) * 10) / 10;
      addDeviceReadings([{ timestamp: now.toISOString(), value: v, context, note: "Simulated CGM (demo)" }]);
      setCgm({ connected: true, lastSync: now });
      if (v < t.hypo || v > t.severeHigh) setUrgent(true);
    }
    if (watch.connected) {
      setVitals((p) => ({ hr: 68 + Math.floor(Math.random() * 14), steps: p.steps + 150 + Math.floor(Math.random() * 400), sleep: p.sleep }));
      setWatch({ connected: true, lastSync: now });
    }
  };

  const runGuardian = () => {
    const now = new Date();
    setFeeling(null);
    setUrgent(false);
    setCgm({ connected: true, lastSync: now });
    addDeviceReadings(guardianReadings(now));
    setStep(1);
  };

  const answer = (f: Feeling) => {
    setFeeling(f);
    setStep(4);
    if (f === "help") setUrgent(true);
    setAlerted(guardianCheckIn(f).alerted);
  };

  const findings = detectPatterns(data.readings, t).filter((f) => f.kind === "repeated_high" || f.kind === "baseline_shift");
  const cg = data.caregiver;
  const shares = !!cg?.enabled && !!cg.shareRepeated;
  const deviceCount = data.readings.filter((r) => r.source === "device").length;
  const last = [cgm.lastSync, watch.lastSync].filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0];
  const anyOn = cgm.connected || watch.connected;

  const devices = [
    { key: "cgm", icon: Bluetooth, name: tr("Demo CGM"), what: tr("Glucose measurements"), d: cgm, set: setCgm },
    { key: "watch", icon: Watch, name: tr("Demo Smartwatch"), what: tr("Heart rate, steps, activity and sleep"), d: watch, set: setWatch },
  ];

  return (
    <Card className="mb-4 border-primary/30">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg"><HeartPulse className="h-5 w-5 text-primary" />{tr("Connected Health")}</CardTitle>
        <SampleBadge>{tr("Demo mode · simulated devices")}</SampleBadge>
      </CardHeader>
      <CardContent className="space-y-4">
        {urgent && (
          <div role="alert" className="rounded-lg border border-destructive bg-danger-soft p-4">
            <p className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-5 w-5" />{tr("Urgent: seek help now")}</p>
            <p className="mt-1 text-sm">{tr("A dangerous reading or urgent symptom was reported. Do not wait. Call 999 in Malaysia if you feel very unwell, and follow your clinic's instructions.")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="lg" variant="destructive"><a href="tel:999"><Phone className="mr-2 h-4 w-4" />{tr("Call 999")}</a></Button>
              <Button asChild size="lg" variant="outline"><Link to="/emergency">{tr("Emergency page")}</Link></Button>
              <Button size="lg" variant="ghost" onClick={() => setUrgent(false)}>{tr("I have got help")}</Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted p-4">
          <div>
            <p className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className={anyOn ? "h-5 w-5 text-success" : "h-5 w-5 text-muted-foreground"} />{anyOn ? tr("Automatic Monitoring: On") : tr("Automatic Monitoring: Off")}</p>
            <p className="text-sm text-muted-foreground">{tr("Last update")}: {last ? format(last, "h:mm a") : tr("Not yet synced")} · {tr("{n} simulated readings saved", { n: deviceCount })}</p>
          </div>
          <Button size="lg" className="h-12 text-base" onClick={runGuardian}>{tr("See Guardian Mode in Action")}</Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {devices.map(({ key, icon: Icon, name, what, d, set }) => (
            <div key={key} className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4" />{name}</p>
                <p className="text-sm text-muted-foreground">{what}</p>
                <p className="text-sm">{d.connected ? tr("Connected") : tr("Disconnected")} · {tr("Last sync")}: {d.lastSync ? format(d.lastSync, "h:mm a") : "—"}</p>
                {key === "watch" && d.connected && <p className="text-sm text-muted-foreground">{vitals.hr} bpm · {vitals.steps} {tr("steps")} · {vitals.sleep} {tr("h sleep")}</p>}
              </div>
              <Button variant="outline" className="h-11" onClick={() => set({ ...d, connected: !d.connected })}>{d.connected ? tr("Disconnect") : tr("Connect")}</Button>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">{tr("DiaMonitor saves device readings to your records, checks them for repeated patterns, and shares only what you have agreed to share. Ordinary smartwatches do not measure glucose; glucose needs a CGM or meter. This prototype does not connect to real hardware.")}</p>

        {step > 0 && (
          <div className="space-y-3 rounded-lg border border-primary/40 p-4" aria-live="polite">
            <p className="font-semibold">{tr("Guardian Mode demo")} <SampleBadge>{tr("Simulated")}</SampleBadge></p>
            <p className="text-sm">1. {tr("Three morning readings arrived automatically from the Demo CGM.")}</p>
            {step === 1 && <Button onClick={() => setStep(2)}>{tr("Next")}</Button>}
            {step >= 2 && (
              <>
                <p className="text-sm">2. {tr("DiaMonitor checked your recent days for repeated patterns.")}</p>
                {findings.slice(0, 1).map((f) => <FindingCard key={f.id} f={f} t={t} compact />)}
                <p className="text-sm text-muted-foreground">{tr("What changed: several fasting readings were higher than the demo reference range. This is a pattern to discuss, not a diagnosis.")}</p>
                {step === 2 && <Button onClick={() => setStep(3)}>{tr("Next")}</Button>}
              </>
            )}
            {step >= 3 && (
              <>
                <p className="text-lg font-semibold">3. {tr("How are you feeling?")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="lg" variant={feeling === "okay" ? "default" : "outline"} onClick={() => answer("okay")}>{tr("I feel okay")}</Button>
                  <Button size="lg" variant={feeling === "unwell" ? "default" : "outline"} onClick={() => answer("unwell")}>{tr("I feel unwell")}</Button>
                  <Button size="lg" variant="destructive" onClick={() => answer("help")}>{tr("I need help")}</Button>
                </div>
              </>
            )}
            {step === 4 && feeling && (
              <div className="space-y-2 rounded-md bg-muted p-3 text-sm">
                <p>4. {feeling === "help" ? tr("Urgent safety guidance is shown above.") : feeling === "unwell" ? tr("Your symptom was recorded. Consider contacting your clinic.") : tr("Thanks. Your check-in was recorded. No extra caregiver alert was created because of this answer. The pattern stays in your records for your doctor.")}</p>
                {feeling === "okay" && <p className="text-muted-foreground">{tr("If a dangerous reading arrives or you start to feel unwell, safety guidance will still appear immediately.")}</p>}
                {feeling !== "okay" && (alerted
                  ? <p className="font-medium">5. {tr("SIMULATED caregiver alert saved for {name}. Nothing was actually sent — no SMS, WhatsApp or notification.", { name: cg?.name || tr("your caregiver") })} <Link to="/caregiver" className="underline">{tr("View caregiver history")}</Link></p>
                  : <p>5. {tr("Not shared with a caregiver, following your sharing preferences.")} <Link to="/care-plan" className="underline">{tr("Change preferences")}</Link></p>)}
                <Button variant="outline" onClick={runGuardian}>{tr("Replay demo")}</Button>
              </div>
            )}
          </div>
        )}

        <details className="rounded-lg border p-3">
          <summary className="flex cursor-pointer items-center gap-2 font-medium"><ChevronDown className="h-4 w-4" />{tr("Demo Settings")}</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => sync()}><Activity className="mr-2 h-4 w-4" />{tr("Simulate New Reading")}</Button>
            <Button variant="outline" onClick={() => sync(9.4, "fasting")}>{tr("Simulate high fasting")}</Button>
            <Button variant="outline" onClick={() => sync(3.2)}>{tr("Simulate low reading")}</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{tr("Simulated readings are labelled \"Simulated device\" and never duplicate an existing device reading time.")}</p>
        </details>
      </CardContent>
    </Card>
  );
}
