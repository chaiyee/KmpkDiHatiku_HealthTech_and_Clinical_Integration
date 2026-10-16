import { describe, expect, it, vi } from "vitest";
import { handleMealAnalysis, parseVisionResponse } from "./meal-analysis.server";
import { blankFood } from "./meals";
const env = {
  OPENAI_API_KEY: "test-key",
  MEAL_VISION_MODEL: "test-model",
  SUPABASE_URL: "https://backend.example",
  SUPABASE_PUBLISHABLE_KEY: "test-public",
};
const input = {
  image: "data:image/jpeg;base64,/9j/",
  consent: true,
  language: "en",
  context: "Chicken rice",
};
const result = {
  items: [
    { ...blankFood(), name: "Rice", portion: "plate", carbohydrates: 50 },
    { ...blankFood(), name: "Chicken", portion: "piece", protein: 20 },
  ],
  uncertainty: ["Sauce amount is unclear."],
  questions: ["How large is the rice portion?"],
};
const provider = (data: unknown) => ({
  status: "completed",
  output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(data) }] }],
});
function request(payload: unknown = input, origin = "https://app.example") {
  return new Request("https://app.example/api/meal-analysis", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      Authorization: "Bearer test-session",
    },
    body: JSON.stringify(payload),
  });
}
function calls(payload: unknown = provider(result)) {
  return vi
    .fn()
    .mockResolvedValueOnce(Response.json({ id: crypto.randomUUID() }))
    .mockResolvedValueOnce(Response.json(true))
    .mockResolvedValueOnce(Response.json(payload));
}
describe("secure photo analysis", () => {
  it("parses multiple foods and retains unknown fibre", () => {
    const parsed = parseVisionResponse(provider(result));
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0]?.fibre).toBeNull();
  });
  it("rejects refusal, incomplete, non-food, invalid nutrients and inconsistent serving basis", () => {
    expect(() => parseVisionResponse({ status: "incomplete", output: [] })).toThrow();
    expect(() => parseVisionResponse(provider({ ...result, items: [] }))).toThrow();
    expect(() =>
      parseVisionResponse(
        provider({ ...result, items: [{ ...result.items[0], carbohydrates: -2 }] }),
      ),
    ).toThrow();
    expect(() =>
      parseVisionResponse(provider({ ...result, items: [{ ...result.items[0], servings: 2 }] })),
    ).toThrow();
    expect(() =>
      parseVisionResponse({
        status: "completed",
        output: [{ type: "message", content: [{ type: "refusal", refusal: "No" }] }],
      }),
    ).toThrow();
  });
  it("reports missing credentials without calling any service", async () => {
    const call = vi.fn();
    const response = await handleMealAnalysis(request(), {}, call);
    expect(response.status).toBe(503);
    expect(call).not.toHaveBeenCalled();
  });
  it("requires consent and same-origin requests before transmission", async () => {
    const call = vi.fn();
    expect(
      (await handleMealAnalysis(request({ ...input, consent: false }), env, call)).status,
    ).toBe(400);
    expect(
      (await handleMealAnalysis(request(input, "https://other.example"), env, call)).status,
    ).toBe(403);
    expect(call).not.toHaveBeenCalled();
  });
  it("rejects oversized and disguised files before auth or provider calls", async () => {
    const call = vi.fn();
    expect(
      (
        await handleMealAnalysis(
          request({ ...input, image: "data:image/png;base64,/9j/" }),
          env,
          call,
        )
      ).status,
    ).toBe(400);
    expect(
      (await handleMealAnalysis(request({ ...input, image: "x".repeat(3000001) }), env, call))
        .status,
    ).toBe(400);
    expect(call).not.toHaveBeenCalled();
  });
  it("checks authenticated persistent quota before provider requests", async () => {
    const call = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ id: crypto.randomUUID() }))
      .mockResolvedValueOnce(Response.json(false));
    expect((await handleMealAnalysis(request(), env, call)).status).toBe(429);
    expect(call).toHaveBeenCalledTimes(2);
  });
  it("returns validated real-provider results with no-store and minimal input", async () => {
    const call = calls();
    const response = await handleMealAnalysis(request(), env, call);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = JSON.parse(call.mock.calls[2]![1].body);
    expect(body.store).toBe(false);
    expect(body.input[0].content).toHaveLength(2);
    expect(body).not.toHaveProperty("patient");
    expect((await response.json()).analysis.items).toHaveLength(2);
  });
  it("keeps provider failures private and returns a manual-entry fallback error", async () => {
    const call = calls({ private: "sensitive response" });
    const response = await handleMealAnalysis(request(), env, call);
    expect(response.status).toBe(502);
    expect(await response.text()).toBe('{"error":"analysis"}');
  });
  it("fails closed when quota deployment is missing", async () => {
    const call = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ id: crypto.randomUUID() }))
      .mockResolvedValueOnce(new Response("", { status: 404 }));
    expect((await handleMealAnalysis(request(), env, call)).status).toBe(503);
    expect(call).toHaveBeenCalledTimes(2);
  });
});
