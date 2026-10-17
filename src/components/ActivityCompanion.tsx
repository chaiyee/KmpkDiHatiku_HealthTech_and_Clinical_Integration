import { useState } from "react";
import { Footprints } from "lucide-react";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import {
  ACTIVITY_TYPES,
  activityHistory,
  activitySchema,
  nearbyActivityReadings,
  type ActivityRecord,
} from "@/lib/activity";

import { useClock } from "@/hooks/use-clock";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { HealthLog } from "@/lib/types";

export function ActivityCompanion() {
  const { data, saveActivity, removeActivity, saveActivityReminder } = useStore();
  const { t, format } = useLanguage();
  const now = useClock();
  const [type, setType] = useState<ActivityRecord["type"]>("Walking");
  const [duration, setDuration] = useState("15");
  const [when, setWhen] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [intensity, setIntensity] = useState<ActivityRecord["intensity"]>("Not entered");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState<string>();
  const [message, setMessage] = useState("");
  if (!data) return null;
  const history = activityHistory(data.logs, now);
  const reminder = data.activityReminder;

  function edit(log: HealthLog) {
    setEditing(log.id);
    setType(log.activity!.type);
    setDuration(String(log.activity!.duration));
    setWhen(format(new Date(log.timestamp), "yyyy-MM-dd'T'HH:mm"));
    setIntensity(log.activity!.intensity);
    setNotes(log.activity!.notes);
    setMessage("");
  }
  function reset() {
    setEditing(undefined);
    setType("Walking");
    setDuration("15");
    setNotes("");
    setIntensity("Not entered");
  }
  return (
    <section className="space-y-4">
      <h2 className="section-heading">
        <Footprints className="h-5 w-5" />
        {t("Activity & Glucose")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("Record your movement and review nearby readings.")}
      </p>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            activitySchema.parse({ type, duration: Number(duration), intensity, notes });
            if (!Number.isFinite(Date.parse(when)) || Date.parse(when) > Date.now())
              throw new Error();
            saveActivity({
              id: editing ?? crypto.randomUUID(),
              category: "activity",
              source: "user",
              title: type,
              timestamp: new Date(when).toISOString(),
              activity: { type, duration: Number(duration), intensity, notes },
            });
            reset();
            setMessage("Activity saved.");
          } catch {
            setMessage("Enter a duration of 1–720 whole minutes and a valid past start time.");
          }
        }}
      >
        <Label htmlFor="activity-type">{t("Activity type")}</Label>
        <select
          id="activity-type"
          className="h-11 w-full rounded-md border bg-background px-3"
          value={type}
          onChange={(e) => setType(e.target.value as ActivityRecord["type"])}
        >
          {ACTIVITY_TYPES.map((name) => (
            <option key={name} value={name}>
              {t(name)}
            </option>
          ))}
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="activity-duration">{t("Duration (minutes)")}</Label>
            <Input
              id="activity-duration"
              type="number"
              min="1"
              max="720"
              step="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="activity-start">{t("Start time")}</Label>
            <Input
              id="activity-start"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              required
            />
          </div>
        </div>
        <details>
          <summary className="cursor-pointer">{t("Optional details")}</summary>
          <div className="space-y-2 py-2">
            <Label htmlFor="activity-intensity">{t("Perceived intensity")}</Label>
            <select
              id="activity-intensity"
              className="h-11 w-full rounded-md border bg-background px-3"
              value={intensity}
              onChange={(e) => setIntensity(e.target.value as ActivityRecord["intensity"])}
            >
              {["Not entered", "Light", "Moderate", "Vigorous"].map((name) => (
                <option key={name} value={name}>
                  {t(name)}
                </option>
              ))}
            </select>
            <Label htmlFor="activity-notes">{t("Notes")}</Label>
            <Input
              id="activity-notes"
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </details>
        <div className="flex gap-2">
          <Button type="submit">{t(editing ? "Save changes" : "Save activity")}</Button>
          {editing && (
            <Button type="button" variant="outline" onClick={reset}>
              {t("Cancel")}
            </Button>
          )}
        </div>
        <p role="status" className="text-sm">
          {t(message)}
        </p>
      </form>
      <p className="text-sm text-muted-foreground">
        {t("Low glucose or feeling unwell? Follow your safety plan before activity.")}
      </p>
      <details className="rounded-lg border p-3 text-sm">
        <summary className="min-h-11 cursor-pointer content-center font-medium">
          {t("Activity safety")}
        </summary>
        <p className="mt-2">
          {t(
            "If glucose is low or you feel unwell, follow your care team's safety plan rather than starting exercise. Some diabetes medicines increase low-glucose risk during or after activity. Ask your care team what is suitable for you.",
          )}
        </p>
      </details>
      <p className="font-medium">
        {t("Today: {minutes} logged minutes", {
          minutes: history.today.reduce((sum, log) => sum + log.activity!.duration, 0),
        })}
      </p>
      <details>
        <summary className="cursor-pointer font-medium">
          {t("Last 7 days: {minutes} logged minutes", { minutes: history.minutes })}
        </summary>
        {!history.records.length && (
          <p className="py-3 text-sm">
            {t("No structured activities yet. Older activity notes remain in History.")}
          </p>
        )}
        {history.records.map((log) => (
          <article key={log.id} className="border-t py-3 text-sm space-y-2">
            <p className="font-medium">
              {t(log.activity!.type)} · {log.activity!.duration} {t("minutes")} ·{" "}
              {format(new Date(log.timestamp), "d MMM HH:mm")}
            </p>
            {log.activity!.notes && <p>{log.activity!.notes}</p>}
            {nearbyActivityReadings(log, data.readings).map((reading) => (
              <p key={reading.id}>
                {reading.value} mmol/L · {format(new Date(reading.timestamp), "HH:mm")} ·{" "}
                {t("Manual entry")} ·{" "}
                {t("{minutes} minutes from activity start", {
                  minutes: Math.round(
                    (Date.parse(reading.timestamp) - Date.parse(log.timestamp)) / 60000,
                  ),
                })}
              </p>
            ))}
            {!nearbyActivityReadings(log, data.readings).length && (
              <p>{t("No nearby manually recorded glucose readings.")}</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => edit(log)}>
                {t("Edit")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  removeActivity(log.id);
                  if (editing === log.id) reset();
                }}
              >
                {t("Delete")}
              </Button>
            </div>
          </article>
        ))}
      </details>
      <details>
        <summary className="cursor-pointer">{t("Optional activity reminder")}</summary>
        <p className="text-sm my-2">
          {t("Reminders appear only while this app is open. No background push notifications.")}
        </p>
        <Label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={reminder?.enabled ?? false}
            onChange={(e) =>
              saveActivityReminder({ enabled: e.target.checked, time: reminder?.time ?? "17:30" })
            }
          />
          {t("Remind me to record activity")}
        </Label>
        <Input
          type="time"
          aria-label={t("Reminder time")}
          value={reminder?.time ?? "17:30"}
          onChange={(e) => {
            if (e.target.value)
              saveActivityReminder({ enabled: reminder?.enabled ?? false, time: e.target.value });
          }}
        />
      </details>
    </section>
  );
}
