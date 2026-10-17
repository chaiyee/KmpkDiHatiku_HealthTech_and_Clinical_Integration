import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { LanguageProvider, translate } from "@/lib/i18n";
import { generateSampleData } from "@/lib/sample-data";
import { Route as DoctorRoute } from "@/routes/doctor";
import { Route as CopilotRoute } from "@/routes/copilot";
const mock = vi.hoisted(() => ({
  data: undefined as unknown,
  saveQuestions: vi.fn(),
  saveDoctor: vi.fn(),
  switchDoctor: vi.fn(),
  session: vi.fn(),
}));
vi.mock("@/lib/store", () => ({
  useStore: () => ({
    data: mock.data,
    demoDoctor: true,
    setDemoDoctor: mock.switchDoctor,
    saveDoctorResponse: mock.saveDoctor,
    saveQuestions: mock.saveQuestions,
    removeQuestion: vi.fn(),
    toggleDiscussed: vi.fn(),
    pinQuestion: vi.fn(),
    userEmail: "patient@example.com",
    syncState: "saved",
  }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: mock.session } },
}));
vi.mock("@/components/GlucoseChart", () => ({ GlucoseChart: () => <div>Glucose chart</div> }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
const Doctor = DoctorRoute.options.component as ComponentType;
const Copilot = CopilotRoute.options.component as ComponentType;
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mock.data = generateSampleData();
  mock.session.mockResolvedValue({
    data: { session: { access_token: "test-session", user: { email: "patient@example.com" } } },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ configured: false }) }),
  );
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("patient-only doctor visit", () => {
  it.each(["en", "ms", "zh"] as const)(
    "keeps patient records and removes preview access in %s",
    (language) => {
      localStorage.setItem("diamonitor-language", language);
      const data = generateSampleData();
      data.doctorNotes = "Saved consultation notes";
      data.carePlan.doctorFeedback = "Saved feedback";
      mock.data = data;
      const { container } = render(
        <LanguageProvider>
          <Doctor />
        </LanguageProvider>,
      );
      expect(screen.getByText(data.patient.name)).toBeInTheDocument();
      expect(screen.getByText("Saved consultation notes")).toBeInTheDocument();
      expect(screen.getByText("Saved feedback")).toBeInTheDocument();
      expect(container.textContent).not.toMatch(
        /Doctor preview|Doctor Preview|Pratonton doktor|医生预览|Demo Doctor Mode/,
      );
      expect(
        container.querySelector("#doctor-notes,#doctor-feedback,#doctor-goal,#follow-up-date"),
      ).toBeNull();
      fireEvent.change(screen.getByLabelText(translate("Your questions and concerns", language)), {
        target: { value: "My appointment question" },
      });
      fireEvent.click(screen.getByRole("button", { name: translate("Save questions", language) }));
      expect(mock.saveQuestions).toHaveBeenCalledWith("My appointment question");
      expect(mock.saveDoctor).not.toHaveBeenCalled();
      expect(mock.switchDoctor).not.toHaveBeenCalled();
    },
  );
  it("opens every report section for printing and restores collapsed sections", () => {
    render(<Doctor />);
    const sections = Array.from(document.querySelectorAll("article details"));
    const previouslyClosed = sections.filter((section) => !section.hasAttribute("open"));
    const print = vi.spyOn(window, "print").mockImplementation(() => {
      expect(sections.every((section) => section.hasAttribute("open"))).toBe(true);
    });
    fireEvent.click(screen.getByRole("button", { name: "Print / Save PDF" }));
    expect(print).toHaveBeenCalledOnce();
    act(() => window.dispatchEvent(new Event("afterprint")));
    expect(previouslyClosed.every((section) => !section.hasAttribute("open"))).toBe(true);
    print.mockRestore();
  });
});
describe("graceful Copilot preview", () => {
  it.each(["en", "ms", "zh"] as const)(
    "uses accurately labelled guided help without configuration notices in %s",
    async (language) => {
      localStorage.setItem("diamonitor-language", language);
      const { container } = render(
        <LanguageProvider>
          <Copilot />
        </LanguageProvider>,
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: translate("How many carbohydrates did I eat today?", language),
        }),
      );
      await screen.findByText(translate("Guided record review", language));
      expect(container.textContent).not.toMatch(
        /unavailable|not configured|API key|pre-written|tidak tersedia|不可用/,
      );
      expect(
        screen.queryByText(translate("AI-assisted record review", language)),
      ).not.toBeInTheDocument();
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );
  it("labels a failed online request as guided assistance without claiming AI success", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ configured: true }) } as Response)
      .mockResolvedValueOnce({ ok: false } as Response);
    render(<Copilot />);
    fireEvent.click(await screen.findByText("Online review options"));
    const consent = await screen.findByRole("checkbox");
    fireEvent.click(consent);
    fireEvent.click(
      screen.getByRole("button", { name: "How many carbohydrates did I eat today?" }),
    );
    await screen.findByText("Guided record review");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("AI-assisted record review")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("unavailable");
  });
  it("uses an AI label only after a successful online record response", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ configured: true }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: { kind: "personal", text: "Reviewed saved records", sources: [], demo: false },
        }),
      } as Response);
    render(<Copilot />);
    fireEvent.click(await screen.findByText("Online review options"));
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "How many carbohydrates did I eat today?" }),
    );
    await screen.findByText("Reviewed saved records");
    expect(screen.getByText("AI-assisted record review")).toBeInTheDocument();
  });
  it("keeps urgent safety guidance and avoids an online request", async () => {
    render(<Copilot />);
    fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "chest pain" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(screen.getByText(/Call 999 or go to/)).toBeInTheDocument());
    expect(screen.getByText("Safety message")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
