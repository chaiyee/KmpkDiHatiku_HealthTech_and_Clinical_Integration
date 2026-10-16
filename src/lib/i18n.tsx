import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  format as dateFormat,
  formatDistanceToNow as distance,
  type FormatOptions,
} from "date-fns";
import { enGB, ms, zhCN } from "date-fns/locale";
import { translations } from "./translations";

export type Language = "en" | "ms" | "zh";
export const LANGUAGE_KEY = "diamonitor-language";
const locales = { en: enGB, ms, zh: zhCN };
const patterns = Object.entries(translations)
  .filter(([key]) => key.includes("{"))
  .map(([key, values]) => {
    const names: string[] = [];
    const source = key
      .split(/(\{\w+\})/)
      .map((part) => {
        if (part.startsWith("{")) {
          names.push(part.slice(1, -1));
          return "(.*?)";
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("");
    return { expression: new RegExp(`^${source}$`), names, values };
  });

export function translate(
  text: string,
  language: Language,
  values?: Record<string, string | number>,
): string {
  if (values) {
    const template = language === "en" ? text : (translations[text]?.[language] ?? text);
    return template.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
  }
  if (language === "en") return text;
  const exact = translations[text]?.[language];
  if (exact) return exact;
  if (text.includes("\n"))
    return text
      .split("\n")
      .map((line) => translate(line, language))
      .join("\n");
  if (text.startsWith("• ") && text.includes(": ")) {
    const index = text.indexOf(": ");
    return `• ${translate(text.slice(2, index), language)}: ${translate(text.slice(index + 2), language)}`;
  }
  for (const pattern of patterns) {
    const match = text.match(pattern.expression);
    if (match)
      return pattern.values[language].replace(
        /\{(\w+)\}/g,
        (_, name: string) => match[pattern.names.indexOf(name) + 1] ?? "",
      );
  }
  if (text.includes(" (fictional)"))
    return text.replace(" (fictional)", translations[" (fictional)"]?.[language] ?? " (fictional)");
  return text;
}

function makeLanguage(language: Language, setLanguage: (language: Language) => void) {
  return {
    language,
    setLanguage,
    t: (text: string, values?: Record<string, string | number>) =>
      translate(text, language, values),
    format: (date: Date | number, pattern: string, options?: FormatOptions) =>
      Number.isFinite(+date)
        ? dateFormat(date, pattern, { ...options, locale: locales[language] })
        : translate("Not entered", language),
    formatDistanceToNow: (date: Date | number, options?: Parameters<typeof distance>[1]) =>
      distance(date, { ...options, locale: locales[language] }),
  };
}
const LanguageContext = createContext(makeLanguage("en", () => {}));
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      if (saved === "en" || saved === "ms" || saved === "zh") setLanguage(saved);
    } catch {
      /* Browser storage may be unavailable. */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-Hans" : language;
  }, [language]);
  const change = (value: Language) => {
    setLanguage(value);
    try {
      localStorage.setItem(LANGUAGE_KEY, value);
    } catch {
      /* Keep the interface usable. */
    }
  };
  return (
    <LanguageContext.Provider value={makeLanguage(language, change)}>
      {children}
    </LanguageContext.Provider>
  );
}
export const useLanguage = () => useContext(LanguageContext);
