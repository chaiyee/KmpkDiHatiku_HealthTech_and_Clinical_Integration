import { useState, type FormEvent } from "react";
import { Check, Clock, Pencil, Pill, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { useLanguage } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useClock } from "@/hooks/use-clock";
import { localDay, reminderFor, statusFor, WEEKDAYS } from "@/lib/medications";
import { SKIP_REASONS, type MedicationSchedule } from "@/lib/types";
import { Textarea } from "./ui/textarea";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const STATUS_LABELS = { taken: "Taken", skipped: "Skipped", later: "Delayed" };
const TIMINGS = ["Before meal", "With meal", "After meal", "At bedtime"];

export function MedicationReminders() {
  const { t, format } = useLanguage();
  const { data, removeMedication, markMedication } = useStore();
  const now = useClock();
  const [editing, setEditing] = useState<MedicationSchedule | "new" | null>(null);
  const [removing, setRemoving] = useState<MedicationSchedule | null>(null);
  const [skipping, setSkipping] = useState<MedicationSchedule | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  if (!data) return null;
  const schedules = data.medicationSchedules ?? [];
  const statuses = data.medicationStatuses ?? [];
  const today = localDay(now);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Pill className="h-5 w-5 shrink-0 text-primary" />
          {t("Medication Reminder")}
        </CardTitle>
        <Button variant="outline" onClick={() => setEditing("new")}>
          <Plus />
          {t("Add medication")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t(
            "Follow your prescription. These are self-reported records, not confirmed adherence. Never change doses or take extra medication based on this app.",
          )}
        </p>
        <h3 className="font-medium">
          {t("Today's medication status")} · {format(now, "d MMM")}
        </h3>
        {schedules.length === 0 && (
          <p className="py-3 text-sm text-muted-foreground">{t("No medication reminders yet.")}</p>
        )}
        <ul className="divide-y">
          {[...schedules]
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((schedule) => {
              const isToday = schedule.days.includes(now.getDay());
              const status = statusFor(statuses, schedule.id, today);
              const reminder = reminderFor(schedule, statuses, now);
              return (
                <li key={schedule.id} className="space-y-3 py-4 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold">
                        {schedule.name}{" "}
                        <span className="font-normal text-muted-foreground">
                          {schedule.dose} {schedule.unit}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.time} ·{" "}
                        {schedule.days.length === 7
                          ? t("Daily")
                          : schedule.days.map((d) => t(WEEKDAYS[d] ?? "")).join(", ")}
                      </p>
                      <p
                        className={`text-sm font-medium ${status?.status === "taken" ? "text-success" : "text-muted-foreground"}`}
                        role="status"
                      >
                        {!isToday
                          ? t("Not scheduled today")
                          : status
                            ? t(STATUS_LABELS[status.status])
                            : t("Not Logged")}
                        {isToday && status?.status === "skipped" && status.reason && (
                          <>
                            {" "}
                            · {t(status.reason)}
                            {status.note && ` (${status.note})`}
                          </>
                        )}
                        {isToday && status?.status === "later" && status.remindAt && (
                          <> · {format(new Date(status.remindAt), "d MMM, HH:mm")}</>
                        )}
                      </p>
                      {isToday && reminder?.due && (
                        <p className="text-sm font-medium text-primary">{t("Reminder due")}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("Edit medication")}
                        title={t("Edit medication")}
                        onClick={() => setEditing(schedule)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("Remove medication")}
                        title={t("Remove medication")}
                        onClick={() => setRemoving(schedule)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  {isToday && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={status?.status === "taken" ? "secondary" : "outline"}
                        aria-pressed={status?.status === "taken"}
                        onClick={() => markMedication(schedule.id, "taken")}
                      >
                        <Check />
                        {t("Taken")}
                      </Button>
                      <Button
                        variant={status?.status === "skipped" ? "secondary" : "outline"}
                        aria-pressed={status?.status === "skipped"}
                        onClick={() => {
                          setReason(status?.reason ?? "");
                          setNote(status?.note ?? "");
                          setSkipping(schedule);
                        }}
                      >
                        <X />
                        {t("Log Missed / Skipped")}
                      </Button>
                      <Button
                        variant={status?.status === "later" ? "secondary" : "outline"}
                        aria-pressed={status?.status === "later"}
                        onClick={() => markMedication(schedule.id, "later")}
                      >
                        <Clock />
                        {t("Remind Later")}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
        <details className="border-t pt-2">
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium text-primary">
            {t("How reminders work")}
          </summary>
          <p className="text-xs text-muted-foreground">
            {t(
              "Remind Later postpones the in-app reminder by 15 minutes. Reminders appear only while the app is open. Not Logged does not mean a dose was missed.",
            )}
          </p>
        </details>
      </CardContent>
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(editing === "new" ? "Add medication" : "Edit medication")}</DialogTitle>
            <DialogDescription>
              {t("Enter the medication and dose exactly as prescribed.")}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <MedicationForm
              key={editing === "new" ? "new" : editing.id}
              schedule={editing === "new" ? undefined : editing}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={skipping !== null}
        onOpenChange={(open) => {
          if (!open) setSkipping(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Log Missed / Skipped")}</DialogTitle>
            <DialogDescription>
              {t(
                "Why was this dose not taken? Ask your doctor or pharmacist what to do about a missed dose.",
              )}
            </DialogDescription>
          </DialogHeader>
          <p className="font-medium">{skipping?.name}</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("Reason")}>
            {SKIP_REASONS.map((r) => (
              <Button
                key={r}
                type="button"
                className="h-12"
                variant={reason === r ? "default" : "outline"}
                aria-pressed={reason === r}
                onClick={() => setReason(r)}
              >
                {t(r)}
              </Button>
            ))}
          </div>
          <div>
            <Label htmlFor="skip-note">{t("Note (optional)")}</Label>
            <Textarea
              id="skip-note"
              className="mt-1.5"
              rows={2}
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setSkipping(null)}>
              {t("Cancel")}
            </Button>
            <Button
              disabled={!reason}
              onClick={() => {
                if (skipping)
                  markMedication(skipping.id, "skipped", undefined, { reason, note: note.trim() });
                setSkipping(null);
                toast.success(t("Skipped dose saved to your medication history."));
              }}
            >
              {t("Save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Remove medication")}</DialogTitle>
            <DialogDescription>
              {t(
                "Remove this reminder and its self-reported statuses? This does not change your prescription.",
              )}
            </DialogDescription>
          </DialogHeader>
          <p className="font-medium">{removing?.name}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoving(null)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removing) removeMedication(removing.id);
                setRemoving(null);
              }}
            >
              {t("Remove reminder")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function MedicationForm({
  schedule,
  onDone,
}: {
  schedule?: MedicationSchedule | undefined;
  onDone: () => void;
}) {
  const { t } = useLanguage();
  const { saveMedication } = useStore();
  const [name, setName] = useState(schedule?.name ?? "");
  const [dose, setDose] = useState(schedule?.dose ?? "");
  const [unit, setUnit] = useState(schedule?.unit ?? "mg");
  const [time, setTime] = useState(schedule?.time ?? "08:00");
  const [frequency, setFrequency] = useState(
    schedule && schedule.days.length !== 7 ? "selected" : "daily",
  );
  const [days, setDays] = useState<number[]>(schedule?.days ?? ALL_DAYS);
  const [timing, setTiming] = useState(schedule?.timing ?? "none");
  const [purpose, setPurpose] = useState(schedule?.purpose ?? "");
  const [error, setError] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (
      !name.trim() ||
      !unit.trim() ||
      !dose.trim() ||
      !Number.isFinite(Number(dose)) ||
      Number(dose) <= 0 ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    ) {
      setError(
        "Enter a medication name, a positive prescribed dose, a unit, and a valid reminder time.",
      );
      return;
    }
    if (frequency === "selected" && !days.length) {
      setError("Choose at least one reminder day.");
      return;
    }
    saveMedication({
      ...(schedule ? { id: schedule.id } : {}),
      name: name.trim(),
      dose: dose.trim(),
      unit: unit.trim(),
      time,
      days: frequency === "daily" ? ALL_DAYS : [...days].sort(),
      ...(timing !== "none" ? { timing } : {}),
      ...(purpose.trim() ? { purpose: purpose.trim() } : {}),
    });
    toast.success(t("Medication reminder saved."));
    onDone();
  }
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <Label htmlFor="med-name">{t("Prescribed medication name")}</Label>
        <Input
          id="med-name"
          className="mt-1.5 h-12"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="med-dose">{t("Prescribed dose")}</Label>
          <Input
            id="med-dose"
            className="mt-1.5 h-12"
            inputMode="decimal"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="med-unit">{t("Dose unit")}</Label>
          <Input
            id="med-unit"
            className="mt-1.5 h-12"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder={t("e.g. mg, mL, tablet")}
            maxLength={30}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="med-time">{t("Reminder time")}</Label>
        <Input
          id="med-time"
          type="time"
          className="mt-1.5 h-12"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="med-frequency">{t("Frequency")}</Label>
        <Select value={frequency} onValueChange={setFrequency}>
          <SelectTrigger id="med-frequency" className="mt-1.5 h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">{t("Daily")}</SelectItem>
            <SelectItem value="selected">{t("Selected days")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {frequency === "selected" && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t("Reminder days")}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {WEEKDAYS.map((day, index) => (
              <label
                key={day}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={days.includes(index)}
                  onChange={(e) =>
                    setDays((previous) =>
                      e.target.checked ? [...previous, index] : previous.filter((d) => d !== index),
                    )
                  }
                />
                {t(day)}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div>
        <Label htmlFor="med-timing">{t("Meal timing (only if prescribed)")}</Label>
        <Select value={timing} onValueChange={setTiming}>
          <SelectTrigger id="med-timing" className="mt-1.5 h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("No instruction")}</SelectItem>
            {TIMINGS.map((x) => (
              <SelectItem key={x} value={x}>
                {t(x)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="med-purpose">
          {t("What it is for (as told by your doctor, optional)")}
        </Label>
        <Input
          id="med-purpose"
          className="mt-1.5 h-12"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          maxLength={120}
          placeholder={t("e.g. Helps lower blood sugar")}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t(error)}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          {t("Cancel")}
        </Button>
        <Button type="submit">{t("Save reminder")}</Button>
      </div>
    </form>
  );
}
