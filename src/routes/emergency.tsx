import { useLanguage } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageLoading } from "@/components/common";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Emergency Health Card · DiaMonitor Copilot" },
      { name: "description", content: "A printable emergency card with key health details for first responders." },
      { property: "og:title", content: "Emergency Health Card · DiaMonitor Copilot" },
      { property: "og:description", content: "A printable emergency card with key health details for first responders." },
    ],
  }),
  component: EmergencyPage,
});

function SampleQR() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 100" className="h-24 w-24 rounded border bg-white p-1" role="img" aria-label={t("Sample QR for demo")}>
        {[...Array(8)].map((_, row) => [...Array(8)].map((__, col) => (
          (row + col) % 3 === 0 || (row < 2 && col < 2) || (row < 2 && col > 5) || (row > 5 && col < 2) ? (
            <rect key={`${row}-${col}`} x={col * 12.5} y={row * 12.5} width={11} height={11} fill="black" />
          ) : null
        )))}
      </svg>
      <p className="text-[11px] font-medium text-muted-foreground">{t("Sample QR for demo")}</p>
    </div>
  );
}

function EmergencyPage() {
  const { t, format } = useLanguage();
  const { data, saveEmergency } = useStore();
  const [editing, setEditing] = useState(false);
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  useEffect(() => { setAllergies(data?.emergency?.allergies ?? ""); setNotes(data?.emergency?.notes ?? ""); }, [data?.emergency]);
  if (!data) return <PageLoading />;
  const reading = [...data.readings].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  const meds = data.medicationSchedules ?? [];

  return (
    <div className="print-full space-y-4" data-tour="emergency-card">
      <div className="rounded-xl border-4 border-destructive bg-danger-soft p-5">
        <h1 className="text-2xl font-bold text-destructive md:text-3xl">{t("Emergency Health Card")}</h1>
        <p className="mt-1 text-lg font-semibold text-navy">{data.patient.name}</p>
        <div className="mt-3 grid gap-2 text-[15px] sm:grid-cols-2">
          <p><span className="font-medium">{t("Age")}:</span> {data.patient.age}</p>
          <p><span className="font-medium">{t("Condition")}:</span> {data.patient.diabetesType}</p>
          <p className="sm:col-span-2"><span className="font-medium">{t("Clinic & doctor")}:</span> {data.patient.clinic} · {data.patient.doctor}</p>
        </div>
        <Button asChild variant="destructive" className="mt-4 h-14 w-full text-lg no-print"><a href="tel:999"><Phone className="mr-2 h-5 w-5" />{t("Call 999")}</a></Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{t("Current medicines")}</CardTitle></CardHeader>
        <CardContent>
          {meds.length === 0 ? <p className="text-muted-foreground">{t("No medicines recorded.")}</p> : (
            <ul className="space-y-1 text-[15px]">{meds.map((m) => <li key={m.id}>{m.name} · {m.dose} {m.unit} · {m.time}</li>)}</ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">{t("Latest glucose reading")}</CardTitle></CardHeader>
        <CardContent>
          {reading ? <p className="text-[15px]">{reading.value.toFixed(1)} mmol/L · {format(new Date(reading.timestamp), "d MMM, h:mm a")}</p> : <p className="text-muted-foreground">{t("No readings recorded yet.")}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">{t("Caregiver contact")}</CardTitle></CardHeader>
        <CardContent>
          {data.caregiver?.enabled && data.caregiver.name ? (
            <p className="text-[15px]">{data.caregiver.name} ({data.caregiver.relationship}){data.caregiver.phone ? ` · ${data.caregiver.phone}` : ""}</p>
          ) : <p className="text-muted-foreground">{t("No caregiver contact on file.")}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">{t("Allergies")} & {t("Notes")}</CardTitle>
          <Button variant="outline" size="sm" className="no-print" onClick={() => setEditing((v) => !v)}>{t("Edit emergency details")}</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {editing ? (
            <div className="space-y-3 no-print">
              <div><Label htmlFor="ec-allergies">{t("Allergies")}</Label><Input id="ec-allergies" className="mt-1.5 h-12" value={allergies} onChange={(e) => setAllergies(e.target.value)} /></div>
              <div><Label htmlFor="ec-notes">{t("Notes")}</Label><Textarea id="ec-notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
              <Button onClick={() => { saveEmergency({ allergies, notes }); toast.success(t("Emergency details saved.")); setEditing(false); }}>{t("Save")}</Button>
            </div>
          ) : (
            <>
              <p className="text-[15px]"><span className="font-medium">{t("Allergies")}:</span> {data.emergency?.allergies || "—"}</p>
              <p className="text-[15px]"><span className="font-medium">{t("Notes")}:</span> {data.emergency?.notes || "—"}</p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
        <SampleQR />
        <p className="max-w-sm text-xs text-muted-foreground">{t("This QR code is a visual sample only and does not link to any real data.")}</p>
        <Button variant="outline" className="no-print" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />{t("Print card")}</Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("This card is generated from your recorded demo data for emergency information only. It is not a medical document.")}</p>
    </div>
  );
}
