"use client";

import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

type Props = {
  label: string;
  value: number;
  unit?: string;
  prefix?: string;
  source: string;
  year: number | string;
  vintage?: "Final" | "Provisional";
  color: string; // tailwind border color class e.g. "border-blue-600"
  decimals?: number;
  definition?: string;
};

export default function StatCard({
  label,
  value,
  unit = "",
  prefix = "",
  source,
  year,
  vintage,
  color,
  decimals = 0,
  definition,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate(v) {
        el.textContent = prefix + v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + unit;
      },
    });
    return () => controls.stop();
  }, [value, prefix, unit, decimals]);

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm border-t-4 ${color} p-5 flex flex-col gap-1`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1">
        <span>{label}</span>
        {definition && (
          <span className="relative group">
            <span className="text-slate-300 hover:text-blue-500 cursor-help text-xs leading-none">ⓘ</span>
            <span className="pointer-events-none absolute left-0 top-5 z-10 w-64 rounded-lg bg-slate-900 text-white text-xs px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity normal-case font-normal tracking-normal">
              {definition}
            </span>
          </span>
        )}
      </p>
      <p className="text-4xl font-bold tracking-tight text-slate-900">
        <span ref={ref}>
          {prefix}{value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{unit}
        </span>
      </p>
      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
        <span>{source} · {year}</span>
        {vintage && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
            vintage === "Final"
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}>{vintage}</span>
        )}
      </p>
    </div>
  );
}
