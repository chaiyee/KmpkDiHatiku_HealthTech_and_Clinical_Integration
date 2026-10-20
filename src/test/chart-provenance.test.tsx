import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { GlucoseChart } from "@/components/GlucoseChart";
import { generateSampleData } from "@/lib/sample-data";
import { LanguageProvider, translate } from "@/lib/i18n";
import type { GlucoseReading } from "@/lib/types";

const captured = vi.hoisted(() => ({ data: [] as unknown[], tooltip: undefined as unknown }));
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  LineChart: ({ children, data }: { children: ReactNode; data: unknown[] }) => {
    captured.data = data;
    return <div>{children}</div>;
  },
  Tooltip: (props: unknown) => {
    captured.tooltip = props;
    return null;
  },
  CartesianGrid: () => null,
  Line: () => null,
  ReferenceArea: () => null,
  ReferenceLine: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
});

it.each(["en", "ms", "zh"] as const)(
  "keeps every chart value and timestamp unchanged with accurate source text in %s",
  (language) => {
    localStorage.setItem("diamonitor-language", language);
    const records = generateSampleData(new Date("2026-10-20T04:00:00Z"));
    const base = records.readings[0]!;
    const readings: GlucoseReading[] = [
      { ...base, id: "sample", source: "sample", value: 7.2 },
      { ...base, id: "device", source: "device", value: 8.4, timestamp: "2026-10-20T03:00:00Z" },
      { ...base, id: "manual", source: "user", value: 6.1, timestamp: "2026-10-20T02:00:00Z" },
    ];
    const before = JSON.stringify(readings);
    const thresholdsBefore = JSON.stringify(records.thresholds);
    render(
      <LanguageProvider>
        <GlucoseChart readings={readings} t={records.thresholds} />
      </LanguageProvider>,
    );
    expect(
      screen.getByRole("img", { name: translate("Glucose readings chart in mmol/L", language) }),
    ).toBeVisible();
    expect(captured.data).toEqual(
      [...readings]
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .map((r) => ({
          x: new Date(r.timestamp).getTime(),
          value: r.value,
          context: r.context,
          source: r.source,
        })),
    );
    const tooltip = captured.tooltip as {
      formatter: (value: number, name: string, item: { payload: GlucoseReading }) => string[];
    };
    for (const [reading, label] of readings.map(
      (reading) =>
        [
          reading,
          reading.source === "sample"
            ? "Not personally measured"
            : reading.source === "device"
              ? "Device simulation"
              : "Manually recorded",
        ] as const,
    )) {
      const result = tooltip.formatter(reading.value, "", { payload: reading });
      expect(result[0]).toBe(`${reading.value} mmol/L`);
      expect(result[1]).toContain(translate(label, language));
    }
    expect(JSON.stringify(readings)).toBe(before);
    expect(JSON.stringify(records.thresholds)).toBe(thresholdsBefore);
  },
);
