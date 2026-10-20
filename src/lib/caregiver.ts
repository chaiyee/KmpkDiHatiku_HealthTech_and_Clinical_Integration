import { detectPatterns } from "./patterns";
import type { AppData, CaregiverAlert, CaregiverSettings } from "./types";

export const DEFAULT_CAREGIVER: CaregiverSettings = {
  enabled: false,
  name: "",
  relationship: "",
  shareRepeated: false,
  shareSafety: false,
};
export const CAREGIVER_MESSAGE =
  "Several recent glucose readings are outside the patient's configured glucose range. Please review the available records and follow the patient's agreed care instructions.";
export const SIMULATION_NOTICE =
  "Alert previews stay in this app. No SMS or WhatsApp is sent, and this preview is not secure caregiver access.";
export const URGENT_NOTICE =
  "For potentially urgent symptoms, seek medical assistance immediately; call 999 in Malaysia if needed. Do not wait for caregiver acknowledgement. Follow your clinic's agreed instructions.";
export function sharingAllows(
  settings: CaregiverSettings | undefined,
  category: CaregiverAlert["category"],
) {
  return Boolean(
    settings?.enabled &&
    settings.name.trim() &&
    settings.relationship.trim() &&
    (category === "repeated" ? settings.shareRepeated : settings.shareSafety),
  );
}
export function visibleCaregiverAlerts(data: AppData) {
  return (data.caregiverAlerts ?? []).filter((alert) =>
    sharingAllows(data.caregiver, alert.category),
  );
}
export function syncCaregiverAlerts(data: AppData, now = new Date()): AppData {
  const previous = data.caregiverAlerts ?? [];
  const added: CaregiverAlert[] = [];
  for (const finding of detectPatterns(data.readings, data.thresholds, now)) {
    const category =
      finding.kind === "repeated_high" ||
      (finding.kind === "baseline_shift" && finding.evidence.length)
        ? "repeated"
        : finding.kind === "safety" || finding.kind === "repeated_low"
          ? "safety"
          : undefined;
    if (!category || !sharingAllows(data.caregiver, category) || !finding.evidence.length) continue;
    // One alert per rule and newest triggering measurement; expiry of older evidence never creates another alert.
    const latest = [...finding.evidence].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
    if (!latest) continue;
    const id = JSON.stringify([
      finding.id,
      latest.id,
      latest.timestamp,
      latest.value,
      data.thresholds,
    ]);
    if (previous.some((alert) => alert.id === id)) continue;
    added.push({
      id,
      category,
      title: finding.title,
      summary: finding.summary,
      rule: finding.rule,
      evidence: finding.evidence.map((reading) => ({ ...reading })),
      thresholds: { ...data.thresholds },
      createdAt: now.toISOString(),
    });
  }
  if (!added.length) return data;
  return {
    ...data,
    caregiverAlerts: [...added, ...previous].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
