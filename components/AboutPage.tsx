"use client";

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">

      {/* Mission */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">What is RVA People Data?</h2>
        <p className="text-slate-600 leading-relaxed">
          RVA People Data is a unified maternal health indicator dashboard for Richmond, Virginia.
          It exists because nonprofit analysts, grant writers, and health researchers across the city
          spend 6–8 hours per grant application pulling the same core metrics — preterm birth rates,
          infant mortality, poverty, uninsured rates — from five different government sources.
          This tool aggregates those sources into one place, with full citations, race-disaggregated
          breakdowns, and export-ready data packs.
        </p>
        <p className="text-slate-600 leading-relaxed mt-3">
          Every number traces to a confirmed public source. No private data. No clinical claims. No PII.
          Built for organizations, not patients.
        </p>
      </div>

      {/* What it can do */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">What it can do today</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "173 public indicators", desc: "Health, population, poverty, and education — all sourced from VDH, CDC, Census, and VDOE." },
            { title: "Race-disaggregated data", desc: "Black, White, Hispanic, Asian breakdowns wherever available, for equity analysis." },
            { title: "Richmond vs. Virginia", desc: "Benchmark any indicator against the Virginia state average where data is available." },
            { title: "Persona-based data packs", desc: "One-click export curated for 11 roles — NGO grants lead, policy maker, researcher, educator, and more." },
            { title: "Trend charts", desc: "Multi-year indicators automatically render as trend lines. Single-year indicators show Richmond vs. Virginia." },
            { title: "Equity Snapshot", desc: "Automatically surfaces indicators where racial groups differ most, across every data tab." },
            { title: "Fuzzy search", desc: "Typo-tolerant search across all 173 indicators. Token matching so 'birth black' filters correctly." },
            { title: "Final / Provisional badges", desc: "Every stat card shows whether the underlying data year is final or provisional — a trust signal for researchers." },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800 mb-1">{item.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What it could become */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">What it could become with a few tweaks</h2>
        <div className="space-y-3">
          {[
            { title: "HOI neighborhood map layer", desc: "Virginia Health Opportunity Index covers 1,875 census tracts with 20 SDOH fields. Zero API authentication required. Adding it would connect maternal outcomes to place — showing which neighborhoods drive the city-wide numbers." },
            { title: "Automated annual refresh", desc: "The data pipeline is already scripted in Python. Connecting it to a GitHub Actions cron job would make the dashboard self-updating every year without staff intervention." },
            { title: "Multi-race trend comparisons", desc: "The chart currently shows one race group at a time. Overlaying Black and White trend lines on the same chart would make the divergence — or convergence — visible at a glance." },
            { title: "Grant narrative generator", desc: "The data packs already include definitions and citations. Wrapping them in a simple template engine would output a formatted methodology section ready to paste into an RFP." },
            { title: "API endpoint for partner tools", desc: "A single read-only API endpoint would let health coalition partners pull Richmond indicators directly into their own dashboards or reports without duplicating the data work." },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 bg-white rounded-xl border border-slate-200 p-4">
              <div className="w-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{item.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data sources */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Data sources</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {[
            { source: "VDH Vital Statistics", covers: "Infant mortality, birth outcomes, preterm births, teen births — race-disaggregated", year: "2018–2020" },
            { source: "CDC WONDER Natality", covers: "Preterm birth rate, low birth weight, prenatal care access", year: "2016–2024" },
            { source: "U.S. Census ACS 5-Year", covers: "Population, poverty, housing cost burden, uninsured rates, median income", year: "2023" },
            { source: "CDC PLACES", covers: "Health behaviors and outcomes — obesity, depression, diabetes, smoking, asthma", year: "2022" },
            { source: "AIDSVu", covers: "HIV new diagnoses and prevalence rates by race", year: "2018–2023" },
            { source: "VDOE School Quality Profiles", covers: "Graduation rates, SOL pass rates, chronic absenteeism, enrollment", year: "2008–2025" },
          ].map((row, i) => (
            <div key={row.source} className={`flex flex-wrap gap-2 px-4 py-3 text-xs ${i % 2 === 1 ? "bg-slate-50" : ""}`}>
              <span className="font-semibold text-slate-700 w-48 flex-shrink-0">{row.source}</span>
              <span className="text-slate-500 flex-1">{row.covers}</span>
              <span className="text-slate-400 whitespace-nowrap">{row.year}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Not an official City of Richmond publication. All data is sourced from confirmed public government datasets.
        </p>
      </div>

    </main>
  );
}
