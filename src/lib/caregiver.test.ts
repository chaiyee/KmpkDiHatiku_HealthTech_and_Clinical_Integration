import { describe, expect, it } from "vitest";
import { DEFAULT_CAREGIVER, sharingAllows, syncCaregiverAlerts, visibleCaregiverAlerts } from "./caregiver";
import { generateSampleData } from "./sample-data";
import { translate } from "./i18n";
const now = new Date(2026, 9, 11, 12);
const consent = { ...DEFAULT_CAREGIVER, enabled: true, name: "Demo caregiver", relationship: "Family", shareRepeated: true };
describe("Simulated caregiver alerts", () => {
  it("requires enabled mode, identity, and explicit category consent", () => {
    const data = generateSampleData(now);
    expect(syncCaregiverAlerts(data, now)).toBe(data);
    expect(sharingAllows({ ...consent, enabled: false }, "repeated")).toBe(false);
    expect(sharingAllows({ ...consent, name: "" }, "repeated")).toBe(false);
    expect(sharingAllows(consent, "safety")).toBe(false);
  });
  it("generates a deterministic repeated alert with supporting evidence", () => {
    const data = syncCaregiverAlerts({ ...generateSampleData(now), caregiver: consent }, now);
    expect(data.caregiverAlerts).toHaveLength(1);
    const alert = data.caregiverAlerts?.[0];
    expect(alert?.category).toBe("repeated");
    expect(alert?.evidence.length).toBeGreaterThanOrEqual(data.thresholds.minRepeated);
    expect(alert?.createdAt).toBe(now.toISOString());
    expect(alert?.thresholds).toEqual(data.thresholds);
    for (const language of ["ms", "zh"] as const) {
      expect(translate(alert?.title ?? "", language)).not.toBe(alert?.title);
      expect(translate(alert?.summary ?? "", language)).not.toBe(alert?.summary);
    }
  });
  it("does not duplicate alerts across refreshes, acknowledgement or ageing evidence", () => {
    const data = syncCaregiverAlerts({ ...generateSampleData(now), caregiver: consent }, now);
    expect(syncCaregiverAlerts(data, new Date(now.getTime() + 60000))).toBe(data);
    const acknowledged = { ...data, caregiverAlerts: data.caregiverAlerts?.map((alert) => ({ ...alert, acknowledgedAt: now.toISOString() })) ?? [] };
    expect(syncCaregiverAlerts(acknowledged, now).caregiverAlerts).toHaveLength(1);
    const olderRemoved = { ...data, readings: data.readings.filter((reading) => new Date(reading.timestamp) > new Date(2026, 9, 6, 8)) };
    expect(syncCaregiverAlerts(olderRemoved, now).caregiverAlerts).toHaveLength(1);
  });
  it("hides history and stops creation when consent is revoked", () => {
    const data = syncCaregiverAlerts({ ...generateSampleData(now), caregiver: consent }, now);
    const revoked = { ...data, caregiver: { ...consent, shareRepeated: false } };
    expect(visibleCaregiverAlerts(revoked)).toHaveLength(0);
    expect(syncCaregiverAlerts(revoked, now)).toBe(revoked);
    expect(revoked.caregiverAlerts).toHaveLength(1);
  });
  it("ignores data gaps and baseline-only findings", () => {
    const data = { ...generateSampleData(now), readings: [], caregiver: { ...consent, shareSafety: true } };
    expect(syncCaregiverAlerts(data, now).caregiverAlerts ?? []).toHaveLength(0);
  });
  it("uses existing safety rules only and respects safety consent", () => {
    const sample = generateSampleData(now);
    const reading = sample.readings[0];
    if (!reading) throw new Error("Missing fixture");
    const data = { ...sample, caregiver: { ...consent, shareRepeated: false, shareSafety: true }, readings: [{ ...reading, value: 3.5, timestamp: now.toISOString() }] };
    expect(syncCaregiverAlerts(data, now).caregiverAlerts?.[0]?.category).toBe("safety");
  });
  it("creates one safety alert for repeated lows on several distinct days", () => {
    const sample = generateSampleData(now);
    const reading = sample.readings[0];
    if (!reading) throw new Error("Missing fixture");
    const lowReadings = [1, 2, 3].map((daysAgo, i) => ({
      ...reading,
      id: `low-${i}`,
      value: 3.5,
      timestamp: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
    }));
    const data = { ...sample, caregiver: { ...consent, shareRepeated: false, shareSafety: true }, readings: lowReadings };
    const synced = syncCaregiverAlerts(data, now);
    const repeatedLow = synced.caregiverAlerts?.filter((a) => a.title.includes("different days"));
    expect(repeatedLow).toHaveLength(1);
    expect(repeatedLow?.[0]?.category).toBe("safety");
  });
  it("does not duplicate the repeated-low alert on re-sync", () => {
    const sample = generateSampleData(now);
    const reading = sample.readings[0];
    if (!reading) throw new Error("Missing fixture");
    const lowReadings = [1, 2, 3].map((daysAgo, i) => ({
      ...reading,
      id: `low-${i}`,
      value: 3.5,
      timestamp: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
    }));
    const data = { ...sample, caregiver: { ...consent, shareRepeated: false, shareSafety: true }, readings: lowReadings };
    const synced = syncCaregiverAlerts(data, now);
    expect(syncCaregiverAlerts(synced, now)).toBe(synced);
  });
});