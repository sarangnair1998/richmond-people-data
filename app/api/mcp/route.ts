import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const HIGHER_IS_BETTER = new Set([
  "4-Year Graduation Rate",
  "SOL Pass Rate — Reading",
  "SOL Pass Rate — Math",
  "SOL Pass Rate — Science",
  "SOL Pass Rate — Writing",
  "SOL Pass Rate — History",
  "Postsecondary Enrollment Rate",
  "Cholesterol Screening",
  "Dental Visit in Past Year",
  "Mammography Use (Women 50–74)",
  "Routine Checkup in Past Year",
]);

function buildServer() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const server = new Server(
    { name: "richmond-people-data", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_indicators",
        description:
          "List all available indicator names in the Richmond City health database, optionally filtered by category.",
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
          "Query Richmond City public health indicators. Returns Richmond values, Virginia state averages, source, year, and definitions. Use this to answer questions about birth outcomes, poverty, HIV rates, education, and more.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Indicator name — partial match OK (e.g. 'preterm' or 'infant mortality').",
            },
            race: {
              type: "string",
              enum: ["all", "black", "white", "hispanic", "asian"],
              description: "Filter by race/ethnicity group.",
            },
            year: {
              type: "number",
              description: "Filter by specific data year.",
            },
            category: {
              type: "string",
              enum: ["health", "population", "poverty", "education"],
              description: "Filter by category.",
            },
          },
        },
      },
      {
        name: "get_equity_gaps",
        description:
          "Returns the largest racial disparities in Richmond City — indicators where Black, White, and Hispanic rates differ most. Useful for equity analysis, grant writing, and disparity reports.",
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
          "Compare Richmond City values to Virginia state averages. Shows how Richmond deviates from the state benchmark for each indicator.",
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
              description: "Only return indicators where Richmond is worse than Virginia.",
            },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // ── list_indicators ──────────────────────────────────────────────────
      if (name === "list_indicators") {
        let q = supabase
          .from("indicators")
          .select("name, category, unit")
          .not("value", "is", null)
          .order("name");
        if (args?.category) q = q.eq("category", args.category as string);
        const { data, error } = await q;
        if (error) throw error;

        const seen = new Set<string>();
        const grouped: Record<string, string[]> = {};
        for (const row of data ?? []) {
          if (seen.has(row.name)) continue;
          seen.add(row.name);
          const cat = row.category ?? "other";
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(`${row.name} (${row.unit})`);
        }

        const lines = Object.entries(grouped).map(
          ([cat, names]) =>
            `## ${cat.toUpperCase()}\n${names.map((n) => `- ${n}`).join("\n")}`
        );

        return {
          content: [
            {
              type: "text",
              text: `# Richmond City — Available Indicators (${seen.size} total)\nGeography: Richmond City, Virginia (FIPS 51760)\n\n${lines.join("\n\n")}`,
            },
          ],
        };
      }

      // ── query_indicators ─────────────────────────────────────────────────
      if (name === "query_indicators") {
        let q = supabase
          .from("indicators")
          .select("name, race, year, value, va_average, unit, source, source_url, definition, category")
          .not("value", "is", null)
          .order("name")
          .order("year", { ascending: false });

        if (args?.name) q = q.ilike("name", `%${args.name}%`);
        if (args?.race) q = q.eq("race", args.race as string);
        if (args?.year) q = q.eq("year", args.year as number);
        if (args?.category) q = q.eq("category", args.category as string);

        const { data, error } = await q.limit(50);
        if (error) throw error;
        if (!data?.length) {
          return { content: [{ type: "text", text: "No indicators found matching your query." }] };
        }

        const rows = data.map((i) => {
          const u = i.unit === "%" ? "%" : ` ${i.unit}`;
          const va = i.va_average != null ? ` | VA avg: ${i.va_average}${u}` : "";
          const def = i.definition ? `\n   Definition: ${i.definition}` : "";
          const raceLabel = i.race === "all" ? "All groups" : i.race;
          return `- **${i.name}** (${raceLabel}, ${i.year}): ${i.value}${u}${va}\n   Source: [${i.source}](${i.source_url ?? "#"})${def}`;
        });

        return {
          content: [
            {
              type: "text",
              text: `# Richmond City — Query Results (${data.length} rows)\nGeography: Richmond City, Virginia (FIPS 51760)\n\n${rows.join("\n\n")}`,
            },
          ],
        };
      }

      // ── get_equity_gaps ──────────────────────────────────────────────────
      if (name === "get_equity_gaps") {
        let q = supabase
          .from("indicators")
          .select("name, race, year, value, unit, category")
          .not("value", "is", null)
          .in("race", ["black", "white", "hispanic"])
          .or("unit.eq.%,unit.ilike.per %");

        if (args?.category) q = q.eq("category", args.category as string);
        const { data, error } = await q;
        if (error) throw error;

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
          const u = rows[0].unit === "%" ? "%" : ` ${rows[0].unit}`;
          const summary = [...rows]
            .sort((a, b) => (b.value as number) - (a.value as number))
            .map((r) => `${r.race}: ${r.value}${u}`)
            .join(", ");
          disparities.push({ name: indName, year, ratio, summary });
        }

        disparities.sort((a, b) => b.ratio - a.ratio);
        const limit = (args?.limit as number) ?? 10;
        const lines = disparities.slice(0, limit).map(
          (d) => `- **${d.name}** (${d.year}): ${d.ratio.toFixed(1)}× gap — ${d.summary}`
        );

        return {
          content: [
            {
              type: "text",
              text: `# Richmond City — Top ${limit} Racial Equity Gaps\nGeography: Richmond City, Virginia\n\n${lines.join("\n")}`,
            },
          ],
        };
      }

      // ── compare_to_virginia ──────────────────────────────────────────────
      if (name === "compare_to_virginia") {
        let q = supabase
          .from("indicators")
          .select("name, year, value, va_average, unit, category")
          .not("value", "is", null)
          .not("va_average", "is", null)
          .eq("race", "all")
          .order("name");

        if (args?.category) q = q.eq("category", args.category as string);
        const { data, error } = await q;
        if (error) throw error;

        const rows = (data ?? [])
          .map((i) => {
            const val = i.value as number;
            const va = i.va_average as number;
            const higherBetter = HIGHER_IS_BETTER.has(i.name);
            const worse = higherBetter ? val < va : val > va;
            return { ...i, worse, diff: val - va };
          })
          .filter((i) => !(args?.worse_only) || i.worse)
          .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

        const lines = rows.map((i) => {
          const u = i.unit === "%" ? "%" : ` ${i.unit}`;
          const flag = i.worse ? "⚠️" : "✅";
          const diff = i.diff > 0 ? `+${i.diff.toFixed(1)}` : i.diff.toFixed(1);
          return `${flag} **${i.name}** (${i.year}): Richmond ${i.value}${u} vs VA ${i.va_average}${u} (${diff})`;
        });

        return {
          content: [
            {
              type: "text",
              text: `# Richmond vs Virginia Benchmarks\n\n${lines.join("\n")}`,
            },
          ],
        };
      }

      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${String(err)}` }], isError: true };
    }
  });

  return server;
}

// ── Request handler ──────────────────────────────────────────────────────────

async function handle(req: Request): Promise<Response> {
  // Stateless — each request is independent, no session state needed
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = buildServer();
  await server.connect(transport);

  const response = await transport.handleRequest(req);
  await server.close();
  return response;
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

export async function DELETE(req: Request) {
  return handle(req);
}
