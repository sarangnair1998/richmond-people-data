"use client";

import translations, { type Lang } from "@/lib/translations";

type Props = { lang: Lang };

export default function AboutPage({ lang }: Props) {
  const t = translations[lang].about;

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1e4d8c 100%)" }}>
        <div className="px-8 py-10">
          <h2 className="text-2xl font-bold text-white mb-3">{t.heroTitle}</h2>
          <p className="text-blue-200 leading-relaxed text-sm max-w-2xl">{t.heroSubtitle}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/10">
          {t.statsRow.map((s) => (
            <div key={s.label} className="px-6 py-5 border-r border-white/10 last:border-r-0">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-blue-300 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MCP API */}
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-violet-900 mb-1">🤖 {t.mcpTitle}</h2>
          <p className="text-sm text-violet-800 leading-relaxed">{t.mcpDesc}</p>
          <div className="mt-3 flex items-center gap-2 bg-violet-100 border border-violet-200 rounded-lg px-4 py-2.5 w-fit">
            <span className="text-xs text-violet-500 font-medium">Endpoint</span>
            <code className="text-xs font-mono text-violet-900 font-semibold">{t.mcpUrl}</code>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {t.mcpTools.map((tool) => (
            <div key={tool.name} className="bg-white rounded-xl border border-violet-100 px-4 py-3">
              <p className="text-xs font-mono font-bold text-violet-700 mb-1">{tool.name}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{tool.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Problem */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-3">{t.problemTitle}</h2>
        <p className="text-slate-600 leading-relaxed text-sm">{t.problemBody}</p>
      </div>

      {/* What we built */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">{t.capabilityTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {t.capabilities.map((item) => (
            <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{item.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Who it serves */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 px-7 py-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">{t.whoTitle}</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{t.whoBody}</p>
      </div>

      {/* Where this goes next */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">{t.futureTitle}</h2>
        <div className="space-y-3">
          {t.futures.map((item) => (
            <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
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
