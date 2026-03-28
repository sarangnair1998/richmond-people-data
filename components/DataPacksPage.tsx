"use client";

import type { Indicator } from "@/lib/data";
import translations, { type Lang } from "@/lib/translations";

type Persona = {
  label: string;
  indicators: string[];
  includeAllRaces?: boolean;
  icon: string;
};

const PERSONAS: Persona[] = [
  {
    label: "NGO / Grants Lead",
    icon: "📋",
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
    indicators: [],
  },
  {
    label: "Healthcare Professional",
    icon: "🏥",
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
    indicators: [],
  },
  {
    label: "Government Official",
    icon: "🏢",
    indicators: [],
  },
  {
    label: "Common Public",
    icon: "👥",
    indicators: [
      "Preterm Birth Rate", "Infant Mortality Rate", "Poverty Rate",
      "4-Year Graduation Rate", "Uninsured Adults", "Obesity",
      "HIV New Diagnoses Rate", "Median Household Income",
    ],
  },
  {
    label: "Legal / Advocacy",
    icon: "⚖️",
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

type Props = { indicators: Indicator[]; lang: Lang };

export default function DataPacksPage({ indicators, lang }: Props) {
  const t = translations[lang].dataPacks;

  function download(persona: Persona, idx: number) {
    const dateStr = new Date().toISOString().split("T")[0];
    const pt = t.personas[idx];
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
      `# ${pt.description}`,
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
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.title}</h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PERSONAS.map((persona, idx) => {
          const pt = t.personas[idx];
          return (
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
                  <p className="text-xs font-medium text-blue-600">{pt.description}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed flex-1">{pt.detail}</p>
              <button
                onClick={() => download(persona, idx)}
                className="w-full text-sm font-semibold bg-slate-900 text-white rounded-lg px-4 py-2.5 hover:bg-blue-700 transition-colors text-center"
              >
                {t.downloadBtn}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
