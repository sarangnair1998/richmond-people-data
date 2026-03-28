"""
Translate all indicator definitions to Spanish and store in definition_es.
Requires: GROQ_API_KEY and SUPABASE env vars (same as the app).
Run once: python scripts/translate_definitions.py
"""

import os
import time
import requests
from supabase import create_client

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
GROQ_API_KEY = os.environ["GROQ_API_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def translate(text: str) -> str:
    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a professional medical and public health translator. "
                        "Translate the following English text to Spanish. "
                        "Preserve technical terms, proper nouns, and numbers exactly. "
                        "Return only the translated text, no explanations."
                    ),
                },
                {"role": "user", "content": text},
            ],
            "temperature": 0.1,
            "max_tokens": 512,
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


def main():
    # Fetch all rows that have a definition but no Spanish translation yet
    result = supabase.table("indicators").select("id, definition").not_.is_("definition", "null").is_("definition_es", "null").execute()
    rows = result.data

    if not rows:
        print("No rows need translation.")
        return

    # Deduplicate: translate each unique definition once
    unique_defs: dict[str, str] = {}
    for row in rows:
        d = row["definition"]
        if d and d not in unique_defs:
            unique_defs[d] = ""

    print(f"Translating {len(unique_defs)} unique definitions for {len(rows)} rows...")

    for i, (eng, _) in enumerate(unique_defs.items()):
        try:
            spanish = translate(eng)
            unique_defs[eng] = spanish
            print(f"  [{i+1}/{len(unique_defs)}] ✓ {eng[:60]}...")
        except Exception as e:
            print(f"  [{i+1}/{len(unique_defs)}] ✗ Error: {e} — will retry next run")
            unique_defs[eng] = ""  # leave empty — will be retried
        time.sleep(1.5)  # stay within rate limit

    # Write back to Supabase — only rows where we got a real translation
    updated = 0
    for row in rows:
        eng = row["definition"]
        spanish = unique_defs.get(eng or "", "")
        if not spanish or spanish == eng:
            continue
        supabase.table("indicators").update({"definition_es": spanish}).eq("id", row["id"]).execute()
        updated += 1

    print(f"\nDone. Updated {updated} rows.")


if __name__ == "__main__":
    main()
