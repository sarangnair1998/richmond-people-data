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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
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
