import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MealCompanion } from "./MealCompanion";
import { LanguageProvider, translate } from "@/lib/i18n";
import { blankFood } from "@/lib/meals";
import type { ReactNode } from "react";
import type { GlucoseReading, HealthLog } from "@/lib/types";
const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  prepare: vi.fn(),
  analyse: vi.fn(),
  data: { logs: [] as HealthLog[], readings: [] as GlucoseReading[] },
}));
vi.mock("@/lib/store", () => ({
  useStore: () => ({ data: mocks.data, saveMeal: mocks.save, dismissMealReminder: vi.fn() }),
}));
vi.mock("@/lib/meal-photo", () => ({
  prepareMealPhoto: mocks.prepare,
  analyseMealPhoto: mocks.analyse,
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
beforeEach(() => {
  mocks.save.mockReset();
  mocks.prepare.mockReset();
  mocks.analyse.mockReset();
  mocks.data = { logs: [], readings: [] };
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ configured: false }) }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function fill() {
  fireEvent.change(screen.getByLabelText("Food name"), { target: { value: "Chicken rice" } });
  fireEvent.change(screen.getByLabelText("One portion describes"), {
    target: { value: "one plate" },
  });
  fireEvent.change(screen.getByLabelText("Carbohydrates (g)"), { target: { value: "50" } });
  fireEvent.change(screen.getByLabelText("Calories (kcal)"), { target: { value: "400" } });
  fireEvent.change(screen.getByLabelText("Number of portions (0.5 = half)"), {
    target: { value: "0.5" },
  });
}
describe("Meal Companion workflow", () => {
  it("offers manual entry without AI and saves confirmed structured portions once", async () => {
    render(<MealCompanion />);
    await screen.findByText("Enter foods and portions to record your meal.");
    fill();
    expect(screen.getByText("25.0 g")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save confirmed meal" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("I reviewed the foods, portions and estimates."));
    const button = screen.getByRole("button", { name: "Save confirmed meal" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(mocks.save.mock.calls[0]![0].meal.items[0].servings).toBe(0.5);
    expect(mocks.save.mock.calls[0]![0].meal.originalItems[0].servings).toBe(1);
    expect(JSON.stringify(mocks.save.mock.calls[0]![0])).not.toContain("data:image");
  });
  it("requires consent, handles AI failure, and retains editable manual input", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ configured: true }) }),
    );
    mocks.prepare.mockResolvedValue({ image: "data:image/jpeg;base64,/9j/", preview: "unused" });
    mocks.analyse.mockRejectedValue(new Error("analysis"));
    render(<MealCompanion />);
    fill();
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Upload meal photo", { selector: "input" }), {
        target: { files: [new File(["image"], "meal.jpg", { type: "image/jpeg" })] },
      });
    });
    expect(
      screen.getByRole("button", { name: "Estimate carbohydrates from photo" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/I agree to send this meal photo/));
    fireEvent.click(screen.getByRole("button", { name: "Estimate carbohydrates from photo" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Try a clearer photo"));
    expect(screen.getByLabelText("Food name")).toHaveValue("Chicken rice");
  });
  it("edits the existing meal without creating a new record identity", () => {
    const food = { ...blankFood(), name: "Rice", portion: "one plate", carbohydrates: 50 };
    mocks.data.logs = [
      {
        id: "saved",
        source: "user",
        category: "meal",
        title: "Rice",
        timestamp: new Date().toISOString(),
        meal: {
          items: [food],
          originalItems: [food],
          entrySource: "manual",
          confirmed: true,
          submissionId: "one",
          uncertainty: [],
          questions: [],
        },
      },
    ];
    render(<MealCompanion />);
    fireEvent.click(screen.getByText("Meal and glucose timeline"));
    fireEvent.click(screen.getByRole("button", { name: "Edit meal" }));
    fireEvent.change(screen.getByLabelText("Carbohydrates (g)"), { target: { value: "30" } });
    fireEvent.click(screen.getByLabelText("I reviewed the foods, portions and estimates."));
    fireEvent.click(screen.getByRole("button", { name: "Save meal changes" }));
    expect(mocks.save.mock.calls[0]![0].id).toBe("saved");
    expect(mocks.save.mock.calls[0]![0].meal.submissionId).toBe("one");
  });
  it("renders translated core fields and interpolated units", async () => {
    localStorage.setItem("diamonitor-language", "ms");
    render(
      <LanguageProvider>
        <MealCompanion />
      </LanguageProvider>,
    );
    await waitFor(() => expect(screen.getByText("Rekod makanan anda")).toBeInTheDocument());
    expect(screen.getByLabelText("Karbohidrat (g)")).toBeInTheDocument();
    expect(translate("Estimated carbohydrates: {value} g", "zh", { value: 40 })).toBe(
      "估算碳水化合物：40克",
    );
  });
});
