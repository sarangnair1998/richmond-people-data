"use client";

import type { Indicator } from "@/lib/data";

type Persona = {
  label: string;
  description: string;
  detail: string;
  indicators: string[];
  includeAllRaces?: boolean;
  icon: string;
};

const PERSONAS: Persona[] = [
  {
    label: "NGO / Grants Lead",
    icon: "📋",
    description: "Grant-ready maternal & child health pack",
    detail: "Preterm birth, low birth weight, infant mortality, prenatal care, poverty, uninsured adults, women 15–44, median income. Race=all. Includes full citations.",
    indicators: [
      "Preterm Birth Rate", "Low Birth Weight (<2,500g)", "Very Low Birth Weight (<1,500g)",
      "Infant Mortality Rate", "Late or No Prenatal Care", "Resident Live Births",
      "Poverty Rate", "Child Poverty Rate (Under 18)", "Uninsured Adults",
      "Women of Childbearing Age (15–44)", "Median Household Income",
    ],
  },
  {
    label: "Policy Maker",
    icon: "🏛️",
    description: "Broad outcomes + equity + benchmarking",
    detail: "Health outcomes, HIV rates, poverty, graduation rate, population by race. Includes all racial groups and VA benchmarks.",
    indicators: [
      "Preterm Birth Rate", "Infant Mortality Rate", "Low Birth Weight (<2,500g)",
      "HIV New Diagnoses Rate", "Uninsured Adults", "Obesity", "Depression",
      "Poverty Rate", "Child Poverty Rate (Under 18)", "4-Year Graduation Rate",
      "Total Population", "Median Household Income",
    ],
    includeAllRaces: true,
  },
  {
    label: "Researcher",
    icon: "🔬",
    description: "Full dataset — all indicators, all races, all years",
    detail: "Every indicator in the database with all race groups, all years, full definitions, source URLs, and data vintage labels.",
    indicators: [],
  },
  {
    label: "Healthcare Professional",
    icon: "🏥",
    description: "Clinical burden + access indicators",
    detail: "Birth outcomes, HIV, chronic disease burden, behavioral risk factors, insurance access. All race groups included.",
    indicators: [
      "Preterm Birth Rate", "Low Birth Weight (<2,500g)", "Infant Mortality Rate",
      "Late or No Prenatal Care", "HIV New Diagnoses Rate", "HIV Prevalence Rate",
      "Obesity", "Diabetes", "Depression", "Coronary Heart Disease", "Current Asthma",
      "Uninsured Adults", "Current Cigarette Smoking", "Binge Drinking",
    ],
    includeAllRaces: true,
  },
  {
    label: "Educator / Teacher",
    icon: "📚",
    description: "Education outcomes + child poverty context",
    detail: "Graduation rates, SOL pass rates, absenteeism, dropout rate, free lunch eligibility, child poverty. All race groups.",
    indicators: [
      "4-Year Graduation Rate", "SOL Pass Rate — Reading", "SOL Pass Rate — Math",
      "SOL Pass Rate — Science", "SOL Pass Rate — Writing", "SOL Pass Rate — History",
      "Chronic Absenteeism Rate", "Dropout Rate", "Total Student Enrollment",
      "Postsecondary Enrollment Rate", "Child Poverty Rate (Under 18)",
      "Students Qualifying for Free Lunch (CEP)",
    ],
    includeAllRaces: true,
  },
  {
    label: "Data Analyst",
    icon: "📊",
    description: "Full dataset with all metadata fields",
    detail: "Same as Researcher — all indicators with definitions, source URLs, vintage, and notes. Optimized for import into analysis tools.",
    indicators: [],
  },
  {
    label: "Government Official",
    icon: "🏢",
    description: "All indicators with VA benchmark comparisons",
    detail: "Only indicators that have a Virginia state average for benchmarking. Useful for policy reporting and cross-jurisdiction comparison.",
    indicators: [],
  },
  {
    label: "Common Public",
    icon: "👥",
    description: "8 plain-language community indicators",
    detail: "Preterm birth, infant mortality, poverty rate, graduation rate, uninsured adults, obesity, HIV, median income. No jargon.",
    indicators: [
      "Preterm Birth Rate", "Infant Mortality Rate", "Poverty Rate",
      "4-Year Graduation Rate", "Uninsured Adults", "Obesity",
      "HIV New Diagnoses Rate", "Median Household Income",
    ],
  },
  {
    label: "Legal / Advocacy",
    icon: "⚖️",
    description: "Equity gaps + disparity ratios",
    detail: "Infant mortality, low birth weight, HIV, graduation rate, poverty — all with full racial breakdowns for disparity analysis.",
    indicators: [
      "Infant Mortality Rate", "Infant Mortality Rate — Black–White Ratio",
      "Infant Mortality Rate — Black–White Difference",
      "Low Birth Weight (<2,500g)", "Very Low Birth Weight (<1,500g)",
      "HIV New Diagnoses Rate", "HIV Prevalence Rate",
      "4-Year Graduation Rate", "Poverty Rate", "Child Poverty Rate (Under 18)",
    ],
    includeAllRaces: true,
  },
  {
    label: "Companies / Services",
    icon: "🏗️",
    description: "Market sizing + health burden",
    detail: "Population totals by race, median income, rent, uninsured rate, chronic disease burden. Useful for market analysis and program planning.",
    indicators: [
      "Total Population", "Median Household Income", "Median Gross Rent",
      "Uninsured Adults", "Obesity", "Diabetes", "Depression",
      "Poverty Rate", "Population — Non-Hispanic Black", "Population — Non-Hispanic White",
      "Population — Hispanic or Latino",
    ],
  },
  {
    label: "Student",
    icon: "🎓",
    description: "Key indicators with full definitions",
    detail: "Same 8 indicators as Common Public but every field includes the full definition — useful for reports, papers, or presentations.",
    indicators: [
      "Preterm Birth Rate", "Infant Mortality Rate", "Poverty Rate",
      "4-Year Graduation Rate", "Uninsured Adults", "Obesity",
      "HIV New Diagnoses Rate", "Median Household Income",
    ],
  },
];

function csvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  return `"${String(val).replace(/"/g, "'")}"`;
}

function vintage(year: number | null): string {
  if (!year) return "";
  return year <= 2023 ? "Final" : "Provisional";
}

type Props = { indicators: Indicator[] };

export default function DataPacksPage({ indicators }: Props) {
  function download(persona: Persona) {
    const dateStr = new Date().toISOString().split("T")[0];
    let rows: Indicator[];

    if (persona.indicators.length === 0) {
      rows = persona.label === "Government Official"
        ? indicators.filter((i) => i.va_average !== null)
        : indicators.filter((i) => i.value !== null);
    } else {
      const nameSet = new Set(persona.indicators);
      rows = indicators.filter((i) => {
        if (!nameSet.has(i.name) || i.value === null) return false;
        if (!persona.includeAllRaces) return i.race === "all";
        return true;
      });
    }

    const header = [
      `# Richmond City Data Pack — ${persona.label}`,
      `# ${persona.description}`,
      `# Generated: ${dateStr} · Source: RVA People Data`,
      `# Data sources: VDH Vital Statistics, CDC WONDER Natality, U.S. Census ACS 5-Year 2023, CDC PLACES 2022, AIDSVu, VDOE`,
      `# Geography: Richmond City, Virginia (FIPS 51760)`,
      `#`,
    ].join("\n");

    const colHeaders = [
      "Indicator", "Race/Group", "Value", "Unit", "VA Average",
      "Year", "Data Vintage", "Source", "Source URL", "Definition",
    ].join(",");

    const dataRows = rows.map((i) => [
      csvCell(i.name),
      csvCell(i.race === "all" ? "All groups" : i.race.charAt(0).toUpperCase() + i.race.slice(1)),
      csvCell(i.value),
      csvCell(i.unit),
      csvCell(i.va_average),
      csvCell(i.year),
      csvCell(vintage(i.year)),
      csvCell(i.source),
      csvCell(i.source_url),
      csvCell(i.definition),
    ].join(","));

    const csv = [header, colHeaders, ...dataRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `richmond-${persona.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Data Packs</h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Select your role to download a curated CSV with the indicators most relevant to your work —
          pre-formatted with source citations, data vintage, and definitions. No spreadsheet assembly required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PERSONAS.map((persona) => (
          <div
            key={persona.label}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{persona.icon}</span>
                  <span className="text-sm font-semibold text-slate-800">{persona.label}</span>
                </div>
                <p className="text-xs font-medium text-blue-600">{persona.description}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed flex-1">{persona.detail}</p>
            <button
              onClick={() => download(persona)}
              className="w-full text-sm font-semibold bg-slate-900 text-white rounded-lg px-4 py-2.5 hover:bg-blue-700 transition-colors text-center"
            >
              ↓ Download Pack
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
