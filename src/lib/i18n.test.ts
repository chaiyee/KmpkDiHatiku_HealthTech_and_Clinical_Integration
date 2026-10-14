import { describe, expect, it } from "vitest";
import { translate } from "./i18n";
import { translations } from "./translations";
import { generateSampleData, DEMO_THRESHOLDS } from "./sample-data";
import { detectPatterns } from "./patterns";
import { getCopilotResponse, isUrgent } from "./copilot-service";

describe("DiaMonitor multilingual support", () => {
  it("has both translations for every dictionary entry", () => {
    for (const entry of Object.values(translations)) {
      expect(entry.ms.trim()).not.toBe("");
      expect(entry.zh.trim()).not.toBe("");
    }
  });
  it("preserves English and patient-entered wording", () => {
    expect(translate("My Health", "en")).toBe("My Health");
    expect(translate("My own note", "zh")).toBe("My own note");
  });
  it("translates dynamic findings without changing their numbers", () => {
    const now = new Date("2026-10-11T12:00:00Z");
    const data = generateSampleData(now);
    for (const language of ["ms", "zh"] as const) {
      for (const finding of detectPatterns(data.readings, DEMO_THRESHOLDS, now)) {
        for (const text of [finding.title, finding.summary, finding.rule]) {
          expect(translate(text, language)).not.toBe(text);
        }
      }
      expect(translate("2 low readings recorded", language)).not.toBe("2 low readings recorded");
      expect(translate("1 very high reading recorded", language)).not.toBe("1 very high reading recorded");
    }
  });
  it("recognizes urgent questions in all supported languages", () => {
    for (const question of ["chest pain", "sakit dada", "sesak nafas", "胸痛", "意识混乱"]) {
      expect(isUrgent(question)).toBe(true);
    }
  });
  it("translates the existing demo response paragraphs and findings", async () => {
    const data = generateSampleData();
    for (const question of ["glucose trend", "doctor", "meal", "other", "胸痛"]) {
      const response = await getCopilotResponse(question, data);
      for (const language of ["ms", "zh"] as const) {
        for (const line of response.text.split("\n").filter(Boolean)) {
          expect(translate(line, language)).not.toBe(line);
          expect(translate(line, language)).not.toMatch(/Morning \(fasting\)|Here's what|No repeated|Your recent/);
        }
      }
    }
  });
});