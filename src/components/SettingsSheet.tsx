import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaregiverSettings } from "@/components/caregiver";
import { LANGS, useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { notificationPermission, requestNotificationPermission, type NotifyPermission } from "@/lib/notifications";

export function SettingsSheet() {
  const { t, lang, setLang, elderly, setElderly } = useI18n();
  const { resetDemo } = useStore();
  const [perm, setPerm] = useState<NotifyPermission>("default");
  useEffect(() => setPerm(notificationPermission()), []);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10" aria-label={t("settings.title")}><Settings className="h-5 w-5" /></Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("settings.title")}</SheetTitle>
          <SheetDescription>{t("settings.subtitle")}</SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="h-auto w-full flex-wrap">
            <TabsTrigger value="general" className="h-10 flex-1">{t("settings.general")}</TabsTrigger>
            <TabsTrigger value="caregiver" className="h-10 flex-1">{t("settings.caregiver")}</TabsTrigger>
            <TabsTrigger value="privacy" className="h-10 flex-1">{t("settings.privacy")}</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-5 pt-3">
            <fieldset>
              <legend className="mb-2 font-semibold">{t("settings.language")}</legend>
              <div className="grid grid-cols-3 gap-2">
                {LANGS.map((l) => (
                  <Button key={l.code} variant={lang === l.code ? "default" : "outline"} className="h-12" aria-pressed={lang === l.code} onClick={() => setLang(l.code)} lang={l.code}>
                    {l.label}
                  </Button>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center justify-between gap-3 rounded-xl border p-4">
              <span>
                <span className="block font-semibold">{t("settings.elderly")}</span>
                <span className="text-sm text-muted-foreground">{t("settings.elderlyHint")}</span>
              </span>
              <Switch checked={elderly} onCheckedChange={setElderly} aria-label={t("settings.elderly")} />
            </label>
            <div className="rounded-xl border p-4">
              <p className="font-semibold">{t("settings.notifications")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`settings.perm.${perm}`)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("settings.notifyLimit")}</p>
              {perm === "default" && (
                <Button
                  variant="outline"
                  className="mt-3 h-11"
                  onClick={async () => {
                    const p = await requestNotificationPermission();
                    setPerm(p);
                    toast(t(`settings.perm.${p}`));
                  }}
                >
                  {t("settings.enableNotifications")}
                </Button>
              )}
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-semibold">{t("settings.demoData")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("settings.demoDataHint")}</p>
              <Button variant="outline" className="mt-3 h-11" onClick={() => { if (window.confirm(t("settings.resetConfirm"))) { resetDemo(); toast(t("settings.resetDone")); } }}>
                {t("settings.reset")}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="caregiver" className="pt-3"><CaregiverSettings /></TabsContent>
          <TabsContent value="privacy" className="space-y-3 pt-3 text-[15px]">
            {["storage", "consent", "noAuth", "pdpa", "ai"].map((k) => (
              <div key={k} className="rounded-xl border p-4">
                <p className="font-semibold">{t(`privacy.${k}.title`)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t(`privacy.${k}.body`)}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
