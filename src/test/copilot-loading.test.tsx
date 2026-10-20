import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ComponentType } from "react";
import { Route } from "@/routes/copilot";
import { generateSampleData } from "@/lib/sample-data";
import { LanguageProvider, translate } from "@/lib/i18n";
import { RecordProvenance } from "@/components/common";

const mock = vi.hoisted(() => ({
  response: vi.fn(),
  email: "patient@example.com",
  configured: false,
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));
vi.mock("@/lib/store", () => ({
  useStore: () => ({
    data: generateSampleData(),
    userEmail: mock.email,
    syncState: "saved",
    pinQuestion: vi.fn(),
  }),
}));
vi.mock("@/lib/copilot-service", () => ({ getCopilotResponse: mock.response }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: { session: { access_token: "test", user: { email: mock.email } } },
      }),
    },
  },
}));
const Page = Route.options.component as ComponentType;
const guided = { kind: "personal", text: "Your recorded summary", sources: [], demo: false };
const flush = async (ms = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
function submit(question = "Review my records") {
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: question } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
}
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  mock.email = "patient@example.com";
  mock.configured = false;
  mock.response.mockReset().mockResolvedValue(guided);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => ({ configured: mock.configured }) })),
  );
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("keeps the question visible, changes stage, prevents duplicates and finishes at 2500ms", async () => {
  render(<Page />);
  submit();
  expect(screen.getByRole("status")).toHaveTextContent("Reviewing your health records…");
  expect(screen.getByText("Review my records")).toBeVisible();
  expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Your question"), {
    target: { value: "Another question" },
  });
  fireEvent.keyDown(screen.getByLabelText("Your question"), { key: "Enter" });
  expect(mock.response).toHaveBeenCalledTimes(1);
  await flush(1400);
  expect(screen.getByRole("status")).toHaveTextContent("Preparing your response…");
  await flush(1099);
  expect(screen.queryByText(guided.text)).toBeNull();
  await flush(1);
  expect(screen.getByText(guided.text)).toBeVisible();
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByLabelText("Your question")).toHaveFocus();
  expect(screen.getByText("Guided record review")).toBeVisible();
});
it.each(["chest pain", "low glucose", "adjust insulin dose"])(
  "does not delay safety responses for %s",
  async (question) => {
    mock.response.mockResolvedValue({ ...guided, kind: "safety", text: "Safety guidance" });
    render(<Page />);
    submit(question);
    await flush();
    expect(screen.getByText("Safety guidance")).toBeVisible();
    expect(screen.queryByRole("status")).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  },
);
it("shows a friendly failure and clears loading immediately", async () => {
  mock.response.mockRejectedValue(new Error("offline"));
  render(<Page />);
  submit();
  await flush();
  expect(
    screen.getByText("This answer couldn't be generated. Please try another question."),
  ).toBeVisible();
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByLabelText("Your question")).toHaveFocus();
});
it("discards a pending reply after account switching", async () => {
  const { rerender } = render(<Page />);
  submit();
  await flush(1000);
  mock.email = "other@example.com";
  rerender(<Page />);
  await flush(5000);
  expect(screen.queryByText(guided.text)).toBeNull();
  expect(screen.queryByText("Review my records")).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
});
it("cleans up pending delay on unmount", async () => {
  const { unmount } = render(<Page />);
  submit();
  await flush(100);
  unmount();
  await flush();
  expect(vi.getTimerCount()).toBe(0);
});
it("does not add another delay to a slow online response", async () => {
  mock.configured = true;
  let complete!: (value: unknown) => void;
  vi.mocked(fetch).mockImplementation(async (_url, options) =>
    options?.method === "POST"
      ? await new Promise<Response>((resolve) => {
          complete = resolve as typeof complete;
        })
      : ({ ok: true, json: async () => ({ configured: true }) } as Response),
  );
  render(<Page />);
  await flush();
  fireEvent.click(screen.getByText("Online review options"));
  fireEvent.click(screen.getByRole("checkbox"));
  submit();
  await flush(3100);
  await act(async () => {
    complete({ ok: true, json: async () => ({ response: { ...guided, text: "Online summary" } }) });
  });
  expect(screen.getByText("Online summary")).toBeVisible();
  expect(screen.getByText("AI-assisted record review")).toBeVisible();
  expect(screen.queryByRole("status")).toBeNull();
});
it("preserves Shift+Enter without submitting", () => {
  render(<Page />);
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "Question" } });
  fireEvent.keyDown(screen.getByLabelText("Your question"), { key: "Enter", shiftKey: true });
  expect(mock.response).not.toHaveBeenCalled();
});
it.each(["en", "ms", "zh"] as const)(
  "translates loading and preserves record provenance in %s",
  async (language) => {
    localStorage.setItem("diamonitor-language", language);
    render(
      <LanguageProvider>
        <Page />
        <RecordProvenance source="sample" />
        <RecordProvenance source="device" />
        <RecordProvenance source="user" />
      </LanguageProvider>,
    );
    fireEvent.change(screen.getByLabelText(translate("Your question", language)), {
      target: { value: "Question" },
    });
    fireEvent.click(screen.getByRole("button", { name: translate("Send", language) }));
    expect(screen.getByRole("status")).toHaveTextContent(
      translate("Reviewing your health records…", language),
    );
    expect(screen.getByText(translate("Manually recorded", language))).toBeVisible();
    for (const key of ["Not personally measured", "Device simulation"]) {
      expect(
        screen.getByLabelText(
          `${translate("About this record", language)}: ${translate(key, language)}`,
        ),
      ).toBeVisible();
    }
    await flush(1400);
    expect(screen.getByRole("status")).toHaveTextContent(
      translate("Preparing your response…", language),
    );
  },
);
