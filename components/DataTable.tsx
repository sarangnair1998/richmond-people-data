"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import type { Indicator } from "@/lib/data";

const col = createColumnHelper<Indicator>();

type Props = {
  indicators: Indicator[];
  onSelectionChange?: (ids: string[]) => void;
};

export default function DataTable({ indicators, onSelectionChange }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [subcatFilter, setSubcatFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const subcategories = useMemo(
    () => ["all", ...Array.from(new Set(indicators.map((i) => i.subcategory ?? "other"))).sort()],
    [indicators]
  );
  const years = useMemo(
    () => ["all", ...Array.from(new Set(indicators.map((i) => String(i.year ?? "")))).filter(Boolean).sort().reverse()],
    [indicators]
  );

  const filtered = useMemo(() => {
    const tokens = globalFilter.toLowerCase().split(/\s+/).filter(Boolean);
    return indicators.filter((i) => {
      if (subcatFilter !== "all" && i.subcategory !== subcatFilter) return false;
      if (yearFilter !== "all" && String(i.year) !== yearFilter) return false;
      if (tokens.length === 0) return true;
      const haystack = [i.name, i.race, i.source, i.subcategory ?? "", String(i.year ?? "")]
        .join(" ").toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [indicators, subcatFilter, yearFilter, globalFilter]);

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      onSelectionChange?.([...next]);
      return next;
    });
  }

  function toggleAll(visibleIds: string[]) {
    setSelectedIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      onSelectionChange?.([...next]);
      return next;
    });
  }

  const columns = useMemo(() => [
    col.display({
      id: "select",
      header: ({ table }) => {
        const visibleIds = table.getRowModel().rows.map((r) => r.original.id);
        const allChecked = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
        return (
          <input
            type="checkbox"
            checked={allChecked}
            onChange={() => toggleAll(visibleIds)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        );
      },
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.original.id)}
          onChange={() => toggleId(row.original.id)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    }),
    col.accessor("name", {
      header: "Indicator",
      cell: (i) => {
        const definition = i.row.original.definition;
        return (
          <span className="flex items-center gap-1.5">
            <span className="font-medium text-slate-800">{i.getValue()}</span>
            {definition && (
              <span className="relative group">
                <span className="text-slate-400 hover:text-blue-500 cursor-help text-xs leading-none">ⓘ</span>
                <span className="pointer-events-none absolute left-0 top-5 z-10 w-64 rounded-lg bg-slate-900 text-white text-xs px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  {definition}
                </span>
              </span>
            )}
          </span>
        );
      },
    }),
    col.accessor("race", {
      header: "Race/Group",
      cell: (i) => <span className="capitalize">{i.getValue()}</span>,
    }),
    col.accessor("value", {
      header: "Value",
      cell: (i) => {
        const v = i.getValue();
        const unit = i.row.original.unit;
        if (v === null) return <span className="text-slate-300">—</span>;
        const formatted = v >= 1000 ? v.toLocaleString() : v % 1 === 0 ? v.toString() : v.toFixed(1);
        return <span className="font-mono font-semibold text-slate-900">{formatted}{unit === "%" ? "%" : ""}</span>;
      },
    }),
    col.accessor("va_average", {
      header: "VA Avg",
      cell: (i) => {
        const v = i.getValue();
        const unit = i.row.original.unit;
        if (v === null) return <span className="text-slate-300">—</span>;
        return <span className="font-mono text-slate-500">{v % 1 === 0 ? v : v.toFixed(1)}{unit === "%" ? "%" : ""}</span>;
      },
    }),
    col.accessor("source", {
      header: "Source",
      cell: (i) => (
        <a
          href={i.row.original.source_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 hover:bg-blue-50 hover:text-blue-700 transition-colors"
        >
          {i.getValue()}
        </a>
      ),
    }),
    col.accessor("year", {
      header: "Year",
      cell: (i) => <span className="text-slate-400 text-sm">{i.getValue() ?? "—"}</span>,
    }),
  ], [selectedIds]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center p-4 border-b border-slate-100">
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search indicators..."
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={subcatFilter}
          onChange={(e) => setSubcatFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {subcategories.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All subcategories" : s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y === "all" ? "All years" : y}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400 ml-auto">
          {table.getRowModel().rows.length} rows
          {selectedIds.size > 0 && (
            <span className="ml-2 text-blue-600 font-semibold">· {selectedIds.size} selected</span>
          )}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-slate-50 border-b border-slate-100">
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    onClick={h.column.id !== "select" ? h.column.getToggleSortingHandler() : undefined}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-800 whitespace-nowrap"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() === "asc" ? " ↑" : h.column.getIsSorted() === "desc" ? " ↓" : ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={`border-b border-slate-50 hover:bg-blue-50 transition-colors ${
                  selectedIds.has(row.original.id) ? "bg-blue-50/60" : idx % 2 === 1 ? "bg-slate-50/50" : ""
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
