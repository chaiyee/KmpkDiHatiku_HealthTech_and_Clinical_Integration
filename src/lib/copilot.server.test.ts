import { describe, it, expect, vi } from "vitest";
import { handleCopilot } from "./copilot.server";
import { generateSampleData } from "./sample-data";
const env = {
  OPENAI_API_KEY: "server-secret",
  COPILOT_MODEL: "configured-model",
  SUPABASE_URL: "https://db.example",
  SUPABASE_PUBLISHABLE_KEY: "public",
};
const request = (
  body: unknown = {
    question: "my walking",
    consent: true,
    language: "en",
    timezone: "Asia/Kuala_Lumpur",
  },
  origin = "https://app.example",
) =>
  new Request("https://app.example/api/copilot", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json", Authorization: "Bearer session" },
    body: JSON.stringify(body),
  });
const callFor = (output: unknown) =>
  vi
    .fn()
    .mockResolvedValueOnce(Response.json({ id: "11111111-1111-4111-8111-111111111111" }))
    .mockResolvedValueOnce(Response.json([{ data: generateSampleData() }]))
    .mockResolvedValueOnce(Response.json(true))
    .mockResolvedValueOnce(Response.json(output));
const completed = (text: string) => ({
  status: "completed",
  output: [{ type: "message", content: [{ type: "output_text", text }] }],
});
describe("Copilot boundary", () => {
  it("reports missing configuration honestly", async () => {
    expect((await handleCopilot(new Request("https://app.example/api/copilot"), {})).status).toBe(
      200,
    );
    expect((await handleCopilot(request(), {})).status).toBe(503);
  });
  it("rejects cross-origin requests before network access", async () => {
    const call = vi.fn();
    expect(
      (await handleCopilot(request(undefined, "https://evil.example"), env, call)).status,
    ).toBe(403);
    expect(call).not.toHaveBeenCalled();
  });
  it("requires consent and bounded input", async () => {
    expect(
      (
        await handleCopilot(
          request({ question: "hello", consent: false, language: "en", timezone: "UTC" }),
          env,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await handleCopilot(
          request({ question: "a".repeat(7000), consent: true, language: "en", timezone: "UTC" }),
          env,
        )
      ).status,
    ).toBe(400);
  });
  it("requires verified sign-in", async () => {
    expect(
      (
        await handleCopilot(
          request(),
          env,
          vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
        )
      ).status,
    ).toBe(401);
  });
  it("returns grounded answers and does not send identity or sample data", async () => {
    const call = callFor(completed(JSON.stringify({ intent: "walking_week", mealIds: [] })));
    const result = await handleCopilot(request(), env, call);
    expect(result.status).toBe(200);
    const sent = JSON.parse(call.mock.calls[3]![1].body);
    expect(sent.store).toBe(false);
    expect(sent.input).not.toContain("clinic");
    expect(sent.input).not.toContain("sample");
    expect((await result.json()).response.text).toContain("0 logged minutes");
  });
  it.each([
    completed("bad json"),
    completed('{"intent":"meal_glucose","mealIds":["invented"]}'),
    { status: "incomplete", output: [] },
  ])("rejects invalid model responses", async (output) => {
    expect((await handleCopilot(request(), env, callFor(output))).status).toBe(502);
  });
  it("handles urgent and medication questions without calling AI", async () => {
    for (const question of ["chest pain", "increase insulin dose"]) {
      const call = callFor({});
      const result = await handleCopilot(
        request({ question, consent: true, language: "en", timezone: "UTC" }),
        env,
        call,
      );
      expect((await result.json()).response.kind).toBe("safety");
      expect(call).toHaveBeenCalledTimes(2);
    }
  });
  it("fails closed when persistent quota is unavailable", async () => {
    const call = callFor({});
    call
      .mockReset()
      .mockResolvedValueOnce(Response.json({ id: "11111111-1111-4111-8111-111111111111" }))
      .mockResolvedValueOnce(Response.json([{ data: generateSampleData() }]))
      .mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect((await handleCopilot(request(), env, call)).status).toBe(503);
  });
});
