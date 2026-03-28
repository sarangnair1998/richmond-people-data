"use client";

import translations, { type Lang } from "@/lib/translations";

type Props = { lang: Lang };

export default function AboutPage({ lang }: Props) {
  const t = translations[lang].about;

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">

      {/* Mission */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">{t.missionTitle}</h2>
        <p className="text-slate-600 leading-relaxed">{t.mission1}</p>
        <p className="text-slate-600 leading-relaxed mt-3">{t.mission2}</p>
      </div>

      {/* What it can do */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">{t.capabilityTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t.capabilities.map((item) => (
            <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800 mb-1">{item.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What it could become */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">{t.futureTitle}</h2>
        <div className="space-y-3">
          {t.futures.map((item) => (
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
        <h2 className="text-xl font-bold text-slate-900 mb-4">{t.sourcesTitle}</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {t.sources.map((row, i) => (
            <div key={row.source} className={`flex flex-wrap gap-2 px-4 py-3 text-xs ${i % 2 === 1 ? "bg-slate-50" : ""}`}>
              <span className="font-semibold text-slate-700 w-48 flex-shrink-0">{row.source}</span>
              <span className="text-slate-500 flex-1">{row.covers}</span>
              <span className="text-slate-400 whitespace-nowrap">{row.year}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">{t.disclaimer}</p>
      </div>

    </main>
  );
}
