import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zvhfqdkgvzfngioocknm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aGZxZGtndnpmbmdpb29ja25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTc3MTIsImV4cCI6MjA5MDIzMzcxMn0.ZTOWQucclM7H0ezGUyVSZgGxgnVK__L-3B8qVM_Cg6g";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const server = new Server(
  { name: "richmond-people-data", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── Tool definitions ────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_indicators",
      description:
        "List all available indicator names in the Richmond City health database, optionally filtered by category (health, population, poverty, education).",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["health", "population", "poverty", "education"],
            description: "Filter by data category (optional).",
          },
        },
      },
    },
    {
      name: "query_indicators",
      description:
        "Query Richmond City public health indicators. Returns values, Virginia state averages, data source, year, and definitions. Use this to answer questions about birth outcomes, poverty, HIV rates, education, population, and more.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Indicator name (partial match OK, e.g. 'preterm' or 'infant mortality').",
          },
          race: {
            type: "string",
            enum: ["all", "black", "white", "hispanic", "asian"],
            description: "Filter by race/ethnicity group (default: all).",
          },
          year: {
            type: "number",
            description: "Filter by specific data year (optional).",
          },
          category: {
            type: "string",
            enum: ["health", "population", "poverty", "education"],
            description: "Filter by category (optional).",
          },
        },
      },
    },
    {
      name: "get_equity_gaps",
      description:
        "Returns the largest racial disparities in Richmond City — indicators where Black, White, and Hispanic rates differ most. Useful for equity analysis and grant writing.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["health", "population", "poverty", "education"],
            description: "Limit to one category (optional).",
          },
          limit: {
            type: "number",
            description: "Number of top disparities to return (default: 10).",
          },
        },
      },
    },
    {
      name: "compare_to_virginia",
      description:
        "Compare Richmond City values to Virginia state averages for indicators that have benchmark data. Shows how Richmond deviates from the state.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["health", "population", "poverty", "education"],
            description: "Filter by category (optional).",
          },
          worse_only: {
            type: "boolean",
            description:
              "If true, only return indicators where Richmond is worse than Virginia (default: false).",
          },
        },
      },
    },
  ],
}));

// ── Tool handlers ───────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "list_indicators") {
      let query = supabase
        .from("indicators")
        .select("name, category, subcategory, unit, source")
        .not("value", "is", null)
        .order("name");

      if (args?.category) {
        query = query.eq("category", args.category as string);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Deduplicate by name
      const seen = new Set<string>();
      const unique = (data ?? []).filter((row) => {
        if (seen.has(row.name)) return false;
        seen.add(row.name);
        return true;
      });

      const grouped: Record<string, string[]> = {};
      for (const row of unique) {
        const cat = row.category ?? "other";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(`${row.name} (${row.unit})`);
      }

      const lines = Object.entries(grouped).map(
        ([cat, names]) => `## ${cat.toUpperCase()}\n${names.map((n) => `- ${n}`).join("\n")}`
      );

      return {
        content: [
          {
            type: "text",
            text: `# Richmond City — Available Indicators (${unique.length} total)\n\n${lines.join("\n\n")}`,
          },
        ],
      };
    }

    if (name === "query_indicators") {
      let query = supabase
        .from("indicators")
        .select("name, race, year, value, va_average, unit, source, source_url, definition, category, subcategory")
        .not("value", "is", null)
        .order("name")
        .order("year", { ascending: false });

      if (args?.name) {
        query = query.ilike("name", `%${args.name}%`);
      }
      if (args?.race) {
        query = query.eq("race", args.race as string);
      }
      if (args?.year) {
        query = query.eq("year", args.year as number);
      }
      if (args?.category) {
        query = query.eq("category", args.category as string);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          content: [{ type: "text", text: "No indicators found matching your query." }],
        };
      }

      const rows = data.map((i) => {
        const va = i.va_average != null ? ` | VA avg: ${i.va_average}${i.unit === "%" ? "%" : ""}` : "";
        const def = i.definition ? `\n   Definition: ${i.definition}` : "";
        return `- **${i.name}** (${i.race === "all" ? "All groups" : i.race}, ${i.year}): ${i.value}${i.unit === "%" ? "%" : ` ${i.unit}`}${va}\n   Source: ${i.source}${def}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `# Richmond City — Query Results (${data.length} rows)\n\nGeography: Richmond City, Virginia (FIPS 51760)\n\n${rows.join("\n\n")}`,
          },
        ],
      };
    }

    if (name === "get_equity_gaps") {
      let query = supabase
        .from("indicators")
        .select("name, race, year, value, unit, category")
        .not("value", "is", null)
        .in("race", ["black", "white", "hispanic"])
        .or("unit.eq.%,unit.ilike.per %");

      if (args?.category) {
        query = query.eq("category", args.category as string);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by name + year, find max disparity ratio
      const grouped = new Map<string, { name: string; year: number; rows: typeof data }>();
      for (const row of data ?? []) {
        const key = `${row.name}||${row.year}`;
        if (!grouped.has(key)) grouped.set(key, { name: row.name, year: row.year, rows: [] });
        grouped.get(key)!.rows.push(row);
      }

      const disparities: Array<{ name: string; year: number; ratio: number; summary: string }> = [];

      for (const { name: indName, year, rows } of grouped.values()) {
        if (rows.length < 2) continue;
        const values = rows.map((r) => r.value as number);
        const max = Math.max(...values);
        const min = Math.min(...values);
        if (min <= 0) continue;
        const ratio = max / min;
        const summary = rows
          .sort((a, b) => (b.value as number) - (a.value as number))
          .map((r) => `${r.race}: ${r.value}${r.unit === "%" ? "%" : ""}`)
          .join(", ");
        disparities.push({ name: indName, year, ratio, summary });
      }

      disparities.sort((a, b) => b.ratio - a.ratio);
      const limit = (args?.limit as number) ?? 10;
      const top = disparities.slice(0, limit);

      const lines = top.map(
        (d) => `- **${d.name}** (${d.year}): ${d.ratio.toFixed(1)}× gap — ${d.summary}`
      );

      return {
        content: [
          {
            type: "text",
            text: `# Richmond City — Top ${limit} Racial Equity Gaps\n\nGeography: Richmond City, Virginia\n\n${lines.join("\n")}`,
          },
        ],
      };
    }

    if (name === "compare_to_virginia") {
      let query = supabase
        .from("indicators")
        .select("name, race, year, value, va_average, unit, category")
        .not("value", "is", null)
        .not("va_average", "is", null)
        .eq("race", "all")
        .order("name");

      if (args?.category) {
        query = query.eq("category", args.category as string);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Higher-is-better indicators
      const HIGHER_IS_BETTER = new Set([
        "4-Year Graduation Rate", "SOL Pass Rate — Reading", "SOL Pass Rate — Math",
        "SOL Pass Rate — Science", "SOL Pass Rate — Writing", "SOL Pass Rate — History",
        "Postsecondary Enrollment Rate", "Cholesterol Screening",
        "Dental Visit in Past Year", "Mammography Use (Women 50–74)", "Routine Checkup in Past Year",
      ]);

      const rows = (data ?? [])
        .map((i) => {
          const val = i.value as number;
          const va = i.va_average as number;
          const higherBetter = HIGHER_IS_BETTER.has(i.name);
          const richmondWorse = higherBetter ? val < va : val > va;
          const diff = val - va;
          return { ...i, richmondWorse, diff };
        })
        .filter((i) => !(args?.worse_only) || i.richmondWorse)
        .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

      const lines = rows.map((i) => {
        const unit = i.unit === "%" ? "%" : ` ${i.unit}`;
        const direction = i.richmondWorse ? "⚠️ worse" : "✅ better";
        const diffStr = i.diff > 0 ? `+${i.diff.toFixed(1)}` : i.diff.toFixed(1);
        return `- **${i.name}** (${i.year}): Richmond ${i.value}${unit} vs VA ${i.va_average}${unit} — ${diffStr} ${direction}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `# Richmond vs Virginia — Benchmark Comparison\n\n${lines.join("\n")}`,
          },
        ],
      };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${String(err)}` }],
      isError: true,
    };
  }
});

// ── Start ───────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
