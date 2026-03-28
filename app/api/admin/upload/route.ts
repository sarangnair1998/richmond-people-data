import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

export async function POST(req: Request) {
  const authHeader = req.headers.get("x-admin-password");
  if (!ADMIN_PASSWORD || authHeader !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { rows } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  // Normalise race values to match DB schema
  const RACE_MAP: Record<string, string> = {
    "all": "all", "total": "all", "overall": "all",
    "black": "black", "black or african american": "black", "nh black": "black", "non-hispanic black": "black",
    "white": "white", "nh white": "white", "non-hispanic white": "white", "white non-hispanic": "white",
    "hispanic": "hispanic", "hispanic or latino": "hispanic", "latino": "hispanic",
    "asian": "asian", "asian or pacific islander": "asian",
    "other": "other", "other races": "other",
  };

  const CATEGORY_MAP: Record<string, string> = {
    "health": "health", "maternal": "health", "hiv": "health", "births": "health",
    "population": "population", "pop": "population", "demographics": "population",
    "poverty": "poverty", "income": "poverty", "housing": "poverty", "economic": "poverty",
    "education": "education", "school": "education", "graduation": "education",
  };

  const normalised = rows.map((r: Record<string, unknown>) => ({
    name: String(r.name ?? "").trim(),
    race: RACE_MAP[String(r.race ?? "all").toLowerCase().trim()] ?? "all",
    year: r.year ? parseInt(String(r.year)) : null,
    value: r.value !== "" && r.value != null ? parseFloat(String(r.value)) : null,
    unit: r.unit ? String(r.unit).trim() : null,
    va_average: r.va_average !== "" && r.va_average != null ? parseFloat(String(r.va_average)) : null,
    source: r.source ? String(r.source).trim() : null,
    source_url: r.source_url ? String(r.source_url).trim() : null,
    definition: r.definition ? String(r.definition).trim() : null,
    category: r.category ? (CATEGORY_MAP[String(r.category).toLowerCase().trim()] ?? String(r.category).trim()) : null,
    subcategory: r.subcategory ? String(r.subcategory).trim() : null,
  })).filter((r) => r.name && r.value !== null && !isNaN(r.value as number));

  if (normalised.length === 0) {
    return NextResponse.json({ error: "No valid rows after normalisation" }, { status: 400 });
  }

  const { error } = await supabase
    .from("indicators")
    .upsert(normalised, { onConflict: "name,race,year", ignoreDuplicates: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: normalised.length });
}
