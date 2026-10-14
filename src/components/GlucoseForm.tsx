import { useLanguage } from "@/lib/i18n";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { LowGlucoseRescue } from "./LowGlucoseRescue";
import { CONTEXT_LABELS, type GlucoseContext } from "@/lib/types";

export function GlucoseForm({ onDone }: { onDone?: () => void }) {
  const { t: tr, format } = useLanguage();
  const { addReading, data } = useStore();
  const now = new Date();
  const [value, setValue] = useState("");
  const [date, setDate] = useState(format(now, "yyyy-MM-dd"));
  const [time, setTime] = useState(format(now, "HH:mm"));
  const [context, setContext] = useState<GlucoseContext>("fasting");
  const [note, setNote] = useState("");
  const [rescue, setRescue] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ value?: string; date?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: { value?: string; date?: string } = {};
    const v = Number(value);
    if (!value.trim()) errs.value = "Please enter your glucose reading.";
    else if (Number.isNaN(v) || v < 1 || v > 33.3) errs.value = "Enter a value between 1.0 and 33.3 mmol/L.";
    const ts = new Date(`${date}T${time}`);
    if (!date || !time || Number.isNaN(ts.getTime())) errs.date = "Please choose a valid date and time.";
    else if (ts.getTime() > Date.now() + 60_000) errs.date = "The time can't be in the future.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    addReading({ value: Math.round(v * 10) / 10, timestamp: ts.toISOString(), context, note: note.trim() || undefined });
    if (!data) return;
    const t = data.thresholds;
    const isLow = v < t.hypo;
    if (isLow) setRescue(Math.round(v * 10) / 10);
    else if (rescue !== null) { setRescue(null); toast.success(tr("Recheck saved. Your reading is now {threshold} mmol/L or higher. Eat your usual meal or snack if it is due.", { threshold: t.hypo.toFixed(1) })); }
    if (isLow) toast.warning(tr("Reading saved. This is below the demo low threshold — if you feel unwell, follow your clinic's advice or call 999."));
    else if (v > t.severeHigh) toast.warning(tr("Reading saved. This is very high — if you feel very unwell, seek urgent care (999)."));
    else toast.success(tr("Reading saved. Your history and chart are updated."));
    setValue("");
    setNote("");
    if (!isLow && rescue === null) onDone?.();
  }

  return (
    <>
    {rescue !== null && <LowGlucoseRescue value={rescue} onClose={() => setRescue(null)} onRecheck={() => { setTime(format(new Date(), "HH:mm")); setDate(format(new Date(), "yyyy-MM-dd")); const el = document.getElementById("g-value"); el?.scrollIntoView({ block: "center" }); el?.focus(); }} />}
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="g-value" className="text-[15px]">{tr("Glucose (mmol/L)")}</Label>
        <Input
          id="g-value"
          inputMode="decimal"
          placeholder={tr("e.g. 6.8")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1.5 h-12 text-lg"
          aria-invalid={!!errors.value}
          aria-describedby={errors.value ? "g-value-err" : undefined}
        />
        {errors.value && <p role="alert" id="g-value-err" className="mt-1 text-sm text-destructive">{tr(errors.value)}</p>}
      </div>
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
        <div>
          <Label htmlFor="g-date">{tr("Date")}</Label>
          <Input aria-invalid={!!errors.date} aria-describedby={errors.date ? "g-date-err" : undefined} id="g-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5 h-12" />
        </div>
        <div>
          <Label htmlFor="g-time">{tr("Time")}</Label>
          <Input aria-invalid={!!errors.date} aria-describedby={errors.date ? "g-date-err" : undefined} id="g-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1.5 h-12" />
        </div>
        {errors.date && <p id="g-date-err" role="alert" className="min-[400px]:col-span-2 text-sm text-destructive">{tr(errors.date)}</p>}
      </div>
      <div>
        <Label htmlFor="g-context">{tr("When was this taken?")}</Label>
        <Select value={context} onValueChange={(v) => setContext(v as GlucoseContext)}>
          <SelectTrigger id="g-context" className="mt-1.5 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(CONTEXT_LABELS).map(([k, l]) => (
              <SelectItem key={k} value={k}>{tr(l)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="g-note">{tr("Note (optional)")}</Label>
        <Input id="g-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={tr("e.g. late dinner")} className="mt-1.5 h-12" />
      </div>
      <Button type="submit" className="h-12 w-full text-base">{tr("Save reading")}</Button>
    </form>
    </>
  );
}
