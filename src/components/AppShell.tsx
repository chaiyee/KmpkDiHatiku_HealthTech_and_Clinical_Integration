import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, CalendarCheck, HeartPulse, LayoutDashboard, MessageCircleQuestion, Stethoscope } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { LANGS, useI18n } from "@/lib/i18n";
import { detectPatterns } from "@/lib/patterns";
import { dueReminders } from "@/lib/medications";
import { browserNotify } from "@/lib/notifications";
import type { Lang } from "@/lib/types";
import { BrandMark } from "./BrandMark";
import { SettingsSheet } from "./SettingsSheet";

const NAV = [
  { to: "/", key: "nav.overview", icon: LayoutDashboard },
  { to: "/health", key: "nav.health", icon: HeartPulse },
  { to: "/copilot", key: "nav.copilot", icon: MessageCircleQuestion },
  { to: "/doctor", key: "nav.doctor", icon: Stethoscope },
  { to: "/care-plan", key: "nav.carePlan", icon: CalendarCheck },
] as const;

/** In-app medication reminders while the app is open (no background delivery). */
function ReminderWatcher() {
  const { data } = useStore();
  const { t, fmt } = useI18n();
  const shown = useRef(new Set<string>());
  const ref = useRef(data);
  ref.current = data;
  useEffect(() => {
    const check = () => {
      const d = ref.current;
      if (!d) return;
      for (const dose of dueReminders(d.medications, d.medEvents, new Date())) {
        const k = `${dose.key}|${dose.event?.id ?? ""}`;
        if (shown.current.has(k)) continue;
        shown.current.add(k);
        const body = t("med.notifyBody", { name: `${dose.schedule.name} ${dose.schedule.dose} ${dose.schedule.unit}`, time: fmt.hhmm(dose.time) });
        toast(t("med.reminder"), { description: body, duration: 15000, action: { label: t("med.open"), onClick: () => (window.location.href = "/care-plan?tab=medication") } });
        browserNotify(t("med.reminder"), body);
      }
    };
    const first = setTimeout(check, 1500);
    const id = setInterval(check, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [t, fmt]);
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useStore();
  const { t, lang, setLang, elderly } = useI18n();
  const findings = data ? detectPatterns(data.readings, data.thresholds).filter((f) => f.severity !== "info") : [];
  const newAlerts = data?.caregiverAlerts.filter((a) => a.status === "new").length ?? 0;
  const initials = data?.patient.name.split(" ").map((p) => p[0]).join("") ?? "";

  return (
    <div className="min-h-dvh md:flex">
      <ReminderWatcher />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-background focus:p-2">
        {t("common.skipToContent")}
      </a>
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r bg-sidebar md:sticky md:top-0 md:flex md:h-dvh">
        <div className="flex items-center gap-2 px-5 py-6">
          <BrandMark />
          <div>
            <p className="font-semibold leading-tight text-navy">DiaMonitor</p>
            <p className="text-xs text-muted-foreground">Copilot</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label={t("nav.main")}>
          {NAV.map(({ to, key, icon: Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors ${
                  active ? "bg-sidebar-accent text-primary" : "text-sidebar-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0">{t(key)}</span>
              </Link>
            );
          })}
        </nav>
        {data && (
          <div className="m-3 rounded-xl border p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-semibold text-navy-foreground">{initials}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{data.patient.name}</p>
                <p className="text-xs text-muted-foreground">{t("common.fictionalPatient")}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex items-center justify-between gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <BrandMark />
            <span className="font-semibold text-navy">DiaMonitor</span>
          </div>
          <p className="hidden text-sm text-muted-foreground md:block">{t("common.demoBanner")}</p>
          <div className="flex items-center gap-2">
            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger className="h-10 w-[92px] sm:w-[150px]" aria-label={t("settings.language")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGS.map((l) => (
                  <SelectItem key={l.code} value={l.code} lang={l.code}>
                    <span className="sm:hidden">{l.short}</span>
                    <span className="hidden sm:inline">{l.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-10 w-10" aria-label={t("notif.title")}>
                  <Bell className="h-5 w-5" />
                  {findings.length + newAlerts > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning text-[11px] font-semibold text-primary-foreground">
                      {findings.length + newAlerts}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <p className="mb-2 text-sm font-semibold">{t("notif.title")}</p>
                {findings.length === 0 && newAlerts === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("notif.empty")}</p>
                ) : (
                  <ul className="space-y-2">
                    {findings.map((f) => (
                      <li key={f.id} className="rounded-md bg-muted p-2 text-sm">{t(`patterns.${f.id}.title`, f.params)}</li>
                    ))}
                    {newAlerts > 0 && <li className="rounded-md bg-accent p-2 text-sm">{t("notif.caregiverAlerts", { n: newAlerts })}</li>}
                  </ul>
                )}
                <div className="mt-3 flex flex-col gap-1">
                  <Link to="/health" search={{ tab: "patterns" }} className="text-sm font-medium text-primary">{t("notif.viewPatterns")} →</Link>
                  <Link to="/care-plan" search={{ tab: "caregiver" }} className="text-sm font-medium text-primary">{t("notif.viewCaregiver")} →</Link>
                </div>
              </PopoverContent>
            </Popover>
            <SettingsSheet />
          </div>
        </header>
        <main id="main" className="print-full mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10">{children}</main>
      </div>

      <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background md:hidden" aria-label={t("nav.main")}>
        {NAV.map(({ to, key, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 text-center font-medium leading-tight ${elderly ? "text-[12px]" : "text-[11px]"} ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="line-clamp-2">{t(`${key}Short`)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
