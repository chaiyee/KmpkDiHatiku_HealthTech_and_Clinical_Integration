import { useEffect, useState, type FormEvent } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { EvidenceTable } from "./common";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import {
  DEFAULT_CAREGIVER,
  CAREGIVER_MESSAGE,
  SIMULATION_NOTICE,
  URGENT_NOTICE,
  visibleCaregiverAlerts,
} from "@/lib/caregiver";
import type { CaregiverAlert } from "@/lib/types";

export function CaregiverAlertDetails({
  alert,
  report = false,
}: {
  alert: CaregiverAlert;
  report?: boolean;
}) {
  const { t, format } = useLanguage();
  const { acknowledgeCaregiver } = useStore();
  return (
    <div className="space-y-3 text-sm">
      <p className="font-semibold text-navy">{t(alert.title)}</p>
      <p>{t(CAREGIVER_MESSAGE)}</p>
      <p>{t(alert.summary)}</p>
      <p className="text-muted-foreground">
        {t("Rule:")} {t(alert.rule)}
      </p>
      <p>
        {format(new Date(alert.createdAt), "d MMM yyyy, HH:mm")} ·{" "}
        {t(alert.acknowledgedAt ? "Acknowledged" : "Awaiting acknowledgement")}
      </p>
      {alert.acknowledgedAt && (
        <p className="text-muted-foreground">
          {t("Acknowledged at")}: {format(new Date(alert.acknowledgedAt), "d MMM yyyy, HH:mm")}
        </p>
      )}
      {alert.category === "safety" && (
        <p className="rounded-md border border-destructive/40 bg-danger-soft p-3 text-destructive">
          {t(URGENT_NOTICE)}
        </p>
      )}
      {alert.category === "safety" && (
        <p className="text-xs text-muted-foreground">
          {t(
            "Safety guidance is demo text, not clinician-reviewed. Clinical review is required before real-world use.",
          )}
        </p>
      )}
      <EvidenceTable readings={alert.evidence} t={alert.thresholds} />
      {!report && !alert.acknowledgedAt && (
        <Button variant="outline" onClick={() => acknowledgeCaregiver(alert.id)}>
          {t("Acknowledge alert")}
        </Button>
      )}
    </div>
  );
}

export function CaregiverAlerts({ overview = false }: { overview?: boolean }) {
  const { data } = useStore();
  const { t, format } = useLanguage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!data) return null;
  const alerts = visibleCaregiverAlerts(data);
  const selected = alerts.find((alert) => alert.id === selectedId);
  const latest = alerts.find((alert) => !alert.acknowledgedAt) ?? alerts[0];
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            {t(
              overview
                ? "Caregiver notifications · simulated"
                : "Caregiver alert history · simulated",
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">{t(SIMULATION_NOTICE)}</p>
          {!alerts.length && (
            <p className="text-sm text-muted-foreground">
              {t("No caregiver alert previews yet. Sharing follows your selected consent.")}
            </p>
          )}
          {(overview ? (latest ? [latest] : []) : alerts.slice(0, 5)).map((alert) => (
            <div key={alert.id} className="space-y-2 border-t pt-3 text-sm">
              <p className="font-semibold">{t(alert.title)}</p>
              <p>{t(CAREGIVER_MESSAGE)}</p>
              <p className="text-muted-foreground">
                {format(new Date(alert.createdAt), "d MMM yyyy, HH:mm")} ·{" "}
                {t(alert.acknowledgedAt ? "Acknowledged" : "Awaiting acknowledgement")}
              </p>
              {alert.category === "safety" && (
                <p className="text-destructive">{t(URGENT_NOTICE)}</p>
              )}
              <Button variant="outline" onClick={() => setSelectedId(alert.id)}>
                {t("View alert details")}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Simulated caregiver notification")}</DialogTitle>
            <DialogDescription>{t(SIMULATION_NOTICE)}</DialogDescription>
          </DialogHeader>
          {selected && <CaregiverAlertDetails alert={selected} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CaregiverSupport() {
  const { data, saveCaregiver, revokeCaregiver } = useStore();
  const { t } = useLanguage();
  const [settings, setSettings] = useState(data?.caregiver ?? DEFAULT_CAREGIVER);
  const [error, setError] = useState("");
  useEffect(() => setSettings(data?.caregiver ?? DEFAULT_CAREGIVER), [data?.caregiver]);
  if (!data) return null;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (settings.enabled && (!settings.name.trim() || !settings.relationship.trim())) {
      setError("Enter a caregiver name and relationship before enabling caregiver mode.");
      return;
    }
    setError("");
    saveCaregiver({
      ...settings,
      name: settings.name.trim(),
      relationship: settings.relationship.trim(),
    });
    toast.success(t("Caregiver settings saved."));
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            {t("Caregiver support · simulated")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} noValidate className="space-y-4">
            <p className="text-sm text-muted-foreground">{t(SIMULATION_NOTICE)}</p>
            <p className="text-xs text-muted-foreground">
              {t("Use fictional caregiver details for this hackathon demonstration.")}
            </p>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="caregiver-enabled">{t("Enable caregiver mode")}</Label>
              <Switch
                id="caregiver-enabled"
                className="h-11 w-16 [&_span]:h-8 [&_span]:w-8 [&_span[data-state=checked]]:translate-x-7"
                checked={settings.enabled}
                onCheckedChange={(enabled) => {
                  setSettings((s) => ({ ...s, enabled }));
                  if (!enabled) saveCaregiver({ ...settings, enabled: false });
                }}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="caregiver-name">{t("Caregiver name")}</Label>
                <Input
                  id="caregiver-name"
                  className="mt-1.5 h-12"
                  value={settings.name}
                  onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="caregiver-relationship">{t("Relationship")}</Label>
                <Input
                  id="caregiver-relationship"
                  className="mt-1.5 h-12"
                  value={settings.relationship}
                  onChange={(e) => setSettings((s) => ({ ...s, relationship: e.target.value }))}
                  maxLength={80}
                />
              </div>
              <div>
                <Label htmlFor="caregiver-phone">{t("Caregiver phone (optional)")}</Label>
                <Input
                  id="caregiver-phone"
                  type="tel"
                  className="mt-1.5 h-12"
                  value={settings.phone ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))}
                  maxLength={20}
                />
              </div>
            </div>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">{t("Selected sharing consent")}</legend>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.shareRepeated}
                  onChange={(e) => setSettings((s) => ({ ...s, shareRepeated: e.target.checked }))}
                />
                {t("Share repeated out-of-range glucose alerts")}
              </label>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.shareSafety}
                  onChange={(e) => setSettings((s) => ({ ...s, shareSafety: e.target.checked }))}
                />
                {t("Share existing glucose safety alerts")}
              </label>
            </fieldset>
            <p className="text-xs text-muted-foreground">
              {t(
                "Revoking consent stops new simulated sharing and hides shared history in notifications and the doctor report. Local patient history is retained.",
              )}
            </p>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {t(error)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t("Save caregiver settings")}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  revokeCaregiver();
                  setSettings((s) => ({ ...s, shareRepeated: false, shareSafety: false }));
                  toast.success(t("Sharing consent revoked."));
                }}
              >
                {t("Revoke sharing consent")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <CaregiverAlerts />
    </div>
  );
}
