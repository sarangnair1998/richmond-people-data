import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a data assistant for the Richmond, Virginia People Data Portal.
Your job is to turn a plain-English request into a chart specification using the available indicators.

Available indicators (name | value | category | year):
{CATALOG}

Rules:
- Only use indicators from the catalog above. Do not invent data.
- Return ONLY valid JSON — no markdown, no explanation.
- Output format:
{
  "chartType": "bar" | "line" | "donut",
  "title": "string",
  "xLabel": "string",
  "yLabel": "string",
  "note": "string (data source + year)",
  "data": [{ "name": "string", "value": number }]
}
- For race comparisons, use multiple data points (Black, White, Hispanic, All).
- For trend over time, use line chart with year as name.
- For a single comparison (Richmond vs VA), use bar chart with 2 bars.
- Keep data arrays to 8 items max.
- If no matching data found, return { "error": "No matching indicators found for that query." }`;

export async function POST(req: NextRequest) {
  const { query, catalog } = await req.json();

  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT.replace("{CATALOG}", catalog ?? ""),
        },
        { role: "user", content: query },
      ],
      temperature: 0.1,
      max_tokens: 512,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Chart builder error:", err);
    return NextResponse.json({ error: "Failed to generate chart" }, { status: 500 });
  }
}
