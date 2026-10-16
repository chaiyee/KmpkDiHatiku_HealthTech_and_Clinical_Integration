import { useLanguage } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BookOpen, LineChart, SendHorizontal, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BrandMark } from "@/components/BrandMark";
import { PageHeader, PageLoading } from "@/components/common";
import { useStore } from "@/lib/store";
import { getCopilotResponse, type CopilotResponse } from "@/lib/copilot-service";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/copilot")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "AI Copilot · DiaMonitor Copilot" },
      {
        name: "description",
        content:
          "Ask questions about diabetes and your own recorded glucose trends (demo assistant).",
      },
      { property: "og:title", content: "AI Copilot · DiaMonitor Copilot" },
      {
        property: "og:description",
        content:
          "Ask questions about diabetes and your own recorded glucose trends (demo assistant).",
      },
    ],
  }),
  component: CopilotPage,
});

type Msg = {
  id: number;
  role: "user" | "assistant";
  text: string;
  meta?: CopilotResponse;
  error?: boolean;
};

const SUGGESTIONS = [
  "Can you explain my recent glucose trend?",
  "What should I ask my doctor?",
  "How many carbohydrates did I eat today?",
  "Which meals had the most estimated carbohydrates?",
];

function CopilotPage() {
  const { t: tr, format, language } = useLanguage();
  const { data, userEmail, syncState } = useStore();
  const [configured, setConfigured] = useState(false);
  const [consent, setConsent] = useState(false);
  const [liveStatus, setLiveStatus] = useState("");
  const requestGeneration = useRef(0);
  useEffect(() => {
    let active = true;
    fetch("/api/copilot")
      .then((r) => r.json())
      .then((result) => {
        if (active) setConfigured(result.configured === true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const accountGeneration = ++requestGeneration.current;
    setConsent(false);
    setMessages([]);
    setLoading(false);
    return () => {
      requestGeneration.current = accountGeneration + 1;
    };
  }, [userEmail]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
    if (!loading) inputRef.current?.focus();
  }, [messages, loading]);

  if (!data) return <PageLoading />;

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading || !data) return;
    const generation = requestGeneration.current;
    setMessages((m) => [...m, { id: Date.now(), role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      let res = await getCopilotResponse(q, data, new Date(), language);
      if (generation !== requestGeneration.current) return;
      if (res.kind !== "safety" && consent && configured && userEmail && syncState === "saved") {
        try {
          const { data: session } = await supabase.auth.getSession();
          if (generation !== requestGeneration.current || session.session?.user.email !== userEmail)
            return;
          const reply = await fetch("/api/copilot", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.session?.access_token ?? ""}`,
            },
            body: JSON.stringify({
              question: q,
              consent: true,
              language,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }),
          });
          if (!reply.ok) throw new Error();
          const result = await reply.json();
          if (generation !== requestGeneration.current) return;
          if (
            typeof result.response?.text !== "string" ||
            !["personal", "safety"].includes(result.response.kind)
          )
            throw new Error();
          res = result.response;
          setLiveStatus("AI-assisted record review. Numbers come from your saved records.");
        } catch {
          if (generation !== requestGeneration.current) return;
          setLiveStatus("Online AI is unavailable. Showing a local record summary.");
        }
      } else setLiveStatus("Local record review. No records sent to an AI provider.");
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: "assistant", text: res.text, meta: res },
      ]);
    } catch {
      if (generation !== requestGeneration.current) return;
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Sorry, something went wrong. Please try again.",
          error: true,
        },
      ]);
    } finally {
      if (generation === requestGeneration.current) setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <PageHeader
        title={tr("AI Copilot")}
        subtitle={tr("Diabetes education and help understanding your records.")}
      />
      <div className="mb-5 rounded-xl border bg-secondary p-4 text-sm">
        <p className="font-semibold">
          {tr(
            configured ? "Record-focused Copilot" : "Local record review · online AI unavailable",
          )}
        </p>
        <p className="mt-1">
          {tr(
            "Supports record review, not diagnosis or treatment changes. Seek medical help for urgent symptoms.",
          )}
        </p>
        {configured && (
          <label className="mt-3 flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={consent}
              disabled={!userEmail || syncState !== "saved"}
              onChange={(e) => setConsent(e.target.checked)}
            />
            {tr(
              "Use online AI for this session: send my question and limited saved meal, glucose and activity records to OpenAI. Names, clinic details and notes are excluded. Avoid identifying details in questions. Sign in and finish syncing first.",
            )}
          </label>
        )}
        <p className="mt-2" role="status">
          {tr(liveStatus)}
        </p>
      </div>

      <Card className="flex min-h-[460px] flex-col">
        <CardContent
          className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6"
          role="log"
          aria-label={tr("Conversation")}
          aria-live="polite"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-7 text-center">
              <BrandMark />
              <p className="mt-3 text-lg font-semibold text-navy">{tr("How can I help today?")}</p>
              <p className="mt-1 max-w-md text-muted-foreground">
                {tr("Try one of these questions to get started.")}
              </p>
              <div className="mt-5 flex w-full max-w-xl flex-col gap-3">
                {SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    className="h-auto min-h-12 justify-start whitespace-normal py-3 text-left text-[15px]"
                    onClick={() => send(tr(s))}
                  >
                    {tr(s)}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-navy px-4 py-3 text-[15px] text-navy-foreground">
                  {m.text}
                </div>
              </div>
            ) : (
              <AssistantMessage key={m.id} m={m} />
            ),
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
              </span>
              {tr("Reviewing your records…")}
            </div>
          )}
          <div ref={endRef} />
        </CardContent>
        <form
          className="flex items-end gap-3 border-t bg-muted/30 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={tr("Type your question…")}
            aria-label={tr("Your question")}
            rows={2}
            className="min-h-12 resize-none text-[15px]"
          />
          <Button
            type="submit"
            size="icon"
            className="h-auto min-h-12 w-12 shrink-0 sm:w-auto sm:px-5"
            disabled={!input.trim() || loading}
            aria-label={tr("Send")}
          >
            <SendHorizontal className="h-5 w-5" />
            <span className="hidden sm:inline">{tr("Send")}</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}

function AssistantMessage({ m }: { m: Msg }) {
  const { t: tr, format } = useLanguage();
  const kind = m.meta?.kind;
  const label =
    kind === "safety"
      ? { Icon: ShieldAlert, text: tr("Safety message"), cls: "bg-danger-soft text-destructive" }
      : kind === "personal"
        ? { Icon: LineChart, text: tr("Based on your records"), cls: "bg-accent text-primary" }
        : { Icon: BookOpen, text: tr("General diabetes education"), cls: "bg-secondary text-navy" };
  return (
    <div className="max-w-[92%] space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {!m.error && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${label.cls}`}
          >
            <label.Icon className="h-3.5 w-3.5" /> {tr(label.text)}
          </span>
        )}
        {m.meta?.demo && (
          <span className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
            {tr("Limited guidance")}
          </span>
        )}
      </div>
      <p
        className={`whitespace-pre-line text-[15px] leading-relaxed ${m.error ? "text-destructive" : ""}`}
      >
        {tr(m.text)}
      </p>
      {m.meta?.doctorQuestion && <PinButton text={m.meta.doctorQuestion} />}
      {kind === "education" && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
          <p className="font-medium">{tr("Sources")}</p>
          {m.meta?.sources.length ? (
            <ul className="mt-1 list-disc pl-5">
              {m.meta?.sources.map((s) => (
                <li key={s.title}>{s.title}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-muted-foreground">
              {tr(
                "This answer has not been checked against medical references. Confirm guidance with your healthcare team.",
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PinButton({ text }: { text: string }) {
  const { t: tr } = useLanguage();
  const { data, pinQuestion } = useStore();
  const pinned = (data?.pinnedQuestions ?? []).some((q) => q.text === text);
  return (
    <div className="rounded-lg border border-dashed p-3 text-sm">
      <p className="mb-2">{tr(text)}</p>
      <Button
        variant={pinned ? "secondary" : "outline"}
        className="min-h-11"
        disabled={pinned}
        onClick={() => {
          pinQuestion(text);
          toast.success(tr("Added to your Doctor Visit questions."));
        }}
      >
        {pinned ? tr("Added to Doctor Visit questions") : tr("Add to Doctor Visit Questions")}
      </Button>
    </div>
  );
}
