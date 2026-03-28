import { supabase } from "./supabase";

export type Indicator = {
  id: string;
  category: string;
  subcategory: string | null;
  name: string;
  value: number | null;
  unit: string;
  race: string;
  geography: string;
  source: string;
  source_url: string | null;
  year: number | null;
  va_average: number | null;
  definition: string | null;
  notes: string | null;
};

export type Category = "health" | "maternal_health" | "population" | "poverty" | "education";

export async function getIndicators(category?: Category): Promise<Indicator[]> {
  let query = supabase
    .from("indicators")
    .select("*")
    .order("category")
    .order("name");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getAllIndicators(): Promise<Indicator[]> {
  const { data, error } = await supabase
    .from("indicators")
    .select("*")
    .order("category")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

// Returns indicators for the chart builder system prompt (name + value + unit only)
export function buildIndicatorCatalog(indicators: Indicator[]): string {
  return indicators
    .filter((i) => i.race === "all" && i.value !== null)
    .map((i) => `${i.name} | ${i.value}${i.unit} | ${i.category} | ${i.year}`)
    .join("\n");
}
