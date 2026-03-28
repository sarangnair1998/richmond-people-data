"""
Richmond People Data — Supabase Seed Script
============================================
Reads data/indicators.json (produced by refresh_data.py) and
upserts all records into the Supabase indicators table.

Usage:
  python scripts/seed_supabase.py

Requires:
  pip install supabase

Environment variables (set in .env.local for dev, GitHub Actions secrets for CI):
  SUPABASE_URL            your Supabase project URL
  SUPABASE_SERVICE_KEY    service role key — NOT the anon key, never expose this
"""

import json
import os
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent

# Load .env.local for local dev (GitHub Actions uses secrets directly)
_env_file = SCRIPT_DIR.parent / ".env.local"
if _env_file.exists():
    for line in _env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())
DATA_DIR   = SCRIPT_DIR.parent / "data"
IN_FILE    = DATA_DIR / "indicators.json"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def main() -> None:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must both be set.", file=sys.stderr)
        print("  Set them in .env.local or as GitHub Actions secrets.", file=sys.stderr)
        sys.exit(1)

    try:
        from supabase import create_client
    except ImportError:
        print("ERROR: supabase package not installed. Run: pip install supabase", file=sys.stderr)
        sys.exit(1)

    if not IN_FILE.exists():
        print(f"ERROR: {IN_FILE} not found. Run refresh_data.py first.", file=sys.stderr)
        sys.exit(1)

    payload = json.loads(IN_FILE.read_text())
    records = payload["indicators"]
    print(f"Loaded {len(records)} indicators from {IN_FILE}")

    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Upsert in batches of 100 (Supabase limit per request)
    BATCH = 100
    total_upserted = 0
    for i in range(0, len(records), BATCH):
        batch = records[i:i+BATCH]
        resp = (
            client.table("indicators")
            .upsert(batch, on_conflict="name,race,year,source")
            .execute()
        )
        total_upserted += len(batch)
        print(f"  Upserted {total_upserted}/{len(records)}...")

    print(f"\nDone. {total_upserted} indicators upserted into Supabase.")


if __name__ == "__main__":
    main()
