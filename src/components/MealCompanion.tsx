import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, ImagePlus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useClock } from "@/hooks/use-clock";
import { analyseMealPhoto, prepareMealPhoto } from "@/lib/meal-photo";
import {
  blankFood,
  MALAYSIAN_MEALS,
  mealRecordSchema,
  mealSuggestionKeys,
  nearbyMealReadings,
  NUTRIENTS,
  nutritionTotals,
  recurringMeals,
  type FoodItem,
} from "@/lib/meals";
import type { HealthLog } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

const nutrientLabels = {
  carbohydrates: "Carbohydrates (g)",
  calories: "Calories (kcal)",
  protein: "Protein (g)",
  fat: "Fat (g)",
  fibre: "Fibre (g)",
};
const draftId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const errorKeys: Record<string, string> = {
  image: "Choose a clear JPG, PNG or WebP photo up to 10 MB.",
  signin: "Sign in to use photo analysis. Manual entry is always available.",
  configuration: "Photo analysis is not configured yet. You can enter your meal manually.",
  limit: "Photo analysis limit reached. Try later or enter the meal manually.",
  analysis: "We could not estimate this meal. Try a clearer photo or enter it manually.",
};
function MealEditor({ initial, onSaved }: { initial?: HealthLog; onSaved: () => void }) {
  const { t, format, language } = useLanguage();
  const { saveMeal } = useStore();
  const [items, setItems] = useState<FoodItem[]>(
    initial?.meal?.items ?? [{ ...blankFood(), name: initial?.title ?? "" }],
  );
  const [original, setOriginal] = useState<FoodItem[]>(initial?.meal?.originalItems ?? []);
  const [source, setSource] = useState<"manual" | "ai" | "ai-edited">(
    initial?.meal?.entrySource ?? "manual",
  );
  const [uncertainty, setUncertainty] = useState(initial?.meal?.uncertainty ?? []);
  const [questions, setQuestions] = useState(initial?.meal?.questions ?? []);
  const [when, setWhen] = useState(
    format(new Date(initial?.timestamp ?? Date.now()), "yyyy-MM-dd'T'HH:mm"),
  );
  const [note, setNote] = useState(initial?.detail ?? "");
  const [image, setImage] = useState("");
  const [analysedPreview, setAnalysedPreview] = useState("");
  const [consent, setConsent] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [reminder, setReminder] = useState(
    initial?.meal?.reminderAt
      ? format(new Date(initial.meal.reminderAt), "yyyy-MM-dd'T'HH:mm")
      : "",
  );
  const [wantsReminder, setWantsReminder] = useState(Boolean(initial?.meal?.reminderAt));
  const upload = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const generation = useRef(0);
  const id = useRef(initial?.id ?? draftId());
  const submission = useRef(initial?.meal?.submissionId ?? draftId());
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/meal-analysis", { signal: controller.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((value) => setReady(value?.configured === true))
      .catch(() => {});
    return () => {
      controller.abort();
      // Invalidate async photo work on unmount; this ref is a request counter, not a DOM node.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
    };
  }, []);
  function change(index: number, patch: Partial<FoodItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    if (source !== "manual") setSource("ai-edited");
    setConfirmed(false);
  }
  async function photo(file?: File) {
    if (!file || busy) return;
    const current = ++generation.current;
    setBusy(true);
    setError("");
    setConsent(false);
    setAnalysedPreview("");
    try {
      const result = await prepareMealPhoto(file);
      if (generation.current === current) setImage(result.image);
    } catch {
      if (generation.current === current) setError(errorKeys["image"]!);
    } finally {
      if (generation.current === current) setBusy(false);
    }
  }
  async function analyse() {
    if (!image || !consent || busy || !ready) return;
    const current = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const result = await analyseMealPhoto(image, language, note);
      if (generation.current !== current) return;
      setItems(result.items);
      setOriginal(result.items.map((item) => ({ ...item })));
      setUncertainty(result.uncertainty);
      setQuestions(result.questions);
      setSource("ai");
      setConfirmed(false);
      setAnalysedPreview(image);
      setImage("");
      setConsent(false);
    } catch (e) {
      if (generation.current === current)
        setError(errorKeys[e instanceof Error ? e.message : "analysis"] ?? errorKeys["analysis"]!);
    } finally {
      if (generation.current === current) setBusy(false);
    }
  }
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current || busy) return;
    const timestamp = new Date(when);
    if (
      !when ||
      !Number.isFinite(timestamp.getTime()) ||
      timestamp.getTime() > Date.now() + 60000
    ) {
      setError("Please choose a valid meal time, not in the future.");
      return;
    }
    let reminderAt: string | undefined;
    if (wantsReminder) {
      const at = new Date(reminder);
      if (
        !reminder ||
        !Number.isFinite(at.getTime()) ||
        at.getTime() <= timestamp.getTime() ||
        at.getTime() <= Date.now()
      ) {
        setError("Choose a future reminder after your meal, following your care team's schedule.");
        return;
      }
      reminderAt = at.toISOString();
    }
    const record = mealRecordSchema.safeParse({
      items,
      originalItems: original.length ? original : items.map((item) => ({ ...item, servings: 1 })),
      uncertainty,
      questions,
      entrySource: source,
      confirmed,
      submissionId: submission.current,
      ...(reminderAt ? { reminderAt } : {}),
    });
    if (!record.success) {
      setError("Check food names, portions and nutrition numbers, then confirm the meal.");
      return;
    }
    lock.current = true;
    try {
      saveMeal({
        id: id.current,
        category: "meal",
        source: "user",
        title: items.map((item) => item.name).join(", "),
        detail: note.trim() || undefined,
        timestamp: timestamp.toISOString(),
        meal: record.data,
      });
      toast.success(t("Meal saved. Review it alongside your glucose records."));
      setImage("");
      onSaved();
    } catch {
      lock.current = false;
      setError("Meal could not be saved. Please try again.");
    }
  }
  const totals = nutritionTotals(items);
  const biggest = items
    .filter((item) => item.carbohydrates !== null)
    .sort((a, b) => b.carbohydrates! * b.servings - a.carbohydrates! * a.servings)[0];
  const before = nutritionTotals(
    original.length ? original : items.map((item) => ({ ...item, servings: 1 })),
  );
  const value = (v: number | null) => (v === null ? t("Not entered") : v.toFixed(1));
  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      <div>
        <h3 className="text-xl font-semibold text-navy">{t("Record your meal")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Photo, portions, carbohydrates — review before saving.")}
        </p>
      </div>
      {!initial?.meal && (
        <div className="space-y-3 rounded-xl border bg-secondary/40 p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => camera.current?.click()}
            >
              <Camera />
              {t("Take photo")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => upload.current?.click()}
            >
              <ImagePlus />
              {t("Upload meal photo")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setImage("");
                setConsent(false);
                document.getElementById("food-name-0")?.focus();
              }}
            >
              {t("Enter meal manually")}
            </Button>
          </div>
          <input
            ref={upload}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            aria-label={t("Upload meal photo")}
            onChange={(e) => {
              void photo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            ref={camera}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            aria-label={t("Take photo")}
            onChange={(e) => {
              void photo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {!ready && (
            <p className="text-sm text-muted-foreground">{t(errorKeys["configuration"]!)}</p>
          )}
          {image && (
            <>
              <img
                src={image}
                alt={t("Selected meal photo")}
                className="max-h-64 w-full rounded-lg object-contain"
              />
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setImage("");
                  setConsent(false);
                }}
              >
                {t("Remove photo")}
              </Button>
              <label className="flex min-h-12 items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0"
                  checked={consent}
                  disabled={busy || !ready}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                {t(
                  "I agree to send this meal photo and my meal notes to OpenAI for an estimate. Do not include faces or private documents. The photo is not saved in my meal record.",
                )}
              </label>
              <Button
                type="button"
                disabled={busy || !ready || !consent}
                onClick={() => void analyse()}
              >
                {t(busy ? "Estimating your meal…" : "Estimate carbohydrates from photo")}
              </Button>
            </>
          )}
          {busy && (
            <p role="status" className="text-sm">
              {t("Preparing or analysing your photo…")}
            </p>
          )}
        </div>
      )}
      {analysedPreview && (
        <img
          src={analysedPreview}
          alt={t("Selected meal photo")}
          className="max-h-56 w-full rounded-xl object-contain"
        />
      )}
      <div className="rounded-xl border border-primary/20 bg-accent p-5">
        <p className="text-sm font-semibold">{t("Estimated total carbohydrates")}</p>
        <p className="mt-1 text-3xl font-semibold text-navy">
          {value(totals.carbohydrates.value)}
          {totals.carbohydrates.value !== null && " g"}
        </p>
        {!totals.carbohydrates.complete && (
          <p className="text-sm">
            {t("Incomplete estimate: some food items have no nutrition entered.")}
          </p>
        )}
        <p className="mt-2 text-sm">
          {t(
            "Carbohydrates can affect blood glucose. This estimate may change depending on your portion size and ingredients.",
          )}
        </p>
      </div>
      {items.length > 1 && biggest && (
        <p className="text-sm text-muted-foreground">
          {t("Largest recorded carbohydrate contribution: {food} ({value} g).", {
            food: biggest.name,
            value: Math.round(biggest.carbohydrates! * biggest.servings * 10) / 10,
          })}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {t(
          source === "manual"
            ? "Manual estimate — use a food label or a nutritional reference."
            : "AI estimate — ingredients and portions need your review.",
        )}
      </p>
      <fieldset disabled={busy} className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="space-y-3 rounded-xl border p-4">
            <div className="flex justify-between gap-2">
              <p className="font-semibold">{t("Food item {number}", { number: index + 1 })}</p>
              {items.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("Remove food item {number}", { number: index + 1 })}
                  onClick={() => {
                    setItems(items.filter((_, i) => i !== index));
                    setConfirmed(false);
                    if (source !== "manual") setSource("ai-edited");
                  }}
                >
                  <X />
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor={`food-name-${index}`}>{t("Food name")}</Label>
                <Input
                  id={`food-name-${index}`}
                  list="malaysian-meals"
                  maxLength={120}
                  value={item.name}
                  onChange={(e) => change(index, { name: e.target.value })}
                  className="mt-1 h-12"
                />
              </div>
              <div>
                <Label htmlFor={`portion-${index}`}>{t("One portion describes")}</Label>
                <Input
                  id={`portion-${index}`}
                  maxLength={120}
                  placeholder={t("e.g. one plate, 150 g or one cup")}
                  value={item.portion}
                  onChange={(e) => change(index, { portion: e.target.value })}
                  className="mt-1 h-12"
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`servings-${index}`}>{t("Number of portions (0.5 = half)")}</Label>
              <Input
                id={`servings-${index}`}
                type="number"
                min="0.05"
                max="20"
                step="0.05"
                value={item.servings}
                onChange={(e) => change(index, { servings: Number(e.target.value) })}
                className="mt-1 h-12"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "Enter nutrition for one described portion. Changing the number of portions scales the estimate; changing ingredients needs a new estimate.",
              )}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {NUTRIENTS.slice(0, 2).map((key) => (
                <div key={key}>
                  <Label htmlFor={`${key}-${index}`}>{t(nutrientLabels[key])}</Label>
                  <Input
                    id={`${key}-${index}`}
                    type="number"
                    min="0"
                    max="10000"
                    step="0.1"
                    value={item[key] ?? ""}
                    onChange={(e) =>
                      change(index, {
                        [key]: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="mt-1 h-12"
                  />
                </div>
              ))}
            </div>
            <details>
              <summary className="min-h-11 cursor-pointer py-2 font-medium text-primary">
                {t("Ingredients, drink sweetness & other nutrients")}
              </summary>
              <div className="space-y-3 pt-2">
                <Label htmlFor={`ingredients-${index}`}>{t("Ingredients or sauces")}</Label>
                <Input
                  id={`ingredients-${index}`}
                  maxLength={400}
                  value={item.ingredients}
                  onChange={(e) => change(index, { ingredients: e.target.value })}
                />
                <Label htmlFor={`sweetness-${index}`}>{t("Drink sweetness")}</Label>
                <select
                  id={`sweetness-${index}`}
                  className="h-12 w-full rounded-md border bg-background px-3"
                  value={item.sweetness}
                  onChange={(e) =>
                    change(index, { sweetness: e.target.value as FoodItem["sweetness"] })
                  }
                >
                  {(["unknown", "none", "less", "regular"] as const).map((key) => (
                    <option key={key} value={key}>
                      {t(
                        {
                          unknown: "Not sure",
                          none: "No added sugar",
                          less: "Less sugar",
                          regular: "Regular sweetness",
                        }[key],
                      )}
                    </option>
                  ))}
                </select>
                <div className="grid gap-3 sm:grid-cols-3">
                  {NUTRIENTS.slice(2).map((key) => (
                    <div key={key}>
                      <Label htmlFor={`${key}-${index}`}>{t(nutrientLabels[key])}</Label>
                      <Input
                        id={`${key}-${index}`}
                        type="number"
                        min="0"
                        max="10000"
                        step="0.1"
                        value={item[key] ?? ""}
                        onChange={(e) =>
                          change(index, {
                            [key]: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        ))}
        <datalist id="malaysian-meals">
          {MALAYSIAN_MEALS.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <Button
          type="button"
          variant="outline"
          disabled={items.length >= 20}
          onClick={() => {
            setItems([...items, blankFood()]);
            setConfirmed(false);
            if (source !== "manual") setSource("ai-edited");
          }}
        >
          <Plus />
          {t("Add food or drink")}
        </Button>
      </fieldset>
      <div className="rounded-xl border p-4 text-sm">
        <p>{t("Estimated calories: {value} kcal", { value: value(totals.calories.value) })}</p>
        {(original.length > 0 || items.some((item) => item.servings !== 1)) && (
          <p className="mt-2">
            {t(
              "Original → adjusted: {before} g → {after} g carbohydrates; {beforeCalories} → {afterCalories} kcal.",
              {
                before: value(before.carbohydrates.value),
                after: value(totals.carbohydrates.value),
                beforeCalories: value(before.calories.value),
                afterCalories: value(totals.calories.value),
              },
            )}
          </p>
        )}
      </div>
      {(uncertainty.length > 0 || questions.length > 0) && (
        <div className="rounded-xl bg-warning-soft p-4">
          <p className="font-semibold">{t("Please check these details")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {[...uncertainty, ...questions].map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </div>
      )}
      {mealSuggestionKeys(items).map((key) => (
        <p key={key} className="rounded-lg bg-secondary p-3 text-sm">
          {t(key)}
        </p>
      ))}
      <a
        className="inline-flex min-h-11 items-center text-sm text-primary underline"
        href="https://myfcd.moh.gov.my/"
        target="_blank"
        rel="noreferrer"
      >
        {t("Look up Malaysian food nutrition (MyFCD)")}
      </a>
      <p className="text-xs text-muted-foreground">
        {t(
          "MyFCD is a reference you can consult. These estimates are not verified database values. No food is rated safe or unsafe here.",
        )}
      </p>
      <div>
        <Label htmlFor="meal-when">{t("Meal date and time")}</Label>
        <Input
          id="meal-when"
          type="datetime-local"
          value={when}
          onChange={(e) => {
            setWhen(e.target.value);
            setConfirmed(false);
          }}
          className="mt-1 h-12"
        />
      </div>
      <div>
        <Label htmlFor="meal-note">{t("Meal notes or clarification (optional)")}</Label>
        <Input
          id="meal-note"
          maxLength={1000}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setConfirmed(false);
          }}
          className="mt-1 h-12"
        />
      </div>
      <label className="flex min-h-12 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={wantsReminder}
          onChange={(e) => setWantsReminder(e.target.checked)}
        />
        {t("My care team recommended a post-meal check; remind me at my chosen time.")}
      </label>
      {wantsReminder && (
        <div>
          <Label htmlFor="meal-reminder">{t("Your agreed recheck time")}</Label>
          <Input
            id="meal-reminder"
            type="datetime-local"
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
            className="mt-1 h-12"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("Reminders appear while the app is open. No reading is collected automatically.")}
          </p>
        </div>
      )}
      <label className="flex min-h-12 items-center gap-3 font-medium">
        <input
          type="checkbox"
          className="h-5 w-5 shrink-0"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        {t("I reviewed the foods, portions and estimates.")}
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t(error)}
        </p>
      )}
      <Button type="submit" disabled={!confirmed || busy} className="min-h-12 w-full text-base">
        {t(initial ? "Save meal changes" : "Save confirmed meal")}
      </Button>
    </form>
  );
}

export function MealCompanion() {
  const [editing, setEditing] = useState<HealthLog | undefined>();
  const [key, setKey] = useState(0);
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      {editing && (
        <Button
          variant="outline"
          onClick={() => {
            setEditing(undefined);
            setKey(key + 1);
          }}
        >
          {t("Cancel editing")}
        </Button>
      )}
      <MealEditor
        key={`${editing?.id ?? "new"}-${key}`}
        {...(editing ? { initial: editing } : {})}
        onSaved={() => {
          setEditing(undefined);
          setKey(key + 1);
        }}
      />
      <SavedMeals
        onEdit={(log) => {
          setEditing(log);
          window.scrollTo({ top: 0, behavior: "auto" });
        }}
      />
    </div>
  );
}

export function SavedMeals({ onEdit }: { onEdit?: (log: HealthLog) => void }) {
  const [limit, setLimit] = useState(10);
  const { t, format } = useLanguage();
  const { data, dismissMealReminder } = useStore();
  const now = useClock();
  if (!data) return null;
  const allMeals = data.logs
    .filter((log) => log.category === "meal")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const meals = allMeals.slice(0, limit);
  const patterns = recurringMeals(data);
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-navy">{t("Meals & nearby glucose")}</h3>
      {!meals.length && (
        <p className="text-sm text-muted-foreground">
          {t("Save a meal to review it alongside your glucose records.")}
        </p>
      )}
      {patterns.map((pattern) => (
        <p key={pattern.name} className="rounded-lg bg-secondary p-3 text-sm">
          {t(
            "Your recorded glucose was higher after several similar meals: {name}. This association does not prove the meal caused the change.",
            { name: pattern.name },
          )}
        </p>
      ))}
      {meals.map((log) => {
        const readings = nearbyMealReadings(log, data.readings);
        const totals = log.meal ? nutritionTotals(log.meal.items) : null;
        const due =
          log.meal?.reminderAt &&
          !log.meal.reminderDismissedAt &&
          new Date(log.meal.reminderAt) <= now;
        return (
          <Card key={log.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {log.source === "sample" ? t(log.title) : log.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {format(new Date(log.timestamp), "EEE d MMM, HH:mm")} ·{" "}
                {t(
                  log.source === "user"
                    ? log.meal?.entrySource === "manual" || !log.meal
                      ? "Manual entry"
                      : "AI estimate · confirmed by you"
                    : "Sample",
                )}
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {totals && (
                <p className="font-semibold">
                  {t("Estimated carbohydrates: {value} g", {
                    value: totals.carbohydrates.value ?? t("Not entered"),
                  })}
                  {!totals.carbohydrates.complete && ` · ${t("Incomplete estimate")}`}
                </p>
              )}
              {due && (
                <div role="status" className="space-y-2 rounded-lg bg-accent p-3">
                  <p>{t("Your chosen post-meal check reminder is due.")}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild>
                      <Link to="/health" search={{ tab: "glucose" }}>
                        {t("Record glucose")}
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={() => dismissMealReminder(log.id)}>
                      {t("Dismiss")}
                    </Button>
                  </div>
                </div>
              )}
              <details>
                <summary className="min-h-11 cursor-pointer py-2 font-medium text-primary">
                  {t("Review nearby readings & meal details")}
                </summary>
                <div className="space-y-2 pt-2">
                  {log.detail && (
                    <p className="whitespace-pre-wrap">
                      {log.source === "sample" ? t(log.detail) : log.detail}
                    </p>
                  )}
                  {log.meal?.items.map((item, i) => (
                    <p key={i}>
                      {item.name} · {item.portion} × {item.servings}
                      {item.ingredients && ` · ${item.ingredients}`}
                    </p>
                  ))}
                  {totals &&
                    NUTRIENTS.slice(1).map((n) => (
                      <p key={n}>
                        {t(nutrientLabels[n])}: {totals[n].value ?? t("Not entered")}
                        {!totals[n].complete && ` · ${t("Incomplete estimate")}`}
                      </p>
                    ))}
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "Nearby means within three hours. Times show recorded observations, not a causal link. Sample and simulated readings are kept separate from your meal observations.",
                    )}
                  </p>
                  {!readings.length ? (
                    <p>
                      {t("No matching-source readings nearby. Nothing was measured automatically.")}
                    </p>
                  ) : (
                    readings.map((r) => (
                      <p key={r.id}>
                        {format(new Date(r.timestamp), "HH:mm")} · {r.value.toFixed(1)} mmol/L ·{" "}
                        {t(
                          r.source === "user"
                            ? "Manually recorded"
                            : r.source === "device"
                              ? "Simulated device"
                              : "Sample",
                        )}
                      </p>
                    ))
                  )}
                </div>
              </details>
              {onEdit && log.source === "user" && (
                <Button variant="outline" onClick={() => onEdit(log)}>
                  {t("Edit meal")}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
      {limit < allMeals.length && (
        <Button variant="outline" onClick={() => setLimit(limit + 10)}>
          {t("Show more meals")}
        </Button>
      )}
    </div>
  );
}

export function MealEditDialog({ log, onClose }: { log: HealthLog; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("Edit meal")}</DialogTitle>
          <DialogDescription>
            {t("Review portions and estimates before saving changes.")}
          </DialogDescription>
        </DialogHeader>
        <MealEditor initial={log} onSaved={onClose} />
      </DialogContent>
    </Dialog>
  );
}

export function MealReminderNotice() {
  const { data, dismissMealReminder } = useStore();
  const now = useClock();
  const { t } = useLanguage();
  const due =
    data?.logs.filter(
      (log) =>
        log.meal?.reminderAt &&
        !log.meal.reminderDismissedAt &&
        new Date(log.meal.reminderAt) <= now,
    ) ?? [];
  if (!due.length) return null;
  return (
    <div
      role="status"
      className="no-print mx-4 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-accent p-3 text-sm md:mx-8"
    >
      <p>
        {t("Your chosen post-meal check reminder is due.")} · {due[0]!.title}
      </p>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link to="/health" search={{ tab: "glucose" }}>
            {t("Record glucose")}
          </Link>
        </Button>
        <Button variant="ghost" onClick={() => dismissMealReminder(due[0]!.id)}>
          {t("Dismiss")}
        </Button>
      </div>
    </div>
  );
}
