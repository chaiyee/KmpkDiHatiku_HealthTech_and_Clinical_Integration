import { useLanguage } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, PageLoading, StatusPill, readingStatus } from "@/components/common";
import { CaregiverAlertDetails } from "@/components/CaregiverSupport";
import { useStore } from "@/lib/store";
import { visibleCaregiverAlerts, sharingAllows } from "@/lib/caregiver";
import { CONTEXT_LABELS } from "@/lib/types";
import { localDay } from "@/lib/medications";

export const Route = createFileRoute("/caregiver")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Caregiver view · DiaMonitor Copilot" },
      { name: "description", content: "A simulated preview of what a consented caregiver would see." },
      { property: "og:title", content: "Caregiver view · DiaMonitor Copilot" },
      { property: "og:description", content: "A simulated preview of what a consented caregiver would see." },
    ],
  }),
  component: CaregiverPage,
});

function CaregiverPage() {
  const { t, format } = useLanguage();
  const { data, acknowledgeCaregiver } = useStore();
  if (!data) return <PageLoading />;
  const sharingOn = sharingAllows(data.caregiver, "repeated") || sharingAllows(data.caregiver, "safety");
  const alerts = visibleCaregiverAlerts(data);
  const latest = alerts.find((a) => !a.acknowledgedAt) ?? alerts[0];
  const sorted = [...data.readings].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const reading = sorted[0];
  const today = localDay(new Date());
  const loggedToday = [...data.readings, ...data.logs].some((r) => r.timestamp.startsWith(today));
  const medsTakenToday = (data.medicationStatuses ?? []).filter((s) => s.status === "taken" && s.date === today).length;
  const initials = data.patient.name.split(" ").map((p) => p[0]).join("");
  const statusLabel = latest && !latest.acknowledgedAt ? "Needs attention" : "Doing well";

  return (
    <div className="space-y-4" data-tour="caregiver-view">
      <PageHeader title={t("Caregiver view")} />
      <p className="rounded-lg border border-dashed bg-secondary px-4 py-3 text-sm">
        {t("Simulated view. This is what your caregiver would see after you give consent. Nothing is actually sent.")}
      </p>
      {!sharingOn ? (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-primary" />{t("Sharing is turned off")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">{t("Turn on caregiver sharing in your Care Plan to let a trusted person see selected alerts. Nothing is shared until you enable it.")}</p>
            <Button asChild className="h-12"><Link to="/care-plan">{t("Go to caregiver settings")}</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-base font-semibold text-navy-foreground">{initials}</div>
              <div>
                <CardTitle className="text-lg">{data.patient.name}</CardTitle>
                <p className={`text-sm font-medium ${statusLabel === "Needs attention" ? "text-destructive" : "text-success"}`}>{t(statusLabel)}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {reading ? (
                <div>
                  <p className="text-sm text-muted-foreground">{t("Latest glucose reading")}</p>
                  <p className="text-2xl font-semibold text-navy">{reading.value.toFixed(1)} mmol/L <span className="ml-2 align-middle"><StatusPill status={readingStatus(reading, data.thresholds)} /></span></p>
                  <p className="text-sm text-muted-foreground">{t(CONTEXT_LABELS[reading.context])} · {format(new Date(reading.timestamp), "d MMM, h:mm a")}</p>
                </div>
              ) : <p className="text-muted-foreground">{t("No readings recorded yet.")}</p>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted p-3"><p className="text-muted-foreground">{t("Logged today")}</p><p className="font-semibold">{loggedToday ? t("Yes") : t("Not yet")}</p></div>
                <div className="rounded-lg bg-muted p-3"><p className="text-muted-foreground">{t("Medication taken today")}</p><p className="font-semibold">{medsTakenToday}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("Shared alerts")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {alerts.length === 0 && <p className="text-muted-foreground">{t("No shared alerts to show right now.")}</p>}
              {alerts.slice(0, 3).map((a) => (
                <div key={a.id} className="space-y-2 border-t pt-3 first:border-0 first:pt-0">
                  <CaregiverAlertDetails alert={a} />
                  {!a.acknowledgedAt && <Button onClick={() => acknowledgeCaregiver(a.id)}>{t("Acknowledge alert")}</Button>}
                </div>
              ))}
            </CardContent>
          </Card>
          {data.caregiver?.phone ? (
            <Button asChild className="h-14 w-full text-lg"><a href={`tel:${data.caregiver.phone}`}><Phone className="mr-2 h-5 w-5" />{t("Call {name}", { name: data.patient.name.split(" ")[0] ?? "" })}</a></Button>
          ) : (
            <p className="text-sm text-muted-foreground">{t("No phone number on file. Add one in caregiver settings to enable calling.")}</p>
          )}
        </>
      )}
    </div>
  );
}
