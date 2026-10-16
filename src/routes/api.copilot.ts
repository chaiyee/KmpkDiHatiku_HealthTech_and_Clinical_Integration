import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/copilot")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleCopilot } = await import("@/lib/copilot.server");
        return handleCopilot(request, typeof process === "undefined" ? {} : process.env);
      },
      POST: async ({ request }) => {
        const { handleCopilot } = await import("@/lib/copilot.server");
        return handleCopilot(request, typeof process === "undefined" ? {} : process.env);
      },
    },
  },
});
