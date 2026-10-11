import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { CONTEXT_LABELS, type GlucoseContext } from "@/lib/types";

export function GlucoseForm({ onDone }: { onDone?: () => void }) {
  const { addReading, data } = useStore();
  const now = new Date();
  const [value, setValue] = useState("");
  const [date, setDate] = useState(format(now, "yyyy-MM-dd"));
  const [time, setTime] = useState(format(now, "HH:mm"));
  const [context, setContext] = useState<GlucoseContext>("fasting");
  const [note, setNote] = useState("");
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
    const t = data!.thresholds;
    if (v < t.hypo) toast.warning("Reading saved. This is below the demo low threshold — if you feel unwell, follow your clinic's advice or call 999.");
    else if (v > t.severeHigh) toast.warning("Reading saved. This is very high — if you feel very unwell, seek urgent care (999).");
    else toast.success("Reading saved. Your history and chart are updated.");
    setValue("");
    setNote("");
    onDone?.();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="g-value" className="text-[15px]">Glucose (mmol/L)</Label>
        <Input
          id="g-value"
          inputMode="decimal"
          placeholder="e.g. 6.8"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1.5 h-12 text-lg"
          aria-invalid={!!errors.value}
          aria-describedby={errors.value ? "g-value-err" : undefined}
        />
        {errors.value && <p id="g-value-err" className="mt-1 text-sm text-destructive">{errors.value}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="g-date">Date</Label>
          <Input id="g-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5 h-12" />
        </div>
        <div>
          <Label htmlFor="g-time">Time</Label>
          <Input id="g-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1.5 h-12" />
        </div>
        {errors.date && <p className="col-span-2 text-sm text-destructive">{errors.date}</p>}
      </div>
      <div>
        <Label>When was this taken?</Label>
        <Select value={context} onValueChange={(v) => setContext(v as GlucoseContext)}>
          <SelectTrigger className="mt-1.5 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(CONTEXT_LABELS).map(([k, l]) => (
              <SelectItem key={k} value={k}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="g-note">Note (optional)</Label>
        <Input id="g-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. late dinner" className="mt-1.5 h-12" />
      </div>
      <Button type="submit" className="h-12 w-full text-base">Save reading</Button>
    </form>
  );
}
