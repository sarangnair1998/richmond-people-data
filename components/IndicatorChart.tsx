"use client";

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Dot,
} from "recharts";
import type { Indicator } from "@/lib/data";
import translations, { type Lang } from "@/lib/translations";

type Props = {
  indicators: Indicator[];
  selectedName: string;
  selectedRace: string;
  lang: Lang;
};

export default function IndicatorChart({ indicators, selectedName, selectedRace, lang }: Props) {
  const t = translations[lang].chart;
  const filtered = indicators
    .filter((i) => i.name === selectedName && i.race === selectedRace && i.value !== null)
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));

  if (!filtered.length) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        {t.noData}
      </div>
    );
  }

  const unit = filtered[0].unit.includes("per") ? filtered[0].unit : filtered[0].unit === "%" ? "%" : "";
  const distinctYears = Array.from(new Set(filtered.map((i) => i.year)));
  const isTimeSeries = distinctYears.length > 1;
  const definition = lang === "es"
    ? (filtered[0].definition_es ?? filtered[0].definition)
    : filtered[0].definition;

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
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickCount={5}
              tickFormatter={(v) => `${v}${unit}`} width={48} />
            <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}${unit}`, selectedName]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
            <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5}
              dot={<Dot r={4} fill="#2563eb" stroke="#fff" strokeWidth={2} />}
              activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
        {definition && (
          <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">{definition}</p>
        )}
      </div>
    );
  }

  const indicator = filtered[0];
  const data = [
    { name: t.richmond, value: indicator.value },
    ...(indicator.va_average !== null ? [{ name: t.virginia, value: indicator.va_average }] : []),
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
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickCount={5}
            tickFormatter={(v) => `${v}${unit}`} width={48} />
          <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}${unit}`, selectedName]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.name === t.richmond ? "#2563eb" : "#94a3b8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {definition && (
        <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">{definition}</p>
      )}
    </div>
  );
}
