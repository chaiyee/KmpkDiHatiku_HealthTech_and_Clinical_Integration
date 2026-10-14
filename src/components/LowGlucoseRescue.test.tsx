import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LowGlucoseRescue } from "./LowGlucoseRescue";
vi.mock("@/lib/i18n", () => ({ useLanguage: () => ({ t: (s: string) => s }) }));
vi.mock("@/lib/store", () => ({ useStore: () => ({ data: { thresholds: { hypo: 4 } }, addLog: vi.fn() }) }));
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("rescue countdown", () => {
  it("waits for sugar confirmation and uses elapsed wall time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T10:00:00Z"));
    render(<LowGlucoseRescue value={3.5} onRecheck={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("timer")).toHaveTextContent("15:00");
    act(() => { vi.advanceTimersByTime(60000); });
    expect(screen.getByRole("timer")).toHaveTextContent("15:00");
    fireEvent.click(screen.getByRole("button", { name: /I've taken sugar/ }));
    act(() => { vi.setSystemTime(new Date("2026-10-14T10:17:00Z")); vi.advanceTimersByTime(250); });
    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
    expect(screen.getByRole("alert")).toHaveTextContent("Recheck your glucose now");
  });
  it("offers immediate help without waiting for countdown", () => {
    render(<LowGlucoseRescue value={3.5} onRecheck={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /I don't have sugar/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("Do not wait");
    expect(screen.getByRole("link", { name: "Call 999" })).toHaveAttribute("href", "tel:999");
  });
});
