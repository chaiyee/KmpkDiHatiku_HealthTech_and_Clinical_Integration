import { subDays } from "date-fns";
import { localDay } from "./medications";
import type { AppData } from "./types";

export function replayDays(data: AppData, now: Date) {
  return [2, 1, 0].map((ago) => {
    const date = subDays(now, ago);
    const key = localDay(date);
    const readings = data.readings
      .filter(
        (r) =>
          r.context === "fasting" &&
          localDay(new Date(r.timestamp)) === key &&
          new Date(r.timestamp) <= now,
      )
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const logs = data.logs.filter(
      (l) => localDay(new Date(l.timestamp)) === key && new Date(l.timestamp) <= now,
    );
    return { date, reading: readings[0], logs };
  });
}
