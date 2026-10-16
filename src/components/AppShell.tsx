import { useLanguage, type Language } from "@/lib/i18n";
import { RecordNotices } from "./RecordNotices";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarCheck,
  HeartPulse,
  LayoutDashboard,
  MessageCircleQuestion,
  Stethoscope,
} from "lucide-react";
import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { SCENARIO_LABELS, type DemoScenario } from "@/lib/sample-data";
import { supabase } from "@/integrations/supabase/client";
import { detectPatterns } from "@/lib/patterns";
import { BrandMark } from "./BrandMark";
import { MedicationNotice } from "./MedicationNotice";
import { MealReminderNotice } from "./MealCompanion";

const NAV = [
  {
    to: "/",
    label: "Overview",
    short: "Home",
    description: "Your day at a glance",
    icon: LayoutDashboard,
  },
  {
    to: "/health",
    label: "My Health",
    short: "Health",
    description: "Readings, logs and trends",
    icon: HeartPulse,
  },
  {
    to: "/copilot",
    label: "AI Copilot",
    short: "Copilot",
    description: "Understand your records",
    icon: MessageCircleQuestion,
  },
  {
    to: "/doctor",
    label: "Doctor Visit",
    short: "Visit",
    description: "Prepare for your appointment",
    icon: Stethoscope,
  },
  {
    to: "/care-plan",
    label: "My Care Plan",
    short: "Plan",
    description: "Medication and daily check-in",
    icon: CalendarCheck,
  },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t: tr, format, formatDistanceToNow, language, setLanguage } = useLanguage();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data, resetDemo, loadScenario, userEmail, syncState } = useStore();
  const findings = data
    ? detectPatterns(data.readings, data.thresholds).filter((f) => f.severity !== "info")
    : [];
  const initials =
    data?.patient.name
      .split(" ")
      .map((p) => p[0])
      .join("") ?? "";

  return (
    <div className="min-h-screen lg:flex">
      <a className="skip-link" href="#main-content">
        {tr("Skip to main content")}
      </a>
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r bg-sidebar lg:flex lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center gap-2 px-5 py-6">
          <BrandMark />
          <div>
            <p className="font-semibold leading-tight text-navy">DiaMonitor</p>
            <p className="text-xs text-muted-foreground">{tr("Copilot")}</p>
          </div>
        </div>
        <nav aria-label={tr("Main navigation")} className="flex-1 space-y-2 px-3">
          {NAV.map(({ to, label, description, icon: Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>
                  <span className="block">{tr(label)}</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {tr(description)}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
        {data && (
          <div className="m-3 rounded-xl border p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-semibold text-navy-foreground">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{data.patient.name}</p>
                <p className="text-xs text-muted-foreground">{tr("Fictional demo patient")}</p>
              </div>
            </div>
            <details className="mt-3 border-t pt-2">
              <summary className="min-h-11 cursor-pointer py-2 text-xs font-medium text-muted-foreground">
                {tr("Demo tools")}
              </summary>
              <div className="mt-2">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {tr("Demo scenario")}
                </p>
                <Select
                  onValueChange={(v) => {
                    loadScenario(v as DemoScenario);
                    toast.success(
                      tr("Scenario loaded: {name}", {
                        name: tr(SCENARIO_LABELS[v as DemoScenario]),
                      }),
                    );
                  }}
                >
                  <SelectTrigger className="h-11 w-full text-xs" aria-label={tr("Demo scenario")}>
                    <SelectValue placeholder={tr("Choose a scenario")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SCENARIO_LABELS) as DemoScenario[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {tr(SCENARIO_LABELS[key])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="sm" className="mt-2 w-full text-xs" onClick={resetDemo}>
                {tr("Reset demo data")}
              </Button>
            </details>
            <div className="mt-2 border-t pt-2 text-xs">
              {userEmail ? (
                <>
                  <p className="truncate text-muted-foreground">{userEmail}</p>
                  <p className="text-muted-foreground">
                    {syncState === "error"
                      ? tr("Not saved to account")
                      : syncState === "syncing"
                        ? tr("Saving…")
                        : tr("Saved to your account")}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 w-full text-xs"
                    onClick={() => supabase.auth.signOut()}
                  >
                    {tr("Sign out")}
                  </Button>
                </>
              ) : (
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link to="/auth">{tr("Sign in to save online")}</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <BrandMark />
            <span className="sr-only font-semibold text-navy min-[440px]:not-sr-only">
              DiaMonitor
            </span>
          </div>
          <p className="hidden text-sm text-muted-foreground lg:block">
            {tr("Demo workspace · sample and simulated data")}
          </p>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 lg:hidden"
                  aria-label={tr("Demo scenario")}
                >
                  <LayoutDashboard className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64">
                <p className="mb-2 text-sm font-semibold">{tr("Demo scenario")}</p>
                <Select
                  onValueChange={(v) => {
                    loadScenario(v as DemoScenario);
                    toast.success(
                      tr("Scenario loaded: {name}", {
                        name: tr(SCENARIO_LABELS[v as DemoScenario]),
                      }),
                    );
                  }}
                >
                  <SelectTrigger className="h-11 w-full text-sm" aria-label={tr("Demo scenario")}>
                    <SelectValue placeholder={tr("Choose a scenario")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SCENARIO_LABELS) as DemoScenario[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {tr(SCENARIO_LABELS[key])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-xs"
                  onClick={resetDemo}
                >
                  {tr("Reset demo data")}
                </Button>
              </PopoverContent>
            </Popover>
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger className="h-11 w-[112px] sm:w-[145px]" aria-label={tr("Language")}>
                <SelectValue>
                  {language === "en" ? "English (EN)" : language === "ms" ? "BM" : "中文"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English (EN)</SelectItem>
                <SelectItem value="ms">Bahasa Melayu (BM)</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-11 w-11"
                  aria-label={tr("Notifications")}
                >
                  <Bell className="h-5 w-5" />
                  {findings.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning text-[11px] font-semibold text-primary-foreground">
                      {findings.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <p className="mb-2 text-sm font-semibold">{tr("Notifications")}</p>
                {findings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{tr("Nothing new.")}</p>
                ) : (
                  <ul className="space-y-2">
                    {findings.map((f) => (
                      <li key={f.id} className="rounded-md bg-muted p-2 text-sm">
                        {tr(f.title)}
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  to="/health"
                  search={{ tab: "patterns" }}
                  className="mt-3 block text-sm font-medium text-primary"
                >
                  {tr("View patterns →")}
                </Link>
              </PopoverContent>
            </Popover>
          </div>
        </header>
        <MedicationNotice />
        <MealReminderNotice />
        <RecordNotices />
        <main
          key={userEmail ?? "guest"}
          id="main-content"
          tabIndex={-1}
          className="print-full mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-5 sm:px-6 lg:px-8 lg:pb-10"
        >
          {children}
        </main>
      </div>

      <nav
        aria-label={tr("Main navigation")}
        className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] shadow-sm lg:hidden"
      >
        {NAV.map(({ to, short, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-20 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[14px] leading-snug font-medium [overflow-wrap:anywhere] ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {tr(short)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
