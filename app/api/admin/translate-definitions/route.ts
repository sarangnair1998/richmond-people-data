import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";
export const maxDuration = 300;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

async function translateOne(groq: Groq, text: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a professional medical and public health translator. Translate the following English text to Spanish. Preserve technical terms, proper nouns, and numbers exactly. Return only the translated text, no explanations.",
      },
      { role: "user", content: text },
    ],
    temperature: 0.1,
    max_tokens: 512,
  });
  return completion.choices[0]?.message?.content?.trim() ?? text;
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
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Fetch rows missing Spanish definition
  const { data: rows, error } = await supabase
    .from("indicators")
    .select("id, definition")
    .not("definition", "is", null)
    .is("definition_es", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows?.length) return NextResponse.json({ translated: 0, message: "All definitions already translated." });

  // Deduplicate
  const cache = new Map<string, string>();
  for (const row of rows) {
    if (row.definition && !cache.has(row.definition)) cache.set(row.definition, "");
  }

  let failed = 0;
  for (const [eng] of cache) {
    try {
      const spanish = await translateOne(groq, eng);
      cache.set(eng, spanish);
    } catch {
      failed++;
      cache.set(eng, "");
    }
    await sleep(1200);
  }

  // Write back
  let updated = 0;
  for (const row of rows) {
    const spanish = cache.get(row.definition ?? "") ?? "";
    if (!spanish) continue;
    await supabase.from("indicators").update({ definition_es: spanish }).eq("id", row.id);
    updated++;
  }

  return NextResponse.json({ translated: updated, skipped: failed, total: rows.length });
}
