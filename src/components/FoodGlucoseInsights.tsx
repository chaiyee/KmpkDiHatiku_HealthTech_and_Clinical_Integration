import { Utensils } from "lucide-react";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import type { ReactNode } from "react";
import { foodInsights } from "@/lib/food-insights";

export function FoodGlucoseInsights({ children }: { children: ReactNode }) {
  const { data } = useStore();
  const { t } = useLanguage();
  if (!data) return null;
  const insights = foodInsights(data);
  return (
    <section className="rounded-xl border bg-card p-4 space-y-3">
      <h2 className="section-heading">
        <Utensils className="h-5 w-5" />
        {t("Food & Glucose Insights")}
      </h2>
      <p className="text-sm">
        {t("Today's recorded carbohydrate estimates: {value} g", {
          value: insights.carbs ?? t("Not entered"),
        })}
      </p>
      <p className="text-sm text-muted-foreground">
        {t(
          "Estimates include confirmed meals only. Missing nutrients and unlogged meals are not included.",
        )}
      </p>
      {!insights.patterns.length ? (
        <p className="text-sm">
          {t(
            "Insufficient data for a repeated meal pattern. Three comparable meals with suitable before and after readings are needed.",
          )}
        </p>
      ) : (
        insights.patterns.map((pattern) => (
          <p key={pattern.name} className="text-sm">
            {t(
              "Across {count} comparable meals containing {food}, later readings were higher. This association does not show cause.",
              { count: pattern.count, food: pattern.name },
            )}
          </p>
        ))
      )}
      <details>
        <summary className="cursor-pointer font-medium">{t("Meal and glucose timeline")}</summary>
        {!insights.meals.length && (
          <p className="text-sm">
            {t("No confirmed meals yet. Record and confirm a meal to begin.")}
          </p>
        )}
        {children}
      </details>
    </section>
  );
}
