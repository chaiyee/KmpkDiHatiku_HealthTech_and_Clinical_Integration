import { describe, expect, it } from "vitest";
import { requestsMedicationChange, getCopilotResponse } from "./copilot-service";
import type { AppData } from "./types";

describe("medication safety filter", () => {
  it.each(["Should I skip my pill?", "Adjust my insulin by 2 units", "Can I stop taking metformin?", "How much insulin should I inject?", "Boleh saya ubah dos ubat?", "我应该减少胰岛素剂量吗？"])("blocks treatment changes: %s", question => {
    expect(requestsMedicationChange(question)).toBe(true);
  });
  it.each(["I recorded 10 units of insulin", "What is metformin?", "Explain my glucose trend", "What should I ask my doctor?"])("allows logging and education: %s", question => {
    expect(requestsMedicationChange(question)).toBe(false);
  });
  it("refuses before inspecting patient data", async () => {
    const result = await getCopilotResponse("Should I skip my pill?", {} as AppData);
    expect(result.kind).toBe("safety");
    expect(result.text).toContain("cannot advise");
  });
  it("keeps urgent symptom guidance ahead of medication refusal", async () => {
    const result = await getCopilotResponse("I have chest pain. Should I stop insulin?", {} as AppData);
    expect(result.text).toContain("Call 999");
  });
});
