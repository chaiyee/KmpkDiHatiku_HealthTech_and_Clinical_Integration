import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { ConnectedHealth } from "./ConnectedHealth";
import { generateSampleData } from "@/lib/sample-data";
const mocks = vi.hoisted(() => ({ add: vi.fn(), check: vi.fn() }));
vi.mock("@/lib/store", () => ({
  useStore: () => ({
    data: generateSampleData(),
    addDeviceReadings: mocks.add,
    guardianCheckIn: mocks.check,
  }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
beforeEach(() => {
  mocks.add.mockReset();
  mocks.check.mockReset();
  mocks.check.mockReturnValue({ alerted: false });
});
afterEach(cleanup);
describe("guided Guardian presentation", () => {
  function reachCheckIn() {
    render(<ConnectedHealth />);
    fireEvent.click(screen.getByRole("button", { name: "Start Guardian preview" }));
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(mocks.add).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Review the pattern" }));
    expect(
      screen.queryByText(
        "Three morning readings are ready to review. These readings are simulated.",
      ),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue to check-in" }));
  }
  it("shows one step at a time and preserves the okay check-in behaviour", () => {
    reachCheckIn();
    fireEvent.click(screen.getByRole("button", { name: "I feel okay" }));
    expect(mocks.check).toHaveBeenCalledWith("okay");
    expect(screen.getByText("Step 4 of 5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Review caregiver support" }));
    expect(
      screen.getByText("No extra caregiver alert was created by your check-in."),
    ).toBeInTheDocument();
    expect(mocks.check).toHaveBeenCalledTimes(1);
  });
  it("keeps urgent guidance visible immediately when help is requested", () => {
    reachCheckIn();
    fireEvent.click(screen.getByRole("button", { name: "I need help" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Urgent: seek help now");
    expect(mocks.check).toHaveBeenCalledWith("help");
    expect(screen.getByRole("link", { name: "Call 999" })).toHaveAttribute("href", "tel:999");
  });
});
