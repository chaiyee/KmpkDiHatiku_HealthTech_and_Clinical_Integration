import { useState } from "react";
import { toast } from "sonner";
import { BellRing, CheckCheck, HeartHandshake, ShieldAlert, UserPlus, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EvidenceTable, UrgentGuidance } from "@/components/common";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { isActive, visibleAlerts } from "@/lib/caregiver";
import { ALERT_CATEGORIES, type AlertCategory, type CaregiverPermission, type ShareSettings } from "@/lib/types";

const SHARE_KEYS: (keyof ShareSettings)[] = ["status", "readings", "medication", "carePlan", "alerts"];

function CaregiverEditor({ c, onDone }: { c?: CaregiverPermission | undefined; onDone: () => void }) {
  const { saveCaregiver } = useStore();
  const { t } = useI18n();
  const [name, setName] = useState(c?.name ?? "");
  const [rel, setRel] = useState(c?.relationship ?? "");
  const [contact, setContact] = useState(c?.contact ?? "");
  const [share, setShare] = useState<ShareSettings>(c?.share ?? { status: true, readings: false, medication: false, carePlan: false, alerts: true });
  const [cats, setCats] = useState<Record<AlertCategory, boolean>>(c?.categories ?? { out_of_range: true, baseline_change: true, safety: true, support_request: true });
  const [consent, setConsent] = useState(!!c);
  const [err, setErr] = useState("");
  const save = () => {
    if (!name.trim() || !rel.trim()) return setErr(t("cg.err.name"));
    if (!consent) return setErr(t("cg.err.consent"));
    saveCaregiver({ id: c?.id, name: name.trim(), relationship: rel.trim(), contact: contact.trim() || undefined, share, categories: cats, revokedAt: c?.revokedAt });
    toast.success(t("cg.toast.saved"));
    onDone();
  };
  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div><Label htmlFor="cg-name">{t("cg.name")}</Label><Input id="cg-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-11" /></div>
        <div><Label htmlFor="cg-rel">{t("cg.relationship")}</Label><Input id="cg-rel" value={rel} onChange={(e) => setRel(e.target.value)} className="mt-1.5 h-11" /></div>
        <div><Label htmlFor="cg-contact">{t("cg.contact")}</Label><Input id="cg-contact" value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1.5 h-11" /></div>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t("cg.shareTitle")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SHARE_KEYS.map((k) => (
            <label key={k} className="flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm">
              <Checkbox checked={share[k]} onCheckedChange={(v) => setShare((s) => ({ ...s, [k]: v === true }))} />
              {t(`cg.share.${k}`)}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t("cg.notFullHistory")}</p>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t("cg.categoriesTitle")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ALERT_CATEGORIES.map((k) => (
            <label key={k} className="flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm">
              <Checkbox checked={cats[k]} onCheckedChange={(v) => setCats((s) => ({ ...s, [k]: v === true }))} />
              {t(`cg.cat.${k}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-start gap-3 rounded-lg bg-secondary p-3 text-sm">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
        <span>{t("cg.consentText")}</span>
      </label>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2">
        <Button className="h-11" onClick={save}>{t("common.save")}</Button>
        <Button variant="ghost" className="h-11" onClick={onDone}>{t("common.cancel")}</Button>
      </div>
    </div>
  );
}

export function CaregiverSettings() {
  const { data, setCaregiverMode, revokeCaregiver, restoreCaregiver } = useStore();
  const { t, fmt } = useI18n();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  if (!data) return null;
  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-warning/40 bg-warning-soft p-3 text-sm">{t("cg.simulatedNotice")}</p>
      <label className="flex min-h-12 items-center justify-between gap-3 rounded-xl border p-4">
        <span>
          <span className="block font-semibold">{t("cg.enable")}</span>
          <span className="text-sm text-muted-foreground">{t("cg.enableHint")}</span>
        </span>
        <Switch checked={data.caregiverMode} onCheckedChange={setCaregiverMode} aria-label={t("cg.enable")} />
      </label>
      {data.caregivers.map((c) =>
        editing === c.id ? (
          <CaregiverEditor key={c.id} c={c} onDone={() => setEditing(null)} />
        ) : (
          <div key={c.id} className={`rounded-xl border p-4 ${isActive(c) ? "" : "bg-muted/60"}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-navy">{c.name} <span className="font-normal text-muted-foreground">· {c.relationship}</span></p>
                <p className="text-sm text-muted-foreground">
                  {isActive(c) ? t("cg.consentGiven", { d: fmt.date(c.consentAt) }) : t("cg.revokedOn", { d: fmt.date(c.revokedAt!) })}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">{t("cg.sharing")}: </span>
                  {SHARE_KEYS.filter((k) => c.share[k]).map((k) => t(`cg.share.${k}`)).join(", ") || t("cg.nothing")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="h-10" onClick={() => setEditing(c.id)}>{t("cg.review")}</Button>
                {isActive(c) ? (
                  <Button variant="outline" size="sm" className="h-10 text-destructive" onClick={() => { revokeCaregiver(c.id); toast(t("cg.toast.revoked", { name: c.name })); }}>
                    <UserX className="mr-1 h-4 w-4" />{t("cg.revoke")}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-10" onClick={() => restoreCaregiver(c.id)}>{t("cg.restore")}</Button>
                )}
              </div>
            </div>
          </div>
        ),
      )}
      {editing === "new" ? (
        <CaregiverEditor onDone={() => setEditing(null)} />
      ) : (
        <Button variant="outline" className="h-11" onClick={() => setEditing("new")}><UserPlus className="mr-1 h-4 w-4" />{t("cg.add")}</Button>
      )}
    </div>
  );
}

export function SupportRequest() {
  const { requestSupport, data } = useStore();
  const { t } = useI18n();
  const [msg, setMsg] = useState("");
  if (!data) return null;
  const active = data.caregiverMode && data.caregivers.some((c) => isActive(c) && c.categories.support_request);
  return (
    <div className="space-y-2">
      <Label htmlFor="support-msg">{t("cg.supportLabel")}</Label>
      <Textarea id="support-msg" rows={2} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t("cg.supportPh")} />
      <Button
        variant="outline"
        className="h-11"
        disabled={!active}
        onClick={() => {
          const n = requestSupport(msg.trim() || t("cg.supportDefault"));
          if (n) toast.success(t("cg.toast.support"));
          setMsg("");
        }}
      >
        <HeartHandshake className="mr-1 h-4 w-4" />{t("cg.supportBtn")}
      </Button>
      {!active && <p className="text-xs text-muted-foreground">{t("cg.supportDisabled")}</p>}
    </div>
  );
}

export function CaregiverCentre() {
  const { data, acknowledgeAlert } = useStore();
  const { t, fmt } = useI18n();
  const active = data?.caregivers.filter(isActive) ?? [];
  const [cgId, setCgId] = useState<string>(active[0]?.id ?? "");
  if (!data) return null;
  const caregiver = data.caregivers.find((c) => c.id === cgId && isActive(c)) ?? active[0];
  const alerts = caregiver ? visibleAlerts(data, caregiver.id) : [];
  const byId = new Map(data.readings.map((r) => [r.id, r]));
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg"><BellRing className="h-5 w-5 text-primary" />{t("cg.centre")}</CardTitle>
        {active.length > 1 && (
          <Select value={caregiver?.id ?? ""} onValueChange={setCgId}>
            <SelectTrigger className="h-10 w-48" aria-label={t("cg.viewAs")}><SelectValue /></SelectTrigger>
            <SelectContent>{active.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{t("cg.centreNotice")}</p>
        {!data.caregiverMode && <p className="text-muted-foreground">{t("cg.modeOff")}</p>}
        {data.caregiverMode && !caregiver && <p className="text-muted-foreground">{t("cg.noCaregiver")}</p>}
        {caregiver && <p className="text-sm">{t("cg.viewingAs", { name: caregiver.name, rel: caregiver.relationship, patient: `${data.patient.name} (${data.patient.id})` })}</p>}
        {caregiver && alerts.length === 0 && <p className="text-muted-foreground">{t("cg.noAlerts")}</p>}
        {alerts.map((a) => {
          const evidence = caregiver?.share.readings ? a.evidenceIds.map((id) => byId.get(id)).filter((r) => !!r) : [];
          return (
            <div key={a.id} className={`space-y-2 rounded-xl border p-4 ${a.severity === "urgent" ? "border-destructive/40 bg-danger-soft" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-semibold">
                  {a.severity === "urgent" && <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden />}
                  {t(`cg.cat.${a.category}`)}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.severity === "urgent" ? "bg-destructive text-destructive-foreground" : "bg-accent text-primary"}`}>
                    {t(`cg.sev.${a.severity}`)}
                  </span>
                </p>
                <span className="text-sm text-muted-foreground">{fmt.dateTime(a.createdAt)}</span>
              </div>
              <p className="text-[15px]">{a.category === "support_request" ? `“${a.message}”` : t(`cg.explain.${a.category}`)}</p>
              {a.severity === "urgent" && <UrgentGuidance />}
              {evidence.length > 0 ? (
                <EvidenceTable readings={evidence} t={data.thresholds} />
              ) : (
                a.category !== "support_request" && <p className="text-xs text-muted-foreground">{t("cg.noEvidenceShared")}</p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{t("cg.simulatedDelivery")}</span>
                {a.status === "acknowledged" ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-success"><CheckCheck className="h-4 w-4" />{t("cg.acknowledgedAt", { d: fmt.dateTime(a.acknowledgedAt!) })}</span>
                ) : (
                  <Button className="h-10" onClick={() => { acknowledgeAlert(a.id); toast.success(t("cg.toast.ack")); }}>{t("cg.acknowledge")}</Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
