import { format } from "date-fns";
import type { AppData, GlucoseReading, Lang } from "./types";
import { detectPatterns, fastingBaseline, morningSummary } from "./patterns";
import { dosesForDate } from "./medications";
import { translate, translateList } from "./i18n";

// Isolated AI service layer. Currently returns DEMO responses in EN/BM/ZH (no AI or RAG backend connected).
// To go live: replace getCopilotResponse with a call to a server function that queries a vetted
// document index and a language model, passing `lang` so it answers in the selected language.

export type ResponseKind = "education" | "personal" | "safety";

export interface CopilotSource {
  title: string;
  url?: string;
}

export interface CopilotResponse {
  kind: ResponseKind;
  text: string;
  evidence: GlucoseReading[]; // actual records the answer refers to
  sources: CopilotSource[]; // only documents actually retrieved — always empty in demo mode
  demo: boolean;
}

const URGENT =
  /(chest pain|faint|unconscious|confus|can'?t breathe|breathless|vomit|seizure|very low|shaking|sweating|pengsan|sakit dada|sesak nafas|keliru|muntah|menggigil|berpeluh|tidak sedar|胸痛|昏倒|晕倒|昏迷|呼吸困难|意识不清|呕吐|抽搐|发抖|出冷汗)/i;

export function isUrgent(text: string) {
  return URGENT.test(text);
}

const has = (q: string, re: RegExp) => re.test(q);

export async function getCopilotResponse(question: string, data: AppData, lang: Lang, now = new Date()): Promise<CopilotResponse> {
  await new Promise((r) => setTimeout(r, 600));
  const t = (k: string, p?: Record<string, string | number>) => translate(lang, k, p);
  const q = question.toLowerCase();

  if (isUrgent(q)) return { kind: "safety", demo: false, sources: [], evidence: [], text: t("copilot.r.urgent") };

  if (has(q, /prescri|dose|dos |dos$|increase|reduce|stop taking|tukar dos|kurangkan|tambah dos|berhenti ambil|剂量|加药|减药|停药|换药/))
    return { kind: "safety", demo: true, sources: [], evidence: [], text: t("copilot.r.noPrescribe") };

  if (has(q, /trend|pattern|reading|morning|fasting|glucose|sugar|corak|bacaan|pagi|puasa|glukosa|gula|趋势|血糖|空腹|早上|读数|规律/)) {
    const findings = detectPatterns(data.readings, data.thresholds, now).filter((f) => f.severity !== "info");
    const b = fastingBaseline(data.readings, data.thresholds, now);
    const m = morningSummary(data.readings, data.thresholds, now);
    const lines = findings.length
      ? findings.map((f) => `• ${t(`patterns.${f.id}.title`, f.params)} — ${t(`patterns.${f.id}.summary`, f.params)}`).join("\n")
      : `• ${t("copilot.r.noPattern")}`;
    const text = [
      t("copilot.r.trendIntro"),
      lines,
      m.total ? t("copilot.r.morning", { above: m.above, total: m.total, high: m.threshold }) : "",
      b.sufficient ? "" : t("copilot.r.noBaseline"),
      t("copilot.r.trendOutro"),
    ]
      .filter(Boolean)
      .join("\n\n");
    const evidence = findings.flatMap((f) => f.evidence);
    return { kind: "personal", demo: true, sources: [], evidence: evidence.length ? dedupe(evidence) : m.evidence, text };
  }

  if (has(q, /medic|metformin|pill|reminder|ubat|peringatan|药|提醒/)) {
    const today = format(now, "yyyy-MM-dd");
    const doses = dosesForDate(data.medications, data.medEvents, today, now);
    const list = doses.length
      ? doses.map((d) => `• ${d.schedule.name} ${d.schedule.dose} ${d.schedule.unit} — ${d.time} · ${t(`med.status.${d.status}`)}`).join("\n")
      : `• ${t("copilot.r.noMeds")}`;
    return { kind: "personal", demo: true, sources: [], evidence: [], text: `${t("copilot.r.medIntro")}\n\n${list}\n\n${t("copilot.r.medOutro")}` };
  }

  if (has(q, /doctor|ask|appointment|visit|doktor|tanya|temujanji|lawatan|医生|问诊|复诊|问什么/))
    return { kind: "personal", demo: true, sources: [], evidence: [], text: `${t("copilot.r.doctorIntro")}\n\n${translateList(lang, "copilot.r.doctorQs").map((x) => `• ${x}`).join("\n")}\n\n${t("copilot.r.doctorOutro")}` };

  if (has(q, /goal|care plan|check-in|matlamat|pelan|目标|护理计划|打卡/)) {
    const g = data.goals.filter((x) => !x.completedAt);
    return { kind: "personal", demo: true, sources: [], evidence: [], text: `${t("copilot.r.goalIntro")}\n\n${g.map((x) => `• ${x.description} (${x.creatorName})`).join("\n") || "—"}\n\n${t("copilot.r.goalOutro")}` };
  }

  if (has(q, /meal|food|eat|malaysian|nasi|roti|makan|makanan|饮食|吃|食物|餐/))
    return { kind: "education", demo: true, sources: [], evidence: [], text: `${t("copilot.r.mealIntro")}\n\n${translateList(lang, "copilot.r.mealTips").map((x) => `• ${x}`).join("\n")}\n\n${t("copilot.r.mealOutro")}` };

  if (has(q, /hba1c|a1c|what is|apa itu|maksud|是什么|什么是|term|istilah/))
    return { kind: "education", demo: true, sources: [], evidence: [], text: t("copilot.r.terms") };

  return { kind: "education", demo: true, sources: [], evidence: [], text: t("copilot.r.fallback") };
}

function dedupe(rs: GlucoseReading[]) {
  const seen = new Set<string>();
  return rs.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true))).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
