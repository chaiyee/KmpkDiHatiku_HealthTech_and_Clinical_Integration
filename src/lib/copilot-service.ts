import type { AppData } from "./types";
import { detectPatterns, fastingBaseline } from "./patterns";

// Isolated AI service layer. Currently returns DEMO responses (no AI or RAG backend connected).
// Replace `getCopilotResponse` with a call to a server-side RAG service later; keep the response shape.

export type ResponseKind = "education" | "personal" | "safety";

export interface CopilotSource {
  title: string;
  url?: string;
}

export interface CopilotResponse {
  kind: ResponseKind;
  text: string;
  sources: CopilotSource[]; // Only documents actually retrieved. Empty in demo mode.
  demo: boolean;
}

const URGENT = /(chest pain|faint|unconscious|confus|can'?t breathe|breathless|vomit|seizure|very low|shaking|sweating|pengsan|sakit dada)/i;

export function isUrgent(text: string) {
  return URGENT.test(text);
}

export async function getCopilotResponse(question: string, data: AppData, now = new Date()): Promise<CopilotResponse> {
  await new Promise((r) => setTimeout(r, 700));
  const q = question.toLowerCase();

  if (isUrgent(q)) {
    return {
      kind: "safety",
      demo: false,
      sources: [],
      text:
        "These symptoms may need urgent attention. Please don't rely on this app. Call 999 or go to the nearest emergency department, or contact your clinic immediately. If you can safely check your glucose, do so and follow the plan your healthcare team gave you.",
    };
  }

  if (/trend|pattern|reading|morning|fasting|my glucose/.test(q)) {
    const findings = detectPatterns(data.readings, data.thresholds, now).filter((f) => f.severity !== "info");
    const b = fastingBaseline(data.readings, data.thresholds, now);
    const lines = findings.length
      ? findings.map((f) => `• ${f.title}: ${f.summary}`).join("\n")
      : "• No repeated out-of-range pattern was detected in the last 7 days.";
    return {
      kind: "personal",
      demo: true,
      sources: [],
      text: `Here's what your recorded data shows (based on the rule-based monitoring engine, not a diagnosis):\n\n${lines}\n\n${b.sufficient ? "" : "There isn't enough earlier data yet to compare with your usual levels.\n\n"}You also logged late nights and some late, heavier dinners on some of these days. That may be worth discussing, but these records only show things happened around the same time — they don't prove one caused the other. Your doctor can help interpret this.`,
    };
  }

  if (/doctor|ask|appointment|visit/.test(q)) {
    return {
      kind: "personal",
      demo: true,
      sources: [],
      text:
        "Based on your recent records, you might ask:\n\n• My morning readings have been higher this past week — what could be contributing?\n• Should my target ranges be adjusted for me?\n• Are late dinners or late nights something I should change?\n• When should I contact the clinic if readings stay high?\n\nYou can find these on the Doctor Visit report too.",
    };
  }

  if (/meal|food|eat|malaysian|nasi|roti/.test(q)) {
    return {
      kind: "education",
      demo: true,
      sources: [],
      text:
        "General ideas often discussed in diabetes education (demo answer, not personalised advice):\n\n• Use the 'suku-suku separuh' plate idea: half vegetables, a quarter protein, a quarter carbohydrates.\n• Choose brown rice or smaller rice portions instead of large servings of white rice.\n• Ikan bakar, chicken soup, tauhu and sayur goreng with less oil are lighter options than deep-fried dishes.\n• Ask for 'kurang manis' or plain drinks instead of teh tarik with condensed milk.\n\nA dietitian can tailor this to you.",
    };
  }

  return {
    kind: "education",
    demo: true,
    sources: [],
    text:
      "I'm a demo assistant and can currently help with: explaining your recent glucose trend, preparing questions for your doctor, and general Malaysian meal ideas. A full answer to this question needs the medical-source service, which isn't connected yet.",
  };
}
