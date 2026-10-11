import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, CalendarCheck, HeartPulse, LayoutDashboard, MessageCircleQuestion, Stethoscope } from "lucide-react";
import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { detectPatterns } from "@/lib/patterns";
import { BrandMark } from "./BrandMark";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/health", label: "My Health", icon: HeartPulse },
  { to: "/copilot", label: "AI Copilot", icon: MessageCircleQuestion },
  { to: "/doctor", label: "Doctor Visit", icon: Stethoscope },
  { to: "/care-plan", label: "My Care Plan", icon: CalendarCheck },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data, resetDemo } = useStore();
  const findings = data ? detectPatterns(data.readings, data.thresholds).filter((f) => f.severity !== "info") : [];
  const initials = data?.patient.name.split(" ").map((p) => p[0]).join("") ?? "";

  return (
    <div className="min-h-screen md:flex">
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex md:sticky md:top-0 md:h-screen">
        <div className="flex items-center gap-2 px-5 py-6">
          <BrandMark />
          <div>
            <p className="font-semibold leading-tight text-navy">DiaMonitor</p>
            <p className="text-xs text-muted-foreground">Copilot</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors ${
                  active ? "bg-sidebar-accent text-primary" : "text-sidebar-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
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
                <p className="text-xs text-muted-foreground">Fictional demo patient</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-2 w-full text-xs" onClick={resetDemo}>
              Reset demo data
            </Button>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <BrandMark />
            <span className="font-semibold text-navy">DiaMonitor</span>
          </div>
          <p className="hidden text-sm text-muted-foreground md:block">
            Demonstration prototype · all patient data is fictional
          </p>
          <div className="flex items-center gap-2">
            <Select defaultValue="en">
              <SelectTrigger className="h-10 w-[130px]" aria-label="Language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ms" disabled>Bahasa Melayu (soon)</SelectItem>
                <SelectItem value="zh" disabled>中文 (soon)</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-10 w-10" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {findings.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning text-[11px] font-semibold text-primary-foreground">
                      {findings.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <p className="mb-2 text-sm font-semibold">Notifications</p>
                {findings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing new.</p>
                ) : (
                  <ul className="space-y-2">
                    {findings.map((f) => (
                      <li key={f.id} className="rounded-md bg-muted p-2 text-sm">
                        {f.title}
                      </li>
                    ))}
                  </ul>
                )}
                <Link to="/health" search={{ tab: "patterns" }} className="mt-3 block text-sm font-medium text-primary">
                  View patterns →
                </Link>
              </PopoverContent>
            </Popover>
          </div>
        </header>
        <main className="print-full mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10">{children}</main>
      </div>

      <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
