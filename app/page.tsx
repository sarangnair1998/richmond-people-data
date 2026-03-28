"use client";

import { useEffect, useState, useMemo } from "react";
import StatCard from "@/components/StatCard";
import IndicatorChart from "@/components/IndicatorChart";
import DataTable from "@/components/DataTable";
import ExportCSV from "@/components/ExportCSV";
import ChartBuilder from "@/components/ChartBuilder";
import DisparityCallout from "@/components/DisparityCallout";
import GrantPackButton from "@/components/GrantPackButton";
import { getAllIndicators, type Indicator } from "@/lib/data";

type Tab = "health" | "population" | "poverty" | "education";

const TABS: { id: Tab; label: string }[] = [
  { id: "health", label: "Health" },
  { id: "population", label: "Population" },
  { id: "poverty", label: "Poverty" },
  { id: "education", label: "Education" },
];

const STAT_CARDS: Record<Tab, Array<{
  label: string; name: string; race: string; source: string;
  color: string; decimals: number; prefix?: string; unit?: string;
}>> = {
  health: [
    { label: "Preterm Birth Rate", name: "Preterm Birth Rate", race: "all", source: "CDC WONDER 2024", color: "border-red-600", decimals: 1, unit: "%" },
    { label: "Infant Mortality Rate", name: "Infant Mortality Rate", race: "all", source: "VDH 2020", color: "border-red-500", decimals: 1, unit: "/1k" },
    { label: "Uninsured Adults", name: "Uninsured Adults", race: "all", source: "Census 2023", color: "border-amber-500", decimals: 1, unit: "%" },
    { label: "Depression", name: "Depression", race: "all", source: "CDC PLACES 2022", color: "border-orange-500", decimals: 1, unit: "%" },
  ],
  population: [
    { label: "Total Population", name: "Total Population", race: "all", source: "Census 2023", color: "border-blue-600", decimals: 0 },
    { label: "Median Age", name: "Median Age", race: "all", source: "Census 2023", color: "border-cyan-500", decimals: 1, unit: " yrs" },
    { label: "Children Under 5", name: "Population Under 5", race: "all", source: "Census 2023", color: "border-green-500", decimals: 0 },
    { label: "Women 15–44", name: "Women of Childbearing Age (15–44)", race: "all", source: "Census 2023", color: "border-purple-500", decimals: 0 },
  ],
  poverty: [
    { label: "Poverty Rate", name: "Poverty Rate", race: "all", source: "Census 2023", color: "border-amber-500", decimals: 1, unit: "%" },
    { label: "People Below Poverty", name: "People Below Poverty Line", race: "all", source: "Census 2023", color: "border-red-500", decimals: 0 },
    { label: "Child Poverty Rate", name: "Child Poverty Rate (Under 18)", race: "all", source: "Census 2023", color: "border-orange-500", decimals: 1, unit: "%" },
    { label: "Cost Burdened Renters", name: "Renters — Cost Burdened (30%+ income on rent)", race: "all", source: "Census 2023", color: "border-yellow-500", decimals: 1, unit: "%" },
  ],
  education: [
    { label: "Student Enrollment", name: "Total Student Enrollment", race: "all", source: "VDOE 2025", color: "border-green-600", decimals: 0 },
    { label: "Graduation Rate", name: "4-Year Graduation Rate", race: "all", source: "VDOE 2025", color: "border-blue-600", decimals: 1, unit: "%" },
    { label: "SOL Reading Pass Rate", name: "SOL Pass Rate — Reading", race: "all", source: "VDOE 2025", color: "border-cyan-500", decimals: 0, unit: "%" },
    { label: "Chronic Absenteeism", name: "Chronic Absenteeism Rate", race: "all", source: "VDOE 2025", color: "border-amber-500", decimals: 1, unit: "%" },
  ],
};

const DEFAULT_CHART: Record<Tab, string> = {
  health: "Preterm Birth Rate",
  population: "Total Population",
  poverty: "Poverty Rate",
  education: "4-Year Graduation Rate",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("health");
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndicator, setSelectedIndicator] = useState(DEFAULT_CHART["health"]);
  const [selectedRace, setSelectedRace] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    getAllIndicators()
      .then(setIndicators)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // When tab changes, reset chart selection
  useEffect(() => {
    setSelectedIndicator(DEFAULT_CHART[activeTab]);
    setSelectedRace("all");
  }, [activeTab]);

  const tabIndicators = useMemo(
    () => indicators.filter((i) => i.category === activeTab),
    [indicators, activeTab]
  );

  // Unique indicator names for dropdown (race=all only, with va_average)
  const chartableNames = useMemo(
    () => Array.from(new Set(
      tabIndicators
        .filter((i) => i.value !== null)
        .map((i) => i.name)
    )).sort(),
    [tabIndicators]
  );

  // Unique races for selected indicator
  const availableRaces = useMemo(
    () => Array.from(new Set(
      tabIndicators.filter((i) => i.name === selectedIndicator && i.value !== null).map((i) => i.race)
    )).sort(),
    [tabIndicators, selectedIndicator]
  );

  // Download only the checked rows from the table
  function downloadSelected() {
    const rows = indicators.filter((i) => selectedIds.includes(i.id));
    const headers = ["Indicator", "Race/Group", "Value", "Unit", "VA Average", "Source", "Year", "Definition"];
    const csvRows = rows.map((i) => [
      `"${i.name}"`, i.race, i.value ?? "", `"${i.unit}"`,
      i.va_average ?? "", `"${i.source}"`, i.year ?? "",
      `"${(i.definition ?? "").replace(/"/g, "'")}"`,
    ]);
    const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `richmond-selected-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Stat card values from live data
  function getCardValue(name: string, race: string): number {
    const match = indicators.find((i) => i.name === name && i.race === race && i.value !== null);
    return match?.value ?? 0;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header style={{ backgroundColor: "#1e3a5f" }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">RVA People Data</h1>
            <p className="text-xs text-blue-200 mt-0.5">Richmond City · Official Government Sources Only</p>
          </div>
          <div className="flex gap-2">
            {["Census", "VDH", "VDOE", "CDC"].map((s) => (
              <span key={s} className="text-xs bg-white/10 text-blue-100 rounded-full px-2 py-0.5 border border-white/20">
                {s}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav style={{ backgroundColor: "#1e3a5f" }} className="border-t border-white/10">
        <div className="max-w-6xl mx-auto flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-400 text-white"
                  : "border-transparent text-blue-200 hover:text-white hover:border-blue-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
            Loading data…
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STAT_CARDS[activeTab].map((card) => (
                <StatCard
                  key={card.name + card.race}
                  label={card.label}
                  value={getCardValue(card.name, card.race)}
                  unit={card.unit ?? ""}
                  prefix={card.prefix ?? ""}
                  source={card.source}
                  year=""
                  color={card.color}
                  decimals={card.decimals}
                />
              ))}
            </div>

            {/* Racial Disparity Callout */}
            <DisparityCallout indicators={tabIndicators} />

            {/* Chart Controls + Chart */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 items-center">
                <select
                  value={selectedIndicator}
                  onChange={(e) => { setSelectedIndicator(e.target.value); setSelectedRace("all"); }}
                  className="text-sm border border-slate-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {chartableNames.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                {availableRaces.length > 1 && (
                  <select
                    value={selectedRace}
                    onChange={(e) => setSelectedRace(e.target.value)}
                    className="text-sm border border-slate-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableRaces.map((r) => (
                      <option key={r} value={r}>{r === "all" ? "All groups" : r}</option>
                    ))}
                  </select>
                )}
              </div>
              <IndicatorChart
                indicators={tabIndicators}
                selectedName={selectedIndicator}
                selectedRace={selectedRace}
              />
            </div>

            {/* Data Table + Export */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">All Indicators</h2>
                <div className="flex items-center gap-2">
                  {selectedIds.length > 0 && (
                    <button
                      onClick={downloadSelected}
                      className="flex items-center gap-2 text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors font-medium"
                    >
                      ↓ Download Selected ({selectedIds.length})
                    </button>
                  )}
                  <GrantPackButton indicators={indicators} />
                  <ExportCSV
                    indicators={tabIndicators}
                    filename={`richmond-${activeTab}-data.csv`}
                  />
                </div>
              </div>
              <DataTable indicators={tabIndicators} onSelectionChange={setSelectedIds} />
            </div>

            {/* Chart Builder */}
            <ChartBuilder indicators={indicators} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 px-6 py-6">
        <div className="max-w-6xl mx-auto text-xs text-slate-400 flex flex-wrap gap-4 justify-between">
          <span>
            Data sourced from U.S. Census Bureau (ACS 5-Year 2023), Virginia Department of Health (2020),
            Virginia Department of Education (2024–2025), and CDC PLACES (2022).
          </span>
          <span>Not an official City of Richmond publication · Last refresh: March 28, 2026</span>
        </div>
      </footer>
    </div>
  );
}
