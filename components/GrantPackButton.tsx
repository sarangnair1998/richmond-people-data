"use client";

import type { Indicator } from "@/lib/data";

// Pre-curated indicator names for the maternal health grant pack, in priority order
const GRANT_INDICATORS = [
  "Preterm Birth Rate",
  "Low Birth Weight (<2,500g)",
  "Very Low Birth Weight (<1,500g)",
  "Infant Mortality Rate",
  "Late or No Prenatal Care",
  "Resident Live Births",
  "Birth Rate (per 1,000 population)",
  "Teen Birth Rate (Ages 15–19)",
  "Teen Pregnancies (Total)",
  "Non-Marital Births",
];

// SDOH context indicators pulled from other categories
const SDOH_INDICATORS = [
  "Poverty Rate",
  "Child Poverty Rate (Under 18)",
  "Uninsured Adults",
  "Median Household Income",
  "Women of Childbearing Age (15–44)",
];

type Props = { indicators: Indicator[] };

export default function GrantPackButton({ indicators }: Props) {
  function buildGrantPack() {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];

    // Build methodology header
    const header = [
      `# Richmond City Maternal Health Grant Pack`,
      `# Generated: ${dateStr} · Source: RVA People Data (richmond-people-data.vercel.app)`,
      `# Data sources: VDH Vital Statistics, CDC WONDER Natality, U.S. Census ACS 5-Year 2023, CDC PLACES 2022`,
      `# Geography: Richmond City, Virginia (FIPS 51760)`,
      `# Note: Race disaggregation uses VDH categories (White/Black). "All" includes all races.`,
      `# VA Average column shows statewide average where available for benchmarking.`,
      `#`,
    ].join("\n");

    const colHeaders = [
      "Indicator",
      "Race/Group",
      "Richmond Value",
      "Unit",
      "VA Average",
      "Year",
      "Source",
      "Source URL",
      "Data Vintage",
      "Definition",
    ].join(",");

    function vintage(year: number | null): string {
      if (!year) return "";
      if (year <= 2023) return "Final";
      return "Provisional";
    }

    function csvCell(val: string | number | null | undefined): string {
      if (val === null || val === undefined) return "";
      return `"${String(val).replace(/"/g, "'")}"`;
    }

    // Collect rows for grant indicators (maternal health)
    const grantRows: Indicator[] = [];
    for (const name of GRANT_INDICATORS) {
      const matches = indicators.filter((i) => i.name === name && i.value !== null);
      // Prefer: all races first, then black, then white
      const sorted = matches.sort((a, b) => {
        const order = ["all", "black", "white", "hispanic", "other"];
        return order.indexOf(a.race) - order.indexOf(b.race);
      });
      grantRows.push(...sorted);
    }

    // Collect SDOH context rows
    const sdohRows: Indicator[] = [];
    for (const name of SDOH_INDICATORS) {
      const match = indicators.find((i) => i.name === name && i.race === "all" && i.value !== null);
      if (match) sdohRows.push(match);
    }

    function toRow(i: Indicator): string {
      return [
        csvCell(i.name),
        csvCell(i.race === "all" ? "All groups" : i.race.charAt(0).toUpperCase() + i.race.slice(1)),
        csvCell(i.value),
        csvCell(i.unit),
        csvCell(i.va_average),
        csvCell(i.year),
        csvCell(i.source),
        csvCell(i.source_url),
        csvCell(vintage(i.year)),
        csvCell(i.definition),
      ].join(",");
    }

    const sections = [
      header,
      "# --- MATERNAL HEALTH INDICATORS ---",
      colHeaders,
      ...grantRows.map(toRow),
      "#",
      "# --- SOCIAL DETERMINANTS OF HEALTH (CONTEXT) ---",
      colHeaders,
      ...sdohRows.map(toRow),
    ];

    const csv = sections.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `richmond-maternal-health-grant-pack-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={buildGrantPack}
      className="flex items-center gap-2 text-sm bg-emerald-700 text-white rounded-lg px-4 py-2 hover:bg-emerald-800 transition-colors font-semibold shadow-sm"
    >
      <span>⬇</span>
      <span>Grant Pack</span>
      <span className="text-xs bg-emerald-600 rounded px-1.5 py-0.5 font-normal">10 indicators + citations</span>
    </button>
  );
}
