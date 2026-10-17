import { Link, useRouterState } from "@tanstack/react-router";
import { Pill } from "lucide-react";
import { useClock } from "@/hooks/use-clock";
import { useLanguage } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { reminderFor } from "@/lib/medications";

export function MedicationNotice() {
  const { data } = useStore();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { t } = useLanguage();
  const now = useClock();
  const due = (data?.medicationSchedules ?? []).filter(
    (s) => reminderFor(s, data?.medicationStatuses ?? [], now)?.due,
  );
  if (!due.length || path === "/care-plan" || path === "/") return null;
  return (
    <div
      role="status"
      className="no-print flex flex-wrap items-center justify-between gap-3 border-b bg-secondary px-4 py-3 text-sm md:px-8"
    >
      <div className="flex min-w-0 items-start gap-2">
        <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          <span className="font-semibold">{t("Medication reminder due")}: </span>
          {due.map((s) => s.name).join(", ")}
        </p>
      </div>
      <Link to="/care-plan" className="inline-flex min-h-11 items-center font-medium text-primary">
        {t("Review medication status")}
      </Link>
    </div>
  );
}
