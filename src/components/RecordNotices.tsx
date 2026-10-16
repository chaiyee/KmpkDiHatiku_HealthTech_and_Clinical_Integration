import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { useClock } from "@/hooks/use-clock";
import { localDay } from "@/lib/medications";
import { Button } from "./ui/button";

export function RecordNotices() {
  const { data, syncState, retrySync, saveActivityReminder } = useStore();
  const { t, format } = useLanguage();
  const now = useClock();
  const reminder = data?.activityReminder;
  const due =
    reminder?.enabled &&
    reminder.dismissedDate !== localDay(now) &&
    format(now, "HH:mm") >= reminder.time;
  return (
    <div className="no-print mx-auto w-full max-w-6xl px-4 space-y-2">
      {syncState === "error" && (
        <section role="alert" className="rounded-lg border bg-warning-soft p-3 text-sm space-y-2">
          <p>
            {t(
              "Account sync paused. Your local records are retained. A connection problem or a newer cloud record may need review. Export a backup before resolving differences.",
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={retrySync}>
              {t("Retry sync")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
                );
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "diamonitor-local-backup.json";
                anchor.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              {t("Export local backup")}
            </Button>
          </div>
        </section>
      )}
      {due && (
        <section role="status" className="rounded-lg border bg-secondary p-3 text-sm">
          <p>{t("Time to record today's activity.")}</p>
          <Button
            variant="outline"
            onClick={() => saveActivityReminder({ ...reminder!, dismissedDate: localDay(now) })}
          >
            {t("Dismiss")}
          </Button>
        </section>
      )}
    </div>
  );
}
