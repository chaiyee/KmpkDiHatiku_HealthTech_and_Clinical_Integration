import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ActivityCompanion } from "./ActivityCompanion";
import { LanguageProvider } from "@/lib/i18n";
import type { HealthLog } from "@/lib/types";
const mock = vi.hoisted(() => ({
  save: vi.fn(),
  remove: vi.fn(),
  remind: vi.fn(),
  data: { logs: [] as HealthLog[], readings: [] },
}));
vi.mock("@/lib/store", () => ({
  useStore: () => ({
    data: mock.data,
    saveActivity: mock.save,
    removeActivity: mock.remove,
    saveActivityReminder: mock.remind,
  }),
}));
beforeEach(() => {
  localStorage.clear();
  mock.data.logs = [];
  vi.clearAllMocks();
});
afterEach(cleanup);
describe("Activity companion interface", () => {
  it("saves a simple activity with default walking and 15 minutes", () => {
    render(<ActivityCompanion />);
    fireEvent.click(screen.getByRole("button", { name: "Save activity" }));
    expect(mock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "user",
        category: "activity",
        activity: expect.objectContaining({ type: "Walking", duration: 15 }),
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Activity saved");
  });
  it("allows editing and deleting only structured real history entries", () => {
    mock.data.logs = [
      {
        id: "a",
        title: "Walking",
        source: "user",
        category: "activity",
        timestamp: new Date().toISOString(),
        activity: { type: "Walking", duration: 15, intensity: "Light", notes: "" },
      },
    ];
    render(<ActivityCompanion />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Duration (minutes)"), { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(mock.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a", activity: expect.objectContaining({ duration: 25 }) }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(mock.remove).toHaveBeenCalledWith("a");
  });
  it.each(["ms", "zh"])("renders activity inputs in %s", (language) => {
    localStorage.setItem("diamonitor-language", language);
    render(
      <LanguageProvider>
        <ActivityCompanion />
      </LanguageProvider>,
    );
    expect(screen.queryByText("Activity & Glucose")).toBeNull();
    expect(screen.getByRole("spinbutton")).toHaveAccessibleName();
  });
});
