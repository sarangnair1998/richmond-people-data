"use client";

import { type Indicator } from "@/lib/data";

type Props = {
  indicators: Indicator[];
};

const RACE_LABEL: Record<string, string> = {
  black: "Black",
  white: "White",
  hispanic: "Hispanic",
  asian: "Asian",
  other: "Other",
};

function shortUnit(unit: string): string {
  if (unit === "%") return "%";
  if (unit.startsWith("per 1,000")) return "/1k";
  if (unit.startsWith("per 100,000")) return "/100k";
  return unit;
}

export default function DisparityCallout({ indicators }: Props) {
  // For each indicator name, find the most recent year where 2+ race groups have data.
  // Exclude "all" from the race breakdown — it's the aggregate, not a group.
  const names = Array.from(new Set(indicators.map((i) => i.name)));

  const rows = names.flatMap((name) => {
    const raceRows = indicators.filter(
      (i) => i.name === name && i.race !== "all" && i.value !== null && RACE_LABEL[i.race]
    );
    if (raceRows.length < 2) return [];

    // Find the most recent year where at least 2 races have data
    const byYear = new Map<number, Indicator[]>();
    for (const row of raceRows) {
      const yr = row.year ?? 0;
      if (!byYear.has(yr)) byYear.set(yr, []);
      byYear.get(yr)!.push(row);
    }

    const bestYear = [...byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .find(([, rows]) => rows.length >= 2);

    if (!bestYear) return [];

    const [year, yearRows] = bestYear;
    const larger = Math.max(...yearRows.map((r) => r.value!));
    const smaller = Math.min(...yearRows.map((r) => r.value!));
    const ratio = smaller > 0 ? larger / smaller : 0;

    // Sort races: highest value first
    const sorted = [...yearRows].sort((a, b) => b.value! - a.value!);

    return [{ name, year, rows: sorted, ratio, unit: sorted[0].unit, source: sorted[0].source }];
  });

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2 h-6 rounded-full bg-red-500" />
        <span className="text-sm font-bold text-red-700 uppercase tracking-wide">Equity Snapshot</span>
        <span className="text-xs text-red-500">Richmond City · by race/ethnicity</span>
      </div>
      <div className="space-y-4">
        {rows.map(({ name, year, rows: raceRows, ratio, unit, source }) => (
          <div key={name} className="flex flex-wrap items-center gap-4">
            <div className="min-w-[200px] text-xs font-semibold text-slate-600">{name}</div>
            <div className="flex items-center gap-4 flex-wrap flex-1">
              {raceRows.map((r) => (
                <div key={r.race} className="text-center">
                  <div className="text-xs text-slate-500 mb-0.5">{RACE_LABEL[r.race] ?? r.race}</div>
                  <div className={`text-xl font-bold ${r.value === Math.max(...raceRows.map(x => x.value!)) ? "text-red-600" : "text-slate-600"}`}>
                    {r.value!.toFixed(1)}{shortUnit(unit)}
                  </div>
                </div>
              ))}
              <div className="px-2.5 py-1 bg-red-100 border border-red-200 rounded-full text-xs font-bold text-red-700">
                {ratio.toFixed(1)}× gap
              </div>
              <div className="ml-auto text-xs text-slate-400">{source} {year}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
