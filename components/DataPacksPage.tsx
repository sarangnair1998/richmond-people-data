"use client";

import { useState } from "react";
import type { Indicator } from "@/lib/data";
import translations, { type Lang } from "@/lib/translations";

type Props = { indicators: Indicator[]; lang: Lang };

type Domain = "all" | "health" | "poverty" | "education";

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map((c) => `"${String(c ?? "").replace(/"/g, "'")}"`).join(",");
}

function vintage(year: number | null): string {
  if (!year) return "";
  return year <= 2023 ? "Final" : "Provisional";
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function DataPacksPage({ indicators, lang }: Props) {
  const t = translations[lang].dataPacks;
  const [domain, setDomain] = useState<Domain>("all");

  function downloadStandard() {
    const rows = indicators.filter(
      (i) => i.value !== null && (domain === "all" || i.category === domain)
    );
    const header = ["Indicator", "Race/Group", "Value", "Unit", "VA Average", "Year", "Vintage", "Source", "Definition"];
    const lines = rows.map((i) =>
      csvRow([
        i.name,
        i.race === "all" ? "All groups" : capitalize(i.race),
        i.value, i.unit, i.va_average ?? "", i.year, vintage(i.year), i.source, i.definition ?? "",
      ])
    );
    downloadCSV([header.join(","), ...lines].join("\n"), `richmond-standard-${domain}-${today()}.csv`);
  }

  function downloadComplete() {
    const rows = indicators.filter((i) => i.value !== null);
    const header = ["Indicator", "Category", "Subcategory", "Race/Group", "Value", "Unit", "VA Average", "Year", "Vintage", "Source", "Source URL", "Definition", "Notes"];
    const lines = rows.map((i) =>
      csvRow([
        i.name, i.category, i.subcategory ?? "",
        i.race === "all" ? "All groups" : capitalize(i.race),
        i.value, i.unit, i.va_average ?? "", i.year, vintage(i.year),
        i.source, i.source_url ?? "", i.definition ?? "", i.notes ?? "",
      ])
    );
    downloadCSV([header.join(","), ...lines].join("\n"), `richmond-complete-${today()}.csv`);
  }

  const handlers: Record<string, () => void> = {
    standard: downloadStandard,
    complete: downloadComplete,
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{t.title}</h2>
        <p className="text-sm text-slate-500 mt-1">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {t.tiers.map((tier) => (
          <div key={tier.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="text-3xl mb-2">{tier.icon}</div>
              <h3 className="text-lg font-bold text-slate-900">{tier.name}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tier.tagline}</p>
            </div>

            <div className="px-6 py-4 flex-1 space-y-1.5">
              {tier.includes.map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="text-emerald-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>{item}</span>
                </div>
              ))}
              {tier.excludes.map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="font-bold flex-shrink-0 mt-0.5">✗</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {"domains" in tier && tier.domains && (
              <div className="px-6 pb-4">
                <div className="flex gap-1.5 flex-wrap">
                  {(Object.entries(tier.domains) as [Domain, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setDomain(key)}
                      className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                        domain === key
                          ? "bg-slate-900 text-white border-slate-900"
                          : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="px-6 pb-6">
              <button
                onClick={handlers[tier.id]}
                className="w-full bg-slate-900 text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:bg-blue-700 transition-colors"
              >
                {tier.btnLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
