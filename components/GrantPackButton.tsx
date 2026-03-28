"use client";

import { useState, useRef, useEffect } from "react";
import type { Indicator } from "@/lib/data";

type Persona = {
  label: string;
  description: string;
  indicators: string[];
  includeAllRaces?: boolean;
};

const PERSONAS: Persona[] = [
  {
    label: "NGO / Grants Lead",
    description: "Grant-ready maternal & child health pack",
    indicators: [
      "Preterm Birth Rate", "Low Birth Weight (<2,500g)", "Very Low Birth Weight (<1,500g)",
      "Infant Mortality Rate", "Late or No Prenatal Care", "Resident Live Births",
      "Poverty Rate", "Child Poverty Rate (Under 18)", "Uninsured Adults",
      "Women of Childbearing Age (15–44)", "Median Household Income",
    ],
  },
  {
    label: "Policy Maker",
    description: "Broad outcomes + equity + benchmarking",
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
    description: "Full dataset — all indicators, all races, all years",
    indicators: [], // empty = include everything
  },
  {
    label: "Healthcare Professional",
    description: "Clinical burden + access indicators",
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
    description: "Education outcomes + child poverty context",
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
    description: "Full dataset with all metadata fields",
    indicators: [], // empty = include everything
  },
  {
    label: "Government Official",
    description: "All indicators with VA benchmark comparisons",
    indicators: [], // empty = include everything, filter to va_average available
  },
  {
    label: "Common Public",
    description: "8 plain-language community indicators",
    indicators: [
      "Preterm Birth Rate", "Infant Mortality Rate", "Poverty Rate",
      "4-Year Graduation Rate", "Uninsured Adults", "Obesity",
      "HIV New Diagnoses Rate", "Median Household Income",
    ],
  },
  {
    label: "Legal / Advocacy",
    description: "Equity gaps + disparity ratios",
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
    description: "Market sizing + health burden",
    indicators: [
      "Total Population", "Median Household Income", "Median Gross Rent",
      "Uninsured Adults", "Obesity", "Diabetes", "Depression",
      "Poverty Rate", "Population — Non-Hispanic Black", "Population — Non-Hispanic White",
      "Population — Hispanic or Latino",
    ],
  },
  {
    label: "Student",
    description: "Key indicators with full definitions",
    indicators: [
      "Preterm Birth Rate", "Infant Mortality Rate", "Poverty Rate",
      "4-Year Graduation Rate", "Uninsured Adults", "Obesity",
      "HIV New Diagnoses Rate", "Median Household Income",
    ],
  },
];

type Props = { indicators: Indicator[] };

function csvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  return `"${String(val).replace(/"/g, "'")}"`;
}

function vintage(year: number | null): string {
  if (!year) return "";
  return year <= 2023 ? "Final" : "Provisional";
}

export default function GrantPackButton({ indicators }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function download(persona: Persona) {
    setOpen(false);
    const dateStr = new Date().toISOString().split("T")[0];

    let rows: Indicator[];
    if (persona.indicators.length === 0) {
      // Researcher / Data Analyst / Government Official — full dataset
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
      `# Generated: ${dateStr} · Source: RVA People Data (richmond-people-data.vercel.app)`,
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm bg-emerald-700 text-white rounded-lg px-4 py-2 hover:bg-emerald-800 transition-colors font-semibold shadow-sm"
      >
        <span>⬇</span>
        <span>Grant Pack</span>
        <span className="text-emerald-300 text-xs">{open ? "▲" : "▾"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Select your role
          </div>
          {PERSONAS.map((persona) => (
            <button
              key={persona.label}
              onClick={() => download(persona)}
              className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0"
            >
              <div className="text-sm font-semibold text-slate-800">{persona.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{persona.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
