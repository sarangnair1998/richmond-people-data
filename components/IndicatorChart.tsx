"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Dot,
} from "recharts";
import type { Indicator } from "@/lib/data";

type Props = {
  indicators: Indicator[];
  selectedName: string;
  selectedRace: string;
};

export default function IndicatorChart({ indicators, selectedName, selectedRace }: Props) {
  const filtered = indicators
    .filter((i) => i.name === selectedName && i.race === selectedRace && i.value !== null)
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));

  if (!filtered.length) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No data available for this selection.
      </div>
    );
  }

  const unit = filtered[0].unit.includes("per") ? filtered[0].unit : filtered[0].unit === "%" ? "%" : "";
  const distinctYears = Array.from(new Set(filtered.map((i) => i.year)));
  const isTimeSeries = distinctYears.length > 1;

  // --- Time series: multiple years → line chart with year on x-axis ---
  if (isTimeSeries) {
    const data = filtered.map((i) => ({ year: String(i.year), value: i.value }));
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">{selectedName}</h3>
          <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
            {filtered[0].source} · {filtered[0].year}–{filtered[filtered.length - 1].year}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}${unit}`}
            />
            <Tooltip
              formatter={(v) => [`${Number(v).toFixed(1)}${unit}`, selectedName]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={<Dot r={4} fill="#2563eb" stroke="#fff" strokeWidth={2} />}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        {filtered[0].definition && (
          <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">
            {filtered[0].definition}
          </p>
        )}
      </div>
    );
  }

  // --- Single year: Richmond vs VA Average ---
  const indicator = filtered[0];
  const data = [
    { name: "Richmond", value: indicator.value },
    ...(indicator.va_average !== null
      ? [{ name: "Virginia", value: indicator.va_average }]
      : []),
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">{selectedName}</h3>
        <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
          {indicator.source} · {indicator.year}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }} barSize={56}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}${unit}`}
          />
          <Tooltip
            formatter={(v) => [`${Number(v).toFixed(1)}${unit}`, selectedName]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.name === "Richmond" ? "#2563eb" : "#94a3b8"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {indicator.definition && (
        <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">
          {indicator.definition}
        </p>
      )}
    </div>
  );
}
