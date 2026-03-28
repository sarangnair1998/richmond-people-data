"use client";

import { type Indicator } from "@/lib/data";
import translations, { type Lang } from "@/lib/translations";

type Props = {
  indicators: Indicator[];
  lang: Lang;
};

const RACE_LABEL: Record<string, string> = {
  all: "Overall",
  black: "Black",
  white: "White",
  hispanic: "Hispanic",
  asian: "Asian",
  other: "Other",
};

const RACE_LABEL_ES: Record<string, string> = {
  all: "General",
  black: "Negro",
  white: "Blanco",
  hispanic: "Hispano",
  asian: "Asiático",
  other: "Otro",
};

const HIGHER_IS_BETTER = new Set([
  "4-Year Graduation Rate",
  "SOL Pass Rate — Reading",
  "SOL Pass Rate — Math",
  "SOL Pass Rate — Science",
  "SOL Pass Rate — Writing",
  "SOL Pass Rate — History",
  "Postsecondary Enrollment Rate",
  "Cholesterol Screening",
  "Dental Visit in Past Year",
  "Mammography Use (Women 50–74)",
  "Routine Checkup in Past Year",
]);

function shortUnit(unit: string): string {
  if (unit === "%") return "%";
  if (unit.startsWith("per 1,000")) return "/1k";
  if (unit.startsWith("per 100,000")) return "/100k";
  return unit;
}

export default function DisparityCallout({ indicators, lang }: Props) {
  const t = translations[lang].disparity;
  const raceLabel = lang === "es" ? RACE_LABEL_ES : RACE_LABEL;

  const names = Array.from(new Set(indicators.map((i) => i.name)));

  const rows = names.flatMap((name) => {
    const isRateOrPct = (i: Indicator) => i.unit === "%" || i.unit.startsWith("per ");

    const raceRows = indicators.filter(
      (i) => i.name === name && i.race !== "all" && i.value !== null && RACE_LABEL[i.race] && isRateOrPct(i)
    );
    if (raceRows.length < 2) return [];

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
    const higherIsBetter = HIGHER_IS_BETTER.has(name);
    const values = yearRows.map((r) => r.value!);
    const worstValue = higherIsBetter ? Math.min(...values) : Math.max(...values);
    const bestValue  = higherIsBetter ? Math.max(...values) : Math.min(...values);
    const ratio = bestValue > 0 ? worstValue / bestValue : 0;

    const sortedRace = [...yearRows].sort((a, b) =>
      higherIsBetter ? a.value! - b.value! : b.value! - a.value!
    );

    const overallRow = indicators.find(
      (i) => i.name === name && i.race === "all" && i.year === year && i.value !== null && isRateOrPct(i)
    );
    const displayRows = overallRow ? [...sortedRace, overallRow] : sortedRace;

    return [{ name, year, rows: displayRows, ratio, unit: sortedRace[0].unit, source: sortedRace[0].source, higherIsBetter }];
  });

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2 h-6 rounded-full bg-blue-400" />
        <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">{t.title}</span>
        <span className="text-xs text-slate-400">{t.subtitle}</span>
      </div>
      <div className="space-y-4">
        {rows.map(({ name, year, rows: raceRows, ratio, unit, source }) => (
          <div key={name} className="flex flex-wrap items-center gap-4">
            <div className="min-w-[200px] text-xs font-semibold text-slate-600">{name}</div>
            <div className="flex items-center gap-4 flex-wrap flex-1">
              {raceRows.map((r) => (
                <div key={r.race} className={`text-center ${r.race === "all" ? "opacity-50 border-l border-slate-200 pl-4 ml-2" : ""}`}>
                  <div className="text-xs text-slate-500 mb-0.5">{raceLabel[r.race] ?? r.race}</div>
                  <div className="text-xl font-bold text-slate-700">
                    {r.value!.toFixed(1)}{shortUnit(unit)}
                  </div>
                </div>
              ))}
              <div className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-600">
                {ratio.toFixed(1)}{t.difference}
              </div>
              <div className="ml-auto text-xs text-slate-400">{source} {year}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
