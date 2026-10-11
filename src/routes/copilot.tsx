import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BookOpen, LineChart, SendHorizontal, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BrandMark } from "@/components/BrandMark";
import { EvidenceTable, PageHeader, PageLoading } from "@/components/common";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { getCopilotResponse, type CopilotResponse } from "@/lib/copilot-service";

export const Route = createFileRoute("/copilot")({
  head: () => ({
    meta: [
      { title: "AI Copilot · DiaMonitor Copilot" },
      { name: "description", content: "Ask about diabetes, Malaysian meals, medication reminders and your own recorded glucose trends — demo assistant in EN, BM and 中文." },
      { property: "og:title", content: "AI Copilot · DiaMonitor Copilot" },
      { property: "og:description", content: "Ask about diabetes and your own recorded glucose trends (demo assistant)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CopilotPage,
});

type Msg = { id: number; role: "user" | "assistant"; text: string; meta?: CopilotResponse; error?: boolean };

function CopilotPage() {
  const { data } = useStore();
  const { t, tl, lang } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareRecords, setShareRecords] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (!loading && messages.length) inputRef.current?.focus();
  }, [messages, loading]);

  if (!data) return <PageLoading />;

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    if (q.length > 1000) return;
    setMessages((m) => [...m, { id: Date.now(), role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      // When record sharing is off, the assistant only sees an empty record set.
      const ctx = shareRecords ? data! : { ...data!, readings: [], medEvents: [], medications: [], goals: [] };
      const res = await getCopilotResponse(q, ctx, lang);
      setMessages((m) => [...m, { id: Date.now() + 1, role: "assistant", text: res.text, meta: res }]);
    } catch {
      setMessages((m) => [...m, { id: Date.now() + 1, role: "assistant", text: t("common.error"), error: true }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={t("nav.copilot")} subtitle={t("copilot.subtitle")} />
      <div className="mb-4 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm">
        <p className="font-semibold">{t("copilot.demoTitle")}</p>
        <p className="mt-1">{t("copilot.demoBody")}</p>
      </div>
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-5 w-5 accent-[var(--color-primary)]" checked={shareRecords} onChange={(e) => setShareRecords(e.target.checked)} />
        {t("copilot.shareRecords")}
      </label>

      <Card className="flex min-h-[420px] flex-col">
        <CardContent className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <BrandMark />
              <p className="mt-3 text-lg font-semibold text-navy">{t("copilot.empty")}</p>
              <p className="mt-1 max-w-md text-muted-foreground">{t("copilot.tryOne")}</p>
              <div className="mt-5 flex w-full max-w-lg flex-col gap-2">
                {tl("copilot.suggestions").map((s) => (
                  <Button key={s} variant="outline" className="h-auto min-h-12 justify-start whitespace-normal py-3 text-left text-[15px]" onClick={() => send(s)}>{s}</Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-navy px-4 py-3 text-[15px] text-navy-foreground">{m.text}</div>
              </div>
            ) : (
              <AssistantMessage key={m.id} m={m} />
            ),
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <span className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
              </span>
              {t("copilot.loading")}
            </div>
          )}
          <div ref={endRef} />
        </CardContent>
        <form className="flex items-end gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <Textarea
            ref={inputRef}
            value={input}
            maxLength={1000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={t("copilot.placeholder")}
            aria-label={t("copilot.placeholder")}
            rows={1}
            className="min-h-12 resize-none text-[15px]"
          />
          <Button type="submit" size="icon" className="h-12 w-12 shrink-0" disabled={!input.trim() || loading} aria-label={t("copilot.send")}>
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </form>
      </Card>
    </div>
  );
}

function AssistantMessage({ m }: { m: Msg }) {
  const { t } = useI18n();
  const { data } = useStore();
  const kind = m.meta?.kind;
  const label =
    kind === "safety"
      ? { Icon: ShieldAlert, text: t("copilot.kind.safety"), cls: "bg-danger-soft text-destructive" }
      : kind === "personal"
        ? { Icon: LineChart, text: t("copilot.kind.personal"), cls: "bg-accent text-primary" }
        : { Icon: BookOpen, text: t("copilot.kind.education"), cls: "bg-secondary text-navy" };
  return (
    <div className="max-w-[92%] space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {!m.error && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${label.cls}`}>
            <label.Icon className="h-3.5 w-3.5" /> {label.text}
          </span>
        )}
        {m.meta?.demo && <span className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground">{t("copilot.demoResponse")}</span>}
      </div>
      <p className={`whitespace-pre-line text-[15px] leading-relaxed ${m.error ? "text-destructive" : ""}`}>{m.text}</p>
      {m.meta && m.meta.evidence.length > 0 && data && (
        <details className="rounded-lg border bg-muted/40 p-3 text-sm" open>
          <summary className="cursor-pointer font-medium">{t("copilot.supporting", { n: m.meta.evidence.length })}</summary>
          <div className="mt-2"><EvidenceTable readings={m.meta.evidence} t={data.thresholds} /></div>
        </details>
      )}
      {kind === "education" && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
          <p className="font-medium">{t("copilot.sources")}</p>
          {m.meta!.sources.length ? (
            <ul className="mt-1 list-disc pl-5">{m.meta!.sources.map((s) => <li key={s.title}>{s.title}</li>)}</ul>
          ) : (
            <p className="mt-1 text-muted-foreground">{t("copilot.noSources")}</p>
          )}
        </div>
      )}
    </div>
  );
}
