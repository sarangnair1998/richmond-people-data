"use client";

import { useState, useCallback } from "react";
import * as XLSX from "xlsx";

type Step = "login" | "upload" | "mapping" | "preview" | "done";

const SCHEMA_FIELDS = [
  { key: "name", label: "Indicator Name", required: true },
  { key: "race", label: "Race / Group", required: true },
  { key: "year", label: "Year", required: true },
  { key: "value", label: "Value", required: true },
  { key: "unit", label: "Unit", required: false },
  { key: "va_average", label: "VA Average", required: false },
  { key: "source", label: "Source", required: false },
  { key: "source_url", label: "Source URL", required: false },
  { key: "definition", label: "Definition", required: false },
  { key: "category", label: "Category", required: false },
  { key: "subcategory", label: "Subcategory", required: false },
] as const;

type SchemaKey = (typeof SCHEMA_FIELDS)[number]["key"];

export default function AdminPage() {
  const [step, setStep] = useState<Step>("login");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authedPassword, setAuthedPassword] = useState("");

  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [fileRows, setFileRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");

  const [mapping, setMapping] = useState<Partial<Record<SchemaKey, string>>>({});
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);

  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ inserted: number } | null>(null);
  const [uploadError, setUploadError] = useState("");

  // ── Login ────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ rows: [] }),
    });
    if (res.status === 401) {
      setAuthError("Incorrect password.");
      return;
    }
    setAuthedPassword(password);
    setStep("upload");
  }

  // ── File parse ───────────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      if (!json.length) return;
      const cols = Object.keys(json[0]);
      setFileColumns(cols);
      setFileRows(json);

      // Auto-map columns that closely match schema field names
      const autoMap: Partial<Record<SchemaKey, string>> = {};
      for (const field of SCHEMA_FIELDS) {
        const match = cols.find(
          (c) => c.toLowerCase().replace(/[\s_-]/g, "") === field.key.toLowerCase().replace(/[\s_-]/g, "")
            || c.toLowerCase().includes(field.key.toLowerCase())
        );
        if (match) autoMap[field.key] = match;
      }
      setMapping(autoMap);
      setStep("mapping");
    };
    reader.readAsArrayBuffer(file);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // ── Build preview ────────────────────────────────────────────────────────
  function buildPreview() {
    const rows = fileRows.slice(0, 200).map((row) => {
      const mapped: Record<string, unknown> = {};
      for (const field of SCHEMA_FIELDS) {
        const col = mapping[field.key];
        mapped[field.key] = col ? row[col] : "";
      }
      return mapped;
    });
    setPreview(rows);
    setStep("preview");
  }

  // ── Upload ───────────────────────────────────────────────────────────────
  async function handleUpload() {
    setUploading(true);
    setUploadError("");
    const allRows = fileRows.map((row) => {
      const mapped: Record<string, unknown> = {};
      for (const field of SCHEMA_FIELDS) {
        const col = mapping[field.key];
        mapped[field.key] = col ? row[col] : "";
      }
      return mapped;
    });
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": authedPassword },
      body: JSON.stringify({ rows: allRows }),
    });
    const json = await res.json();
    setUploading(false);
    if (!res.ok) {
      setUploadError(json.error ?? "Upload failed.");
      return;
    }
    setResult(json);
    setStep("done");
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  if (step === "login") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-sm">
          <div className="mb-6">
            <div className="text-2xl font-bold text-slate-900 mb-1">Data Upload</div>
            <p className="text-sm text-slate-500">Richmond People Data · Admin</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {authError && <p className="text-red-500 text-xs">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-slate-900 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (step === "upload") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-lg">
          <div className="mb-6">
            <div className="text-xl font-bold text-slate-900 mb-1">Upload Data File</div>
            <p className="text-sm text-slate-500">Accepts CSV, Excel (.xlsx, .xls)</p>
          </div>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <div className="text-4xl mb-3">📂</div>
            <p className="text-sm font-medium text-slate-700">Drop your file here or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">CSV · XLSX · XLS</p>
            <input
              id="file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
          </div>
        </div>
      </main>
    );
  }

  if (step === "mapping") {
    const requiredMapped = SCHEMA_FIELDS.filter((f) => f.required).every((f) => mapping[f.key]);
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="mb-6">
              <div className="text-xl font-bold text-slate-900 mb-1">Map Columns</div>
              <p className="text-sm text-slate-500">
                File: <span className="font-medium">{fileName}</span> · {fileRows.length} rows detected
              </p>
            </div>

            <div className="space-y-3">
              {SCHEMA_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-4">
                  <div className="w-40 flex-shrink-0">
                    <span className="text-sm font-medium text-slate-700">{field.label}</span>
                    {field.required && <span className="text-red-400 ml-1 text-xs">*</span>}
                  </div>
                  <select
                    value={mapping[field.key] ?? ""}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, [field.key]: e.target.value || undefined }))
                    }
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— skip —</option>
                    {fileColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep("upload")}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                onClick={buildPreview}
                disabled={!requiredMapped}
                className="flex-1 bg-slate-900 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Preview rows →
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (step === "preview") {
    const validRows = preview.filter((r) => r.name && r.value !== "" && r.value != null);
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xl font-bold text-slate-900">Preview</div>
                <p className="text-sm text-slate-500">
                  {validRows.length} valid rows from {fileRows.length} total · first 20 shown
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("mapping")}
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  ← Remap
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || validRows.length === 0}
                  className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40"
                >
                  {uploading ? "Uploading…" : `↑ Upload ${fileRows.length} rows`}
                </button>
              </div>
            </div>
            {uploadError && (
              <p className="text-red-500 text-sm mb-4 bg-red-50 rounded-lg px-4 py-2">{uploadError}</p>
            )}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {SCHEMA_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                      <th key={f.key} className="text-left px-3 py-2 text-slate-500 font-semibold uppercase tracking-wide whitespace-nowrap">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 20).map((row, i) => (
                    <tr key={i} className={i % 2 === 1 ? "bg-slate-50/50" : ""}>
                      {SCHEMA_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                        <td key={f.key} className="px-3 py-2 text-slate-700 whitespace-nowrap max-w-[200px] truncate">
                          {String(row[f.key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // done
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">✅</div>
        <div className="text-xl font-bold text-slate-900 mb-2">Upload complete</div>
        <p className="text-sm text-slate-500 mb-6">
          {result?.inserted ?? 0} rows added or updated in the database.
        </p>
        <button
          onClick={() => { setStep("upload"); setResult(null); setFileRows([]); setFileColumns([]); setMapping({}); }}
          className="w-full bg-slate-900 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Upload another file
        </button>
      </div>
    </main>
  );
}
