"use client";

import type { Indicator } from "@/lib/data";

import translations, { type Lang } from "@/lib/translations";

type Props = { indicators: Indicator[]; filename?: string; lang?: Lang };

export default function ExportCSV({ indicators, filename = "richmond-data.csv", lang = "en" }: Props) {
  const label = translations[lang].exportCsv;
  function download() {
    const headers = ["Indicator", "Race/Group", "Value", "Unit", "VA Average", "Source", "Year", "Definition"];
    const rows = indicators.map((i) => [
      `"${i.name}"`,
      i.race,
      i.value ?? "",
      `"${i.unit}"`,
      i.va_average ?? "",
      `"${i.source}"`,
      i.year ?? "",
      `"${(i.definition ?? "").replace(/"/g, "'")}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="flex items-center gap-2 text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors font-medium"
    >
      {label}
    </button>
  );
}
