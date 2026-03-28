"use client";

import { type Indicator } from "@/lib/data";

type Props = {
  indicators: Indicator[];
  activeTab: string;
};

const TAB_METRICS: Record<string, string[]> = {
  maternal_health: ["Low Birth Weight (<2,500g)", "Infant Mortality Rate"],
  health: ["HIV New Diagnoses Rate"],
};

function latestByRace(indicators: Indicator[], name: string, race: string): Indicator | null {
  const matches = indicators
    .filter((i) => i.name === name && i.race === race && i.value !== null)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  return matches[0] ?? null;
}

function shortUnit(unit: string): string {
  if (unit === "%") return "%";
  if (unit.startsWith("per 1,000")) return "/1k";
  if (unit.startsWith("per 100,000")) return "/100k";
  return unit;
}

export default function DisparityCallout({ indicators, activeTab }: Props) {
  const metrics = TAB_METRICS[activeTab];
  if (!metrics) return null;

  const rows = metrics.flatMap((metric) => {
    const black = latestByRace(indicators, metric, "black");
    const white = latestByRace(indicators, metric, "white");
    if (!black || !white || black.value === null || white.value === null) return [];
    const ratio = white.value > 0 ? black.value / white.value : 0;
    return [{ metric, black, white, ratio }];
  });

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2 h-6 rounded-full bg-red-500" />
        <span className="text-sm font-bold text-red-700 uppercase tracking-wide">Racial Disparity</span>
        <span className="text-xs text-red-500">Richmond City · Black vs White residents</span>
      </div>
      <div className="space-y-4">
        {rows.map(({ metric, black, white, ratio }) => (
          <div key={metric} className="flex flex-wrap items-center gap-4">
            <div className="min-w-[180px] text-xs font-semibold text-slate-600">{metric}</div>
            <div className="flex items-center gap-3 flex-1">
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-0.5">Black</div>
                <div className="text-xl font-bold text-red-600">
                  {black.value!.toFixed(1)}{shortUnit(black.unit)}
                </div>
              </div>
              <div className="text-slate-300 text-sm">vs</div>
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-0.5">White</div>
                <div className="text-xl font-bold text-slate-600">
                  {white.value!.toFixed(1)}{shortUnit(white.unit)}
                </div>
              </div>
              <div className="px-2.5 py-1 bg-red-100 border border-red-200 rounded-full text-xs font-bold text-red-700 ml-1">
                {ratio.toFixed(1)}× higher
              </div>
              <div className="ml-auto text-xs text-slate-400">{black.source} {black.year}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
