import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { generateSampleData } from "@/lib/sample-data";
import { LanguageProvider, translate } from "@/lib/i18n";
import { translationsContent } from "@/lib/translations-content";
import { CaregiverAlerts, CaregiverSupport } from "@/components/CaregiverSupport";
import { MedicationReminders } from "@/components/MedicationReminders";
import { ActivityCompanion } from "@/components/ActivityCompanion";
import { EvidenceTable } from "@/components/common";
import { Route as OverviewRoute } from "@/routes/index";
import { Route as HealthRoute } from "@/routes/health";
import { Route as CarePlanRoute } from "@/routes/care-plan";
import type { AppData } from "@/lib/types";
const mocks = vi.hoisted(() => ({ data: undefined as unknown as AppData, change: vi.fn() }));
vi.mock("@/lib/store", () => ({
  useStore: () => ({
    data: mocks.data,
    removeMedication: mocks.change,
    markMedication: mocks.change,
    saveMedication: mocks.change,
    saveActivity: mocks.change,
    removeActivity: mocks.change,
    saveActivityReminder: mocks.change,
    pinQuestion: mocks.change,
    addReading: mocks.change,
    setCheckIn: mocks.change,
    saveCaregiver: mocks.change,
    revokeCaregiver: mocks.change,
    guardianCheckIn: mocks.change,
    addDeviceReadings: mocks.change,
    acknowledgeCaregiver: mocks.change,
  }),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => ({ tab: "glucose" }) }),
  useNavigate: () => vi.fn(),
  Link: ({ children, to, hash }: { children: ReactNode; to: string; hash?: string }) => (
    <a href={`${to}${hash ? `#${hash}` : ""}`}>{children}</a>
  ),
}));
vi.mock("@/components/GlucoseChart", () => ({ GlucoseChart: () => <div>Glucose chart</div> }));
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  localStorage.clear();
  mocks.data = generateSampleData();
  mocks.change.mockClear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("compact patient content", () => {
  it.each(["en", "ms", "zh"] as const)("translates all new labels into %s", (language) => {
    for (const key of Object.keys(translationsContent)) {
      const text = translate(key, language);
      expect(text.trim()).not.toBe("");
      if (language !== "en") expect(text).not.toBe(key);
    }
  });
  it.each(["en", "ms", "zh"] as const)("keeps source labels clear in %s", (language) => {
    localStorage.setItem("diamonitor-language", language);
    const base = mocks.data.readings[0]!;
    render(
      <LanguageProvider>
        <EvidenceTable
          readings={[
            { ...base, id: "sample", source: "sample" },
            { ...base, id: "sim", source: "device" },
            { ...base, id: "real", source: "user" },
          ]}
          t={mocks.data.thresholds}
        />
      </LanguageProvider>,
    );
    for (const key of ["Sample", "Simulated", "Patient-entered"])
      expect(screen.getByText(translate(key, language))).toBeInTheDocument();
  });
  it("keeps prescription guidance at the medication entry decision", () => {
    render(<MedicationReminders />);
    expect(screen.getByText("Medication Tracker")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Follow prescribed doses. Never take extra medication because of a reminder.",
      ),
    ).toBeNull();
    expect(screen.queryByText(/not confirmed adherence/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add medication" }));
    expect(screen.getByText("Enter the medication and dose exactly as prescribed.")).toBeVisible();
    expect(mocks.change).not.toHaveBeenCalled();
  });
  it("hides empty caregiver history while keeping consent controls available", () => {
    mocks.data.caregiverAlerts = [];
    render(
      <>
        <CaregiverAlerts />
        <CaregiverSupport />
      </>,
    );
    expect(screen.queryByText("Caregiver preview history")).toBeNull();
    expect(screen.queryByText(/No caregiver alert previews yet/)).toBeNull();
    expect(screen.queryByText(/Revoke sharing to stop new previews/)).toBeNull();
    expect(screen.getByRole("button", { name: "Revoke sharing consent" })).toBeVisible();
    expect(mocks.change).not.toHaveBeenCalled();
  });
  it.each(["en", "ms", "zh"] as const)(
    "opens the existing caregiver form and follows saved records in %s",
    (language) => {
      localStorage.setItem("diamonitor-language", language);
      mocks.data.caregiver = {
        enabled: false,
        name: "",
        relationship: "",
        shareRepeated: false,
        shareSafety: false,
      };
      const view = () => (
        <LanguageProvider>
          <CaregiverSupport />
        </LanguageProvider>
      );
      const { rerender } = render(view());
      const heading = translate("Stay Connected with Someone You Trust", language);
      expect(screen.queryByText(heading)).toBeNull();
      expect(
        screen.queryByRole("button", { name: translate("Add a Caregiver", language) }),
      ).toBeNull();
      const name = screen.getByRole("textbox", { name: translate("Caregiver name", language) });
      expect(name).toBeVisible();
      expect(document.querySelectorAll("form")).toHaveLength(1);
      fireEvent.change(name, { target: { value: "Aisha" } });
      fireEvent.change(screen.getByLabelText(translate("Relationship", language)), {
        target: { value: "Sister" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: translate("Save caregiver settings", language) }),
      );
      expect(mocks.change).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Aisha",
          relationship: "Sister",
          shareRepeated: false,
          shareSafety: false,
        }),
      );
      const history = mocks.data.caregiverAlerts;
      mocks.data = { ...mocks.data, caregiver: mocks.change.mock.calls.at(-1)![0] };
      rerender(view());
      expect(screen.queryByText(heading)).toBeNull();
      expect(screen.getByLabelText(translate("Caregiver name", language))).toHaveValue("Aisha");
      expect(
        screen.getByRole("button", { name: translate("Revoke sharing consent", language) }),
      ).toBeVisible();
      mocks.data = { ...mocks.data };
      delete mocks.data.caregiver;
      rerender(view());
      expect(screen.getByLabelText(translate("Caregiver name", language))).toBeVisible();
      expect(screen.getByLabelText(translate("Caregiver name", language))).toHaveValue("");
      expect(mocks.data.caregiverAlerts).toBe(history);
    },
  );
  it.each(["en", "ms", "zh"] as const)(
    "shows the Home caregiver state and existing setup link in %s",
    (language) => {
      localStorage.setItem("diamonitor-language", language);
      delete mocks.data.caregiver;
      const Page = OverviewRoute.options.component as ComponentType;
      const view = () => (
        <LanguageProvider>
          <Page />
        </LanguageProvider>
      );
      const { rerender } = render(view());
      const heading = translate("Stay Connected with Someone You Trust", language);
      expect(screen.getByText(heading)).toBeVisible();
      expect(
        screen.getByRole("link", { name: translate("Add a Caregiver", language) }),
      ).toHaveAttribute("href", "/care-plan#caregiver-support");
      expect(document.querySelector("#caregiver-name")).toBeNull();
      const history = mocks.data.caregiverAlerts;
      mocks.data = {
        ...mocks.data,
        caregiver: {
          name: "Aisha",
          relationship: "Sister",
          enabled: false,
          shareRepeated: false,
          shareSafety: false,
        },
      };
      rerender(view());
      expect(screen.queryByText(heading)).toBeNull();
      expect(screen.getByText("Aisha")).toBeVisible();
      expect(
        screen.getAllByText(translate("Preview only · no messages sent", language)).length,
      ).toBeGreaterThan(0);
      delete mocks.data.caregiver;
      rerender(view());
      expect(screen.getByText(heading)).toBeVisible();
      expect(mocks.data.caregiverAlerts).toBe(history);
      expect(mocks.change).not.toHaveBeenCalled();
    },
  );
  it("opens the existing section, scrolls and focuses its single form on direct navigation", () => {
    const scroll = vi.fn();
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scroll;
    window.history.replaceState(null, "", "/care-plan#caregiver-support");
    try {
      render(
        <details id="caregiver-support">
          <summary>Caregiver support</summary>
          <CaregiverSupport />
        </details>,
      );
      expect(document.querySelector("details")).toHaveAttribute("open");
      expect(screen.getByLabelText("Caregiver name")).toHaveFocus();
      expect(scroll).toHaveBeenCalledWith({ block: "start" });
      expect(document.querySelectorAll("form")).toHaveLength(1);
      expect(mocks.change).not.toHaveBeenCalled();
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
      window.history.replaceState(null, "", "/");
    }
  });
  it("keeps short activity safety guidance visible and medicine risk accessible", () => {
    render(<ActivityCompanion />);
    expect(
      screen.getByText("Low glucose or feeling unwell? Follow your safety plan before activity."),
    ).toBeVisible();
    fireEvent.click(screen.getByText("Activity safety"));
    expect(screen.getByText(/Some diabetes medicines increase low-glucose risk/)).toBeVisible();
    expect(mocks.change).not.toHaveBeenCalled();
  });
  it.each([
    ["Overview", OverviewRoute.options.component],
    ["My Health", HealthRoute.options.component],
    ["My Care Plan", CarePlanRoute.options.component],
  ])("renders %s with concise copy and unchanged records", (_name, Component) => {
    const Page = Component as ComponentType;
    const before = JSON.stringify(mocks.data);
    const { container } = render(<Page />);
    expect(container.textContent).not.toContain(
      "Reference ranges in this workspace are for demonstration",
    );
    expect(container.textContent).not.toContain(
      "Follow your prescription. These are self-reported records",
    );
    expect(container.textContent).not.toContain("This is an example goal for demonstration");
    expect(container.querySelector("h1")).toBeInTheDocument();
    expect(JSON.stringify(mocks.data)).toBe(before);
    expect(mocks.change).not.toHaveBeenCalled();
  });
});
