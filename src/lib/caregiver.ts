import { detectPatterns, type PatternFinding } from "./patterns";
import type { AlertCategory, AppData, CaregiverAlert, CaregiverPermission } from "./types";

// Caregiver alert service. Workflow: validated records → deterministic rule → consent check →
// alert event (deduplicated) → simulated in-app notification centre → acknowledgement.
// Missing logs are never alert triggers. No SMS/email/WhatsApp is sent.

export const isActive = (c: CaregiverPermission) => !c.revokedAt;

export function categoryForFinding(f: PatternFinding): AlertCategory | null {
  if (f.kind === "safety") return "safety";
  if (f.kind === "repeated_high") return "out_of_range";
  if (f.id === "baseline-shift") return "baseline_change";
  return null; // data gaps, insufficient data, data-quality notes never alert
}

export function canReceive(c: CaregiverPermission, cat: AlertCategory, caregiverMode: boolean): boolean {
  if (!caregiverMode || !isActive(c)) return false;
  if (cat !== "support_request" && !c.share.alerts) return false;
  return c.categories[cat];
}

const uid = () => Math.random().toString(36).slice(2, 10);

/** Returns new alerts to append. Pure and deterministic apart from id/time. */
export function evaluateCaregiverAlerts(data: AppData, now: Date = new Date()): CaregiverAlert[] {
  if (!data.caregiverMode) return [];
  const findings = detectPatterns(data.readings, data.thresholds, now);
  const existing = new Set(data.caregiverAlerts.map((a) => a.dedupeKey));
  const out: CaregiverAlert[] = [];
  for (const c of data.caregivers) {
    for (const f of findings) {
      const cat = categoryForFinding(f);
      if (!cat || !canReceive(c, cat, data.caregiverMode)) continue;
      // Safety: one alert per qualifying reading. Patterns: one alert per episode (anchored to its first reading).
      const anchors = cat === "safety" ? f.evidence.map((r) => r.id) : [f.evidence[0]?.id ?? "none"];
      for (const anchor of anchors) {
        const dedupeKey = `${c.id}:${f.id}:${anchor}`;
        if (existing.has(dedupeKey)) continue;
        existing.add(dedupeKey);
        const evidence = cat === "safety" ? f.evidence.filter((r) => r.id === anchor) : f.evidence;
        out.push({
          id: uid(),
          dedupeKey,
          caregiverId: c.id,
          category: cat,
          severity: cat === "safety" ? "urgent" : "info",
          findingId: f.id,
          createdAt: now.toISOString(),
          evidenceIds: c.share.readings ? evidence.map((r) => r.id) : [],
          status: "new",
        });
      }
    }
  }
  return out;
}

export function supportRequestAlerts(data: AppData, message: string, now: Date = new Date()): CaregiverAlert[] {
  return data.caregivers
    .filter((c) => canReceive(c, "support_request", data.caregiverMode))
    .map((c) => ({
      id: uid(),
      dedupeKey: `${c.id}:support:${now.getTime()}`,
      caregiverId: c.id,
      category: "support_request" as const,
      severity: "info" as const,
      createdAt: now.toISOString(),
      evidenceIds: [],
      message,
      status: "new" as const,
    }));
}

/** Alerts a caregiver may currently see (revocation hides everything immediately). */
export function visibleAlerts(data: AppData, caregiverId: string): CaregiverAlert[] {
  const c = data.caregivers.find((x) => x.id === caregiverId);
  if (!c || !isActive(c) || !data.caregiverMode) return [];
  return data.caregiverAlerts
    .filter((a) => a.caregiverId === caregiverId && (a.category === "support_request" || c.share.alerts))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
