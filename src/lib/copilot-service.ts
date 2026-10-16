import type { AppData } from "./types";
import { detectPatterns, fastingBaseline } from "./patterns";
import { mealCopilotAnswer } from "./meal-copilot";
import type { Language } from "./i18n";
import { renderRecordAnswer } from "./record-answers";

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
  doctorQuestion?: string; // Suggested question the patient can pin to Doctor Visit.
}

const URGENT =
  /(chest pain|faint|unconscious|confus|can'?t breathe|breathless|vomit|seizure|very low|pengsan|sakit dada|sesak nafas|sukar bernafas|keliru|muntah|sawan|glukosa sangat rendah|胸痛|昏厥|晕倒|失去意识|意识混乱|呼吸困难|呕吐|抽搐|血糖很低)/i;
// Symptoms that can accompany low or high glucose. Never used to diagnose.
const LOW_LIKE =
  /(shak|trembl|cold sweat|sweating|dizz|light-?headed|palpitation|heart (is )?pounding|racing heart|badan ketar|ketar|menggigil|peluh sejuk|berpeluh|pening|berdebar|发抖|颤抖|手抖|冷汗|出汗|头晕|心慌|心悸)/i;
const HIGH_LIKE =
  /(numb|tingl|pins and needles|slow.?heal|wound|very thirsty|thirst|urinat|pee a lot|blurr|kebas|semut|luka lambat|lambat sembuh|haus|kencing kerap|kerap kencing|kabur|麻木|刺痛|伤口.*(慢|难)|口渴|口干|尿频|多尿|视力模糊|看不清)/i;
const WHY_HIGH = /((why|kenapa|mengapa|为什么|为何).*(high|naik|tinggi|高|升))/i;
const YESTERDAY = /(yesterday|semalam|昨天|昨日)/i;

export function isUrgent(text: string) {
  return (
    URGENT.test(text) || /^(shaking|sweating|menggigil|berpeluh|出汗|发抖)$/i.test(text.trim())
  );
}

export function requestsMedicationChange(text: string) {
  const medication =
    /\b(insulin|medicine|medication|metformin|pill|tablets?|dose|dosage|units?|inject)\b|ubat|dos|suntik|胰岛素|药|剂量|单位|注射/i;
  const change =
    /\b(adjust|increase|decrease|reduce|double|halve|stop|skip|change|take more|take less|how much|how many|should i take|can i take|inject)\b|ubah|tambah|kurang|henti|langkau|berapa|调整|增加|减少|停|漏服|多少|注射/i;
  return medication.test(text) && change.test(text);
}

export async function getCopilotResponse(
  question: string,
  data: AppData,
  now = new Date(),
  language: Language = "en",
): Promise<CopilotResponse> {
  const q = question.toLowerCase();

  if (URGENT.test(q)) {
    return {
      kind: "safety",
      demo: false,
      sources: [],
      doctorQuestion:
        "I had symptoms that needed urgent attention. What should I do if it happens again?",
      text: "These symptoms may need urgent attention. Please don't rely on this app. Call 999 or go to the nearest emergency department, or contact your clinic immediately. If you can safely check your glucose, do so and follow the plan your healthcare team gave you.",
    };
  }

  if (requestsMedicationChange(q)) {
    return {
      kind: "safety",
      demo: false,
      sources: [],
      text: "I cannot advise on changing medication doses. Please contact your doctor or clinic and follow your agreed treatment protocol.",
    };
  }

  data = {
    ...data,
    readings: data.readings.filter((r) => r.source === "user"),
    logs: data.logs.filter((l) => l.source === "user"),
  };
  const t = data.thresholds;
  const statedGlucose =
    /(?:glucose|glukosa|gula darah|血糖)\s*(?:is|adalah|为|是|:|=)?\s*(\d+(?:\.\d+)?)\s*mmol\/?l/i.exec(
      q,
    );
  if (
    statedGlucose &&
    (Number(statedGlucose[1]) < t.hypo || Number(statedGlucose[1]) >= t.severeHigh)
  )
    return {
      kind: "safety",
      demo: false,
      sources: [],
      text: "Your stated glucose may need prompt attention. Follow your healthcare team's safety plan and contact your clinic. If you feel very unwell, confused or unable to swallow, seek urgent medical help; call 999 in Malaysia. Do not wait for an AI answer.",
    };
  const sorted = [...data.readings].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (LOW_LIKE.test(q)) {
    const latest = sorted[0];
    const recent =
      latest && now.getTime() - new Date(latest.timestamp).getTime() <= 3 * 3600_000
        ? latest
        : undefined;
    const lines = [
      "Shaking, cold sweats, dizziness or a pounding heart can happen when glucose is low or high. This app cannot tell the cause.",
      "Please check your glucose now if you safely can.",
      recent
        ? `Your latest recorded reading is ${recent.value.toFixed(1)} mmol/L.`
        : "No glucose reading was recorded in the last 3 hours.",
    ];
    if (recent && recent.value < t.hypo)
      lines.push(
        "That reading is below your low threshold. Follow the low blood sugar steps on the Health page and your care team's plan.",
      );
    lines.push(
      "If you feel confused, faint, cannot swallow, or symptoms do not improve, call 999 or go to the nearest emergency department.",
    );
    return {
      kind: "safety",
      demo: false,
      sources: [],
      text: lines.join("\n\n"),
      doctorQuestion:
        "I sometimes feel shaky, sweaty or dizzy. What should I do when this happens?",
    };
  }

  if (HIGH_LIKE.test(q)) {
    const since = now.getTime() - 7 * 86400_000;
    const highs = data.readings.filter(
      (r) =>
        new Date(r.timestamp).getTime() >= since &&
        r.value > (r.context === "fasting" ? t.fastingHigh : t.postMealHigh),
    ).length;
    const lines = [
      "Numbness, tingling, slow-healing wounds, strong thirst, passing urine often or blurred vision are worth telling your doctor about. This app cannot diagnose the cause.",
      highs
        ? `Your records show ${highs} high readings in the last 7 days.`
        : "No high readings were recorded in the last 7 days.",
      "Please contact your clinic soon. If a wound looks infected, or you feel very unwell, vomit or are very drowsy, seek urgent care or call 999.",
    ];
    return {
      kind: "safety",
      demo: false,
      sources: [],
      text: lines.join("\n\n"),
      doctorQuestion:
        "I have noticed numbness, thirst, frequent urination, blurred vision or slow-healing wounds. Should these be checked?",
    };
  }

  const mealAnswer = mealCopilotAnswer(q, data, now, language);
  if (mealAnswer) return { kind: "personal", demo: false, sources: [], text: mealAnswer };
  if (/walk|walking|berjalan|步行|散步|activity|aktiviti|活动/.test(q))
    return {
      kind: "personal",
      demo: false,
      sources: [],
      text: renderRecordAnswer(
        { intent: /summar|ringkas|总结/.test(q) ? "summary" : "walking_week", mealIds: [] },
        data,
        now,
        language,
      ),
    };
  if (/after.*(lunch|meal)|selepas.*makan|午餐后|饭后/.test(q))
    return {
      kind: "personal",
      demo: false,
      sources: [],
      text: renderRecordAnswer({ intent: "meal_glucose", mealIds: [] }, data, now, language),
    };
  if (WHY_HIGH.test(q) || (YESTERDAY.test(q) && /(gula|sugar|glucose|血糖)/i.test(q))) {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const sameDay = (iso: string) => new Date(iso).toDateString() === y.toDateString();
    const yr = data.readings.filter((r) => sameDay(r.timestamp));
    const yl = data.logs.filter((l) => sameDay(l.timestamp));
    if (!yr.length) {
      return {
        kind: "personal",
        demo: true,
        sources: [],
        text: "No glucose readings were recorded yesterday, so there isn't enough information to explain yesterday's levels.\n\nTry logging readings before and after meals today.",
      };
    }
    const max = Math.max(...yr.map((r) => r.value));
    const lines = [
      `Yesterday you recorded ${yr.length} readings. The highest was ${max.toFixed(1)} mmol/L.`,
    ];
    lines.push(
      yl.length
        ? `Things you logged yesterday: ${yl.map((l) => l.title).join(", ")}.`
        : "No meals, activity or sleep were logged yesterday, so possible contributors are unknown.",
    );
    lines.push(
      "Readings can rise for many reasons, such as meals, less activity, stress, illness, poor sleep or medication timing. These records only show what happened around the same time; they don't prove the cause.",
    );
    return {
      kind: "personal",
      demo: true,
      sources: [],
      text: lines.join("\n\n"),
      doctorQuestion: "My glucose went up on some days. What could be causing it?",
    };
  }

  if (
    /trend|pattern|reading|morning|fasting|my glucose|trend glukosa|corak|bacaan|pagi|puasa|血糖|趋势|读数|空腹/.test(
      q,
    )
  ) {
    const findings = detectPatterns(data.readings, data.thresholds, now).filter(
      (f) => f.severity !== "info",
    );
    const b = fastingBaseline(data.readings, data.thresholds, now);
    const lines = findings.length
      ? findings.map((f) => `• ${f.title}: ${f.summary}`).join("\n")
      : "• No repeated out-of-range pattern was detected in the last 7 days.";
    return {
      kind: "personal",
      demo: true,
      sources: [],
      doctorQuestion:
        "My morning readings have been higher this past week — what could be contributing?",
      text: `Here's what your recorded data shows (based on the rule-based monitoring engine, not a diagnosis):\n\n${lines}\n\n${b.sufficient ? "" : "There isn't enough earlier data yet to compare with your usual levels.\n\n"}Recorded meals and activity can provide context, but cannot establish the cause of a glucose change. Your doctor can help interpret this.`,
    };
  }

  if (/doctor|ask|appointment|visit|doktor|lawatan|temujanji|医生|就诊|复诊/.test(q)) {
    return {
      kind: "personal",
      demo: true,
      sources: [],
      text: renderRecordAnswer({ intent: "doctor", mealIds: [] }, data, now, language),
    };
  }

  if (/meal|food|eat|malaysian|nasi|roti|makanan|makan|pilihan|饮食|食物|马来西亚|吃/.test(q)) {
    return {
      kind: "education",
      demo: true,
      sources: [],
      text: "Meal portions and recipes vary. Review your confirmed meal estimates and ask your healthcare team about choices that suit your care plan.",
    };
  }

  return {
    kind: "education",
    demo: true,
    sources: [],
    text: "I can review confirmed meals, logged activity and manual glucose records. I cannot diagnose conditions or recommend treatment changes.",
  };
}
