import { describe, expect, it } from "vitest";
import { localDay, nextMedication, reminderFor, statusFor } from "./medications";
import type { MedicationSchedule, MedicationStatus } from "./types";
import { DAILY_GUIDES, dailyGuide } from "@/components/DailyCareGuide";
import { translations } from "./translations";

const now = new Date(2026, 9, 11, 12, 0);
const schedule: MedicationSchedule = { id: "m1", name: "Prescribed medicine", dose: "500", unit: "mg", time: "08:00", days: [0,1,2,3,4,5,6] };
const report = (status: MedicationStatus["status"], remindAt?: string): MedicationStatus => ({ scheduleId: "m1", date: localDay(now), status, updatedAt: now.toISOString(), ...(remindAt ? { remindAt } : {}) });
describe("Medication schedules", () => {
  it("keeps an overdue unreported medication unlogged, not missed", () => {
    expect(statusFor([], schedule.id, localDay(now))).toBeUndefined();
    expect(reminderFor(schedule, [], now)?.due).toBe(true);
  });
  it("moves taken and skipped schedules to their next scheduled day", () => {
    for (const status of ["taken", "skipped"] as const) {
      expect(reminderFor(schedule, [report(status)], now)?.date).toBe("2026-10-12");
    }
  });
  it("uses snoozed time without changing the dose or creating another dose", () => {
    const at = new Date(now.getTime() + 15 * 60000).toISOString();
    const result = reminderFor(schedule, [report("later", at)], now);
    expect(result?.at.toISOString()).toBe(at);
    expect(result?.due).toBe(false);
    expect(result?.schedule.dose).toBe("500");
  });
  it("respects selected weekdays and resets statuses by local calendar day", () => {
    expect(reminderFor({ ...schedule, days: [1] }, [], now)?.date).toBe("2026-10-12");
    expect(reminderFor(schedule, [report("taken")], new Date(2026, 9, 12, 9))?.due).toBe(true);
  });
  it("chooses the earliest reminder and handles an empty schedule", () => {
    expect(nextMedication([], [], now)).toBeUndefined();
    expect(nextMedication([{ ...schedule, id: "later", time: "18:00" }, schedule], [], now)?.schedule.id).toBe("m1");
  });
});
describe("Daily educational guide", () => {
  it("covers Monday to Sunday with five suggestions and repeats weekly", () => {
    expect(DAILY_GUIDES).toHaveLength(7);
    for (let day = 0; day < 7; day++) {
      expect(dailyGuide(new Date(2026, 9, 12 + day))).toEqual(DAILY_GUIDES[day]);
      expect(DAILY_GUIDES[day]).toHaveLength(5);
    }
    expect(dailyGuide(now)).toHaveLength(5);
    expect(dailyGuide(now)).not.toEqual(dailyGuide(new Date(2026, 9, 12)));
    expect(dailyGuide(now)).toEqual(dailyGuide(new Date(2026, 9, 18)));
  });
  it("translates all predefined suggestions", () => {
    for (const guide of DAILY_GUIDES) for (const suggestion of guide) {
      expect(translations[suggestion]?.ms).toBeTruthy();
      expect(translations[suggestion]?.zh).toBeTruthy();
    }
  });
});