import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { toMmol, validateReading } from "@/lib/health-records";
import { GLUCOSE_CONTEXTS, type GlucoseContext, type GlucoseUnit } from "@/lib/types";

export function GlucoseForm({ onDone }: { onDone?: () => void }) {
  const { addReading, data } = useStore();
  const { t } = useI18n();
  const now = new Date();
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<GlucoseUnit>("mmol/L");
  const [date, setDate] = useState(format(now, "yyyy-MM-dd"));
  const [time, setTime] = useState(format(now, "HH:mm"));
  const [context, setContext] = useState<GlucoseContext>("fasting");
  const [note, setNote] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [meal, setMeal] = useState("");
  const [activity, setActivity] = useState("");
  const [med, setMed] = useState("");
  const [errors, setErrors] = useState<{ value?: string; date?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    const ts = new Date(`${date}T${time}`);
    const err = validateReading({ raw: value, unit, timestamp: ts }, data.readings);
    if (err) {
      setErrors({ [err.field]: t(err.error, { unit }) });
      return;
    }
    setErrors({});
    const raw = Number(value.trim().replace(",", "."));
    const mmol = toMmol(raw, unit);
    const opt = (s: string) => s.trim() || undefined;
    addReading({
      value: mmol,
      originalValue: raw,
      originalUnit: unit,
      timestamp: ts.toISOString(),
      context,
      note: opt(note),
      symptoms: opt(symptoms),
      meal: opt(meal),
      activity: opt(activity),
      medicationContext: opt(med),
    });
    const th = data.thresholds;
    if (mmol < th.hypo) toast.error(t("glucose.savedLow"), { duration: 12000 });
    else if (mmol > th.severeHigh) toast.error(t("glucose.savedVeryHigh"), { duration: 12000 });
    else toast.success(t("glucose.saved"));
    setValue("");
    setNote("");
    setSymptoms("");
    setMeal("");
    setActivity("");
    setMed("");
    onDone?.();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="g-value" className="text-[15px]">{t("glucose.value")}</Label>
        <div className="mt-1.5 flex gap-2">
          <Input
            id="g-value"
            inputMode="decimal"
            placeholder={unit === "mmol/L" ? "6.8" : "122"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-12 text-lg"
            aria-invalid={!!errors.value}
            aria-describedby={errors.value ? "g-value-err" : undefined}
          />
          <Select value={unit} onValueChange={(v) => setUnit(v as GlucoseUnit)}>
            <SelectTrigger className="h-12 w-32" aria-label={t("glucose.unit")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mmol/L">mmol/L</SelectItem>
              <SelectItem value="mg/dL">mg/dL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {errors.value && <p id="g-value-err" role="alert" className="mt-1 text-sm text-destructive">{errors.value}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="g-date">{t("common.date")}</Label>
          <Input id="g-date" type="date" value={date} max={format(now, "yyyy-MM-dd")} onChange={(e) => setDate(e.target.value)} className="mt-1.5 h-12" />
        </div>
        <div>
          <Label htmlFor="g-time">{t("common.time")}</Label>
          <Input id="g-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1.5 h-12" />
        </div>
        {errors.date && <p role="alert" className="col-span-2 text-sm text-destructive">{errors.date}</p>}
      </div>
      <div>
        <Label>{t("glucose.whenTaken")}</Label>
        <Select value={context} onValueChange={(v) => setContext(v as GlucoseContext)}>
          <SelectTrigger className="mt-1.5 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            {GLUCOSE_CONTEXTS.map((k) => (
              <SelectItem key={k} value={k}>{t(`context.${k}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="g-note">{t("glucose.note")}</Label>
        <Input id="g-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("glucose.notePh")} className="mt-1.5 h-12" />
      </div>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="h-10 w-full justify-between px-2 text-sm">
            {t("glucose.moreDetails")} <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          {(
            [
              ["g-sym", "glucose.symptoms", symptoms, setSymptoms, "glucose.symptomsPh"],
              ["g-meal", "glucose.meal", meal, setMeal, "glucose.mealPh"],
              ["g-act", "glucose.activity", activity, setActivity, "glucose.activityPh"],
              ["g-med", "glucose.medication", med, setMed, "glucose.medicationPh"],
            ] as const
          ).map(([id, label, v, set, ph]) => (
            <div key={id}>
              <Label htmlFor={id}>{t(label)}</Label>
              <Input id={id} value={v} onChange={(e) => set(e.target.value)} placeholder={t(ph)} className="mt-1.5 h-11" />
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
      <Button type="submit" className="h-12 w-full text-base">{t("glucose.save")}</Button>
    </form>
  );
}
