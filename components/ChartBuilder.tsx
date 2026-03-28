"use client";

import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { Indicator } from "@/lib/data";
import { buildIndicatorCatalog } from "@/lib/data";
import translations, { type Lang } from "@/lib/translations";

const SESSION_KEY = "rva_chart_count";
const MAX_REQUESTS = 5;
const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#be185d", "#94a3b8"];

type ChartSpec = {
  chartType: "bar" | "line" | "donut";
  title: string;
  xLabel?: string;
  yLabel?: string;
  note?: string;
  data: { name: string; value: number }[];
  error?: string;
};

type Props = { indicators: Indicator[]; lang: Lang };

export default function ChartBuilder({ indicators, lang }: Props) {
  const t = translations[lang].chart;
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChartSpec | null>(null);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(() => {
    if (typeof window === "undefined") return MAX_REQUESTS;
    return MAX_REQUESTS - Number(sessionStorage.getItem(SESSION_KEY) ?? 0);
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    const used = Number(sessionStorage.getItem(SESSION_KEY) ?? 0);
    if (used >= MAX_REQUESTS) {
      setError(translations[lang].chart.sessionExpired);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const catalog = buildIndicatorCatalog(indicators);
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, catalog }),
      });

      if (res.status === 429) {
        setError("Rate limit reached.");
        return;
      }

      const data: ChartSpec = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        const newCount = used + 1;
        sessionStorage.setItem(SESSION_KEY, String(newCount));
        setRemaining(MAX_REQUESTS - newCount);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">{t.title}</h3>
        <span className="text-xs text-slate-400">{remaining}/{MAX_REQUESTS} {t.sessionLabel}</span>
      </div>

      <p className="text-xs text-slate-400 mb-2">{t.hint}</p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.placeholder}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading || remaining === 0}
        />
        <button
          type="submit"
          disabled={loading || remaining === 0 || !query.trim()}
          className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
        >
          {loading ? t.building : t.build}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {result && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-800">{result.title}</h4>
            {result.note && (
              <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">{result.note}</span>
            )}
          </div>

          <ResponsiveContainer width="100%" height={240}>
            {result.chartType === "line" ? (
              <LineChart data={result.data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            ) : result.chartType === "donut" ? (
              <PieChart>
                <Pie data={result.data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {result.data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            ) : (
              <BarChart data={result.data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {result.data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
