import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import en from "./locales/en.json";
import ms from "./locales/ms.json";
import zh from "./locales/zh.json";
import type { Lang } from "./types";

// Translation + preferences service. Resources: src/lib/locales/{en,ms,zh}.json.
// Missing keys fall back to English, then to the key itself (caught by the locale test).

type Dict = Record<string, unknown>;
export const DICTS: Record<Lang, Dict> = { en, ms, zh };
export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "ms", label: "Bahasa Melayu", short: "BM" },
  { code: "zh", label: "中文", short: "中文" },
];
const LOCALE_TAG: Record<Lang, string> = { en: "en-MY", ms: "ms-MY", zh: "zh-CN" };

export type Params = Record<string, string | number | undefined>;

export function lookup(d: Dict, key: string): unknown {
  return key.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Dict)[k] : undefined), d);
}

function interpolate(s: string, p?: Params) {
  return p ? s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(p[k] ?? "")) : s;
}

export function translate(lang: Lang, key: string, params?: Params): string {
  const v = lookup(DICTS[lang], key) ?? lookup(en, key);
  return typeof v === "string" ? interpolate(v, params) : key;
}

export function translateList(lang: Lang, key: string): string[] {
  const v = lookup(DICTS[lang], key) ?? lookup(en, key);
  return Array.isArray(v) ? (v as string[]) : [];
}

export function makeFormatters(lang: Lang) {
  const tag = LOCALE_TAG[lang];
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(tag, o);
  const dt = f({ weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const d = f({ weekday: "short", day: "numeric", month: "short" });
  const dm = f({ day: "numeric", month: "short" });
  const long = f({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const tm = f({ hour: "numeric", minute: "2-digit" });
  const wd = f({ weekday: "short" });
  const rel = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
  const toDate = (x: Date | string) => (typeof x === "string" ? new Date(x.length === 10 ? `${x}T00:00` : x) : x);
  return {
    dateTime: (x: Date | string) => dt.format(toDate(x)),
    date: (x: Date | string) => d.format(toDate(x)),
    dayMonth: (x: Date | string) => dm.format(toDate(x)),
    long: (x: Date | string) => long.format(toDate(x)),
    time: (x: Date | string) => tm.format(toDate(x)),
    hhmm: (hhmm: string) => tm.format(new Date(`2000-01-01T${hhmm}`)),
    weekday: (x: Date | string) => wd.format(toDate(x)),
    relative: (x: Date | string) => {
      const diff = (toDate(x).getTime() - Date.now()) / 1000;
      const abs = Math.abs(diff);
      if (abs < 3600) return rel.format(Math.round(diff / 60), "minute");
      if (abs < 86400) return rel.format(Math.round(diff / 3600), "hour");
      return rel.format(Math.round(diff / 86400), "day");
    },
    number: (n: number, digits = 1) => n.toLocaleString(tag, { minimumFractionDigits: digits, maximumFractionDigits: digits }),
  };
}

export type Formatters = ReturnType<typeof makeFormatters>;

interface Prefs {
  lang: Lang;
  setLang: (l: Lang) => void;
  elderly: boolean;
  setElderly: (on: boolean) => void;
  t: (key: string, params?: Params) => string;
  tl: (key: string) => string[];
  fmt: Formatters;
}

const PREFS_KEY = "diamonitor-prefs";
const Ctx = createContext<Prefs | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [elderly, setElderlyState] = useState(false);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as { lang?: Lang; elderly?: boolean };
      if (p.lang && p.lang in DICTS) setLangState(p.lang);
      if (p.elderly) setElderlyState(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
    document.documentElement.classList.toggle("elderly", elderly);
  }, [lang, elderly]);

  const persist = (p: { lang: Lang; elderly: boolean }) => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  };
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setElderlyState((e) => (persist({ lang: l, elderly: e }), e));
  }, []);
  const setElderly = useCallback((on: boolean) => {
    setElderlyState(on);
    setLangState((l) => (persist({ lang: l, elderly: on }), l));
  }, []);

  const value = useMemo<Prefs>(
    () => ({
      lang,
      setLang,
      elderly,
      setElderly,
      t: (k, p) => translate(lang, k, p),
      tl: (k) => translateList(lang, k),
      fmt: makeFormatters(lang),
    }),
    [lang, elderly, setLang, setElderly],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be inside PrefsProvider");
  return c;
}
