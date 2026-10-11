import { format, subDays } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { AlarmClock, Check, Pause, Pencil, Pill, Play, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { dosesForDate, nextReminder, weeklySummary, type Dose } from "@/lib/medications";
import type { DoseStatus, MedFrequency, MedicationSchedule } from "@/lib/types";

export function DoseStatusBadge({ status, today }: { status: DoseStatus; today?: boolean }) {
  const { t } = useI18n();
  const cls: Record<DoseStatus, string> = {
    taken: "bg-success-soft text-success",
    skipped: "bg-muted text-foreground",
    postponed: "bg-warning-soft text-warning",
    scheduled: "bg-accent text-primary",
    not_logged: "border border-dashed text-muted-foreground",
  };
  const label = status === "not_logged" && today ? t("med.status.pending") : t(`med.status.${status}`);
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${cls[status]}`}>{label}</span>;
}

function TakenDialog({ dose, open, onOpenChange }: { dose: Dose | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { recordDose } = useStore();
  const { t } = useI18n();
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  if (!dose) return null;
  const save = () => {
    const actual = new Date(`${format(new Date(), "yyyy-MM-dd")}T${time}`);
    if (Number.isNaN(actual.getTime()) || actual.getTime() > Date.now() + 60_000) return setErr(t("validation.dateFuture"));
    recordDose(dose.schedule.id, dose.date, dose.time, "taken", { actualTime: actual.toISOString(), note: note.trim() || undefined });
    toast.success(t("med.toast.taken", { name: dose.schedule.name }));
    setNote("");
    setErr("");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("med.markTaken")} — {dose.schedule.name}</DialogTitle>
          <DialogDescription>{t("med.selfReported")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="taken-time">{t("med.actualTime")}</Label>
            <Input id="taken-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1.5 h-12" />
            {err && <p role="alert" className="mt-1 text-sm text-destructive">{err}</p>}
          </div>
          <div>
            <Label htmlFor="taken-note">{t("med.notes")}</Label>
            <Input id="taken-note" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5 h-12" />
          </div>
        </div>
        <DialogFooter>
          <Button className="h-12 w-full sm:w-auto" onClick={save}><Check className="mr-1 h-4 w-4" />{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DoseActions({ dose, size = "default" }: { dose: Dose; size?: "default" | "sm" }) {
  const { recordDose } = useStore();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [later, setLater] = useState("15");
  const h = size === "sm" ? "h-10" : "h-12";
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button className={`${h} flex-1`} onClick={() => setOpen(true)}><Check className="mr-1 h-4 w-4" />{t("med.markTaken")}</Button>
        <Button
          variant="outline"
          className={`${h} flex-1`}
          onClick={() => {
            recordDose(dose.schedule.id, dose.date, dose.time, "skipped");
            toast(t("med.toast.skipped", { name: dose.schedule.name }));
          }}
        >
          <X className="mr-1 h-4 w-4" />{t("med.markSkipped")}
        </Button>
        <div className="flex flex-1 gap-1">
          <Select value={later} onValueChange={setLater}>
            <SelectTrigger className={`${h} w-24`} aria-label={t("med.remindIn")}><SelectValue /></SelectTrigger>
            <SelectContent>
              {["15", "30", "60"].map((m) => <SelectItem key={m} value={m}>{t("med.minutes", { n: m })}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant="secondary"
            className={`${h} flex-1`}
            onClick={() => {
              recordDose(dose.schedule.id, dose.date, dose.time, "postponed", { postponeMinutes: Number(later) });
              toast(t("med.toast.postponed", { n: later }));
            }}
          >
            <AlarmClock className="mr-1 h-4 w-4" />{t("med.remindLater")}
          </Button>
        </div>
      </div>
      <TakenDialog dose={dose} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function MedicationReminderCard({ compact }: { compact?: boolean }) {
  const { data } = useStore();
  const { t, fmt } = useI18n();
  if (!data) return null;
  const now = new Date();
  const dose = nextReminder(data.medications, data.medEvents, now);
  const isToday = dose?.date === format(now, "yyyy-MM-dd");
  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
          <Pill className="h-4 w-4" />{t("med.reminder")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!dose ? (
          <p className="text-muted-foreground">{t("med.noneScheduled")}</p>
        ) : (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[15px]">
              <dt className="text-muted-foreground">{t("med.medication")}</dt>
              <dd className="font-semibold text-navy">{dose.schedule.name} {dose.schedule.dose} {dose.schedule.unit}</dd>
              <dt className="text-muted-foreground">{t("common.time")}</dt>
              <dd>{fmt.hhmm(dose.time)}{!isToday && ` · ${fmt.date(dose.date)}`}</dd>
              <dt className="text-muted-foreground">{t("med.statusLabel")}</dt>
              <dd>
                <DoseStatusBadge status={dose.status} today={isToday} />
                {dose.status === "postponed" && dose.event?.postponedUntil && (
                  <span className="ml-2 text-sm text-muted-foreground">{t("med.until", { time: fmt.time(dose.event.postponedUntil) })}</span>
                )}
              </dd>
              {dose.schedule.instructions && (
                <>
                  <dt className="text-muted-foreground">{t("med.instructions")}</dt>
                  <dd className="text-sm">{dose.schedule.instructions}</dd>
                </>
              )}
            </dl>
            {isToday && <DoseActions dose={dose} size={compact ? "sm" : "default"} />}
          </>
        )}
        <p className="text-xs text-muted-foreground">{t("med.inAppOnly")}</p>
      </CardContent>
    </Card>
  );
}

export function TodayDoses() {
  const { data } = useStore();
  const { t, fmt } = useI18n();
  if (!data) return null;
  const now = new Date();
  const doses = dosesForDate(data.medications, data.medEvents, format(now, "yyyy-MM-dd"), now);
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">{t("med.today")}</CardTitle></CardHeader>
      <CardContent className="divide-y">
        {doses.length === 0 && <p className="text-muted-foreground">{t("med.noneScheduled")}</p>}
        {doses.map((d) => (
          <div key={d.key} className="space-y-2 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{fmt.hhmm(d.time)} · {d.schedule.name} {d.schedule.dose} {d.schedule.unit}</p>
              <DoseStatusBadge status={d.status} today />
            </div>
            {(d.status === "not_logged" || d.status === "postponed" || d.status === "scheduled") && <DoseActions dose={d} size="sm" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const EMPTY: Omit<MedicationSchedule, "id"> = { name: "", dose: 0, unit: "mg", times: ["08:00"], frequency: "daily", startDate: "", paused: false };

function MedicationDialog({ initial, open, onOpenChange }: { initial: MedicationSchedule | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { saveMedication } = useStore();
  const { t } = useI18n();
  const [m, setM] = useState<Omit<MedicationSchedule, "id"> & { id?: string | undefined }>(initial ?? { ...EMPTY, startDate: format(new Date(), "yyyy-MM-dd") });
  const [doseRaw, setDoseRaw] = useState(initial ? String(initial.dose) : "");
  const [err, setErr] = useState("");
  const set = <K extends keyof MedicationSchedule>(k: K, v: MedicationSchedule[K]) => setM((p) => ({ ...p, [k]: v }));
  const save = () => {
    const dose = Number(doseRaw);
    if (!m.name.trim()) return setErr(t("med.err.name"));
    if (!Number.isFinite(dose) || dose <= 0) return setErr(t("med.err.dose"));
    if (!m.times.length || m.times.some((x) => !/^\d{2}:\d{2}$/.test(x))) return setErr(t("med.err.time"));
    if (!m.startDate) return setErr(t("med.err.start"));
    if (m.endDate && m.endDate < m.startDate) return setErr(t("med.err.end"));
    saveMedication({ ...m, name: m.name.trim(), dose, times: [...new Set(m.times)].sort() });
    toast.success(t("med.toast.saved"));
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? t("med.edit") : t("med.add")}</DialogTitle>
          <DialogDescription>{t("med.prescribedOnly")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="m-name">{t("med.name")}</Label>
            <Input id="m-name" value={m.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="m-dose">{t("med.dose")}</Label>
              <Input id="m-dose" inputMode="decimal" value={doseRaw} onChange={(e) => setDoseRaw(e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label htmlFor="m-unit">{t("med.unit")}</Label>
              <Input id="m-unit" value={m.unit} onChange={(e) => set("unit", e.target.value)} className="mt-1.5 h-11" />
            </div>
          </div>
          <div>
            <Label>{t("med.times")}</Label>
            <div className="mt-1.5 space-y-2">
              {m.times.map((tm, i) => (
                <div key={i} className="flex gap-2">
                  <Input type="time" aria-label={`${t("med.times")} ${i + 1}`} value={tm} onChange={(e) => set("times", m.times.map((x, j) => (j === i ? e.target.value : x)))} className="h-11" />
                  {m.times.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-11 w-11" aria-label={t("common.remove")} onClick={() => set("times", m.times.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => set("times", [...m.times, "12:00"])}><Plus className="mr-1 h-4 w-4" />{t("med.addTime")}</Button>
            </div>
          </div>
          <div>
            <Label>{t("med.frequency")}</Label>
            <Select value={m.frequency} onValueChange={(v) => set("frequency", v as MedFrequency)}>
              <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("med.freq.daily")}</SelectItem>
                <SelectItem value="weekly">{t("med.freq.weekly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="m-start">{t("med.start")}</Label>
              <Input id="m-start" type="date" value={m.startDate} onChange={(e) => set("startDate", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label htmlFor="m-end">{t("med.end")}</Label>
              <Input id="m-end" type="date" value={m.endDate ?? ""} onChange={(e) => set("endDate", e.target.value || undefined)} className="mt-1.5 h-11" />
            </div>
          </div>
          <div>
            <Label htmlFor="m-instr">{t("med.instructions")}</Label>
            <Input id="m-instr" value={m.instructions ?? ""} onChange={(e) => set("instructions", e.target.value || undefined)} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label htmlFor="m-notes">{t("med.notes")}</Label>
            <Textarea id="m-notes" value={m.notes ?? ""} onChange={(e) => set("notes", e.target.value || undefined)} rows={2} className="mt-1.5" />
          </div>
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button className="h-12 w-full sm:w-auto" onClick={save}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MedicationManager() {
  const { data, setMedicationPaused, removeMedication } = useStore();
  const { t, fmt } = useI18n();
  const [editing, setEditing] = useState<MedicationSchedule | null>(null);
  const [open, setOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  if (!data) return null;
  const openFor = (m: MedicationSchedule | null) => {
    setEditing(m);
    setDialogKey((k) => k + 1);
    setOpen(true);
  };
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">{t("med.schedules")}</CardTitle>
        <Button onClick={() => openFor(null)}><Plus className="mr-1 h-4 w-4" />{t("med.add")}</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="rounded-lg bg-secondary p-3 text-sm">{t("med.prescribedOnly")}</p>
        {data.medications.length === 0 && <p className="text-muted-foreground">{t("med.empty")}</p>}
        {data.medications.map((m) => (
          <div key={m.id} className={`rounded-xl border p-4 ${m.paused ? "bg-muted/60" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-navy">{m.name} {m.dose} {m.unit} {m.paused && <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{t("med.paused")}</span>}</p>
                <p className="text-sm text-muted-foreground">{m.times.map(fmt.hhmm).join(", ")} · {t(`med.freq.${m.frequency}`)} · {t("med.from", { d: fmt.date(m.startDate) })}{m.endDate ? ` – ${fmt.date(m.endDate)}` : ""}</p>
                {m.instructions && <p className="mt-1 text-sm">{m.instructions}</p>}
                {m.notes && <p className="text-sm text-muted-foreground">{m.notes}</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-10 w-10" aria-label={t("common.edit")} onClick={() => openFor(m)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-10 w-10" aria-label={m.paused ? t("med.resume") : t("med.pause")} onClick={() => { setMedicationPaused(m.id, !m.paused); toast(m.paused ? t("med.toast.resumed") : t("med.toast.paused")); }}>
                  {m.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive" aria-label={t("common.remove")} onClick={() => { if (window.confirm(t("med.confirmRemove", { name: m.name }))) { removeMedication(m.id); toast(t("med.toast.removed")); } }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      <MedicationDialog key={dialogKey} initial={editing} open={open} onOpenChange={setOpen} />
    </Card>
  );
}

export function MedicationHistory({ days = 7 }: { days?: number }) {
  const { data } = useStore();
  const { t, fmt } = useI18n();
  if (!data) return null;
  const now = new Date();
  const s = weeklySummary(data.medications, data.medEvents, now, 7);
  const rows = Array.from({ length: days }, (_, i) => format(subDays(now, i), "yyyy-MM-dd")).flatMap((d) =>
    dosesForDate(data.medications, data.medEvents, d, now, true).filter((x) => x.status !== "scheduled").reverse(),
  );
  const today = format(now, "yyyy-MM-dd");
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">{t("med.history")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">{t("med.weekly")}</p>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {([["taken", s.taken], ["skipped", s.skipped], ["postponed", s.postponed], ["not_logged", s.notLogged]] as const).map(([k, v]) => (
              <div key={k} className="rounded-lg border p-3">
                <p className="text-muted-foreground">{t(`med.status.${k}`)}</p>
                <p className="text-xl font-semibold text-navy">{v}<span className="text-sm font-normal text-muted-foreground"> / {s.total}</span></p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("med.selfReported")}</p>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">{t("med.medication")}</th>
                <th className="px-3 py-2 font-medium">{t("med.scheduled")}</th>
                <th className="px-3 py-2 font-medium">{t("med.action")}</th>
                <th className="px-3 py-2 font-medium">{t("med.actualTime")}</th>
                <th className="px-3 py-2 font-medium">{t("med.notes")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.key} className="border-t">
                  <td className="px-3 py-2">{d.schedule.name}</td>
                  <td className="whitespace-nowrap px-3 py-2">{fmt.date(d.date)} {fmt.hhmm(d.time)}</td>
                  <td className="px-3 py-2"><DoseStatusBadge status={d.status} today={d.date === today} /></td>
                  <td className="whitespace-nowrap px-3 py-2">{d.event?.actualTime ? fmt.time(d.event.actualTime) : "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{d.event?.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
