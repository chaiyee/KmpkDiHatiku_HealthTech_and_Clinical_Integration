import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/meal-analysis")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleMealAnalysis } = await import("@/lib/meal-analysis.server");
        return handleMealAnalysis(request, typeof process === "undefined" ? {} : process.env);
      },
      POST: async ({ request }) => {
        const { handleMealAnalysis } = await import("@/lib/meal-analysis.server");
        return handleMealAnalysis(request, typeof process === "undefined" ? {} : process.env);
      },
    },
  },
});
