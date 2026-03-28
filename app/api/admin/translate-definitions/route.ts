import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 300;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

async function translateOne(client: Anthropic, text: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Translate the following English public health text to Spanish. Preserve all technical terms, proper nouns, acronyms, and numbers exactly as they appear. Return only the translated text with no explanation or preamble.\n\n${text}`,
      },
    ],
  });
  const block = message.content[0];
  return block.type === "text" ? block.text.trim() : text;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("x-admin-password");
  if (!ADMIN_PASSWORD || authHeader !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { data: rows, error } = await supabase
    .from("indicators")
    .select("id, definition")
    .not("definition", "is", null)
    .is("definition_es", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows?.length) return NextResponse.json({ translated: 0, message: "All definitions already translated." });

  const cache = new Map<string, string>();
  for (const row of rows) {
    if (row.definition && !cache.has(row.definition)) cache.set(row.definition, "");
  }

  let failed = 0;
  for (const [eng] of cache) {
    try {
      const spanish = await translateOne(anthropic, eng);
      cache.set(eng, spanish);
    } catch {
      failed++;
      cache.set(eng, "");
    }
    await sleep(200);
  }

  let updated = 0;
  for (const row of rows) {
    const spanish = cache.get(row.definition ?? "") ?? "";
    if (!spanish) continue;
    await supabase.from("indicators").update({ definition_es: spanish }).eq("id", row.id);
    updated++;
  }

  return NextResponse.json({ translated: updated, skipped: failed, total: rows.length });
}
