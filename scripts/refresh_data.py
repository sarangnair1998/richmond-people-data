"""
Richmond People Data — Automated Data Refresh Script
=====================================================
Fetches all data from official government sources and writes
normalized indicator records to data/indicators.json.

Run manually or on a schedule (cron / GitHub Actions).

Sources covered:
  Tier 1 (REST API — fully automated):
    - U.S. Census ACS 5-Year (api.census.gov)
    - CDC PLACES (data.cdc.gov Socrata)
    - CDC Teen Birth Rates (data.cdc.gov Socrata)

  Tier 2 (PDF download + parse — automated, URL updates annually):
    - VDH Annual Health Statistics (apps.vdh.virginia.gov)
      Requires: pip install pdfplumber requests

  Tier 3 (Static files — manual update required annually):
    - VDOE School Quality Profile  → data/vdoe_school_quality.json
    - VDOE Cohort Graduation       → data/vdoe_cohort_graduation.csv
    - VDOE Fall Membership         → data/vdoe_fall_membership.csv
    - VDOE Free/Reduced Lunch      → data/vdoe_free_reduced_lunch_2024_2025.xlsx

Usage:
  python scripts/refresh_data.py
  python scripts/refresh_data.py --year 2020   # override VDH year
  python scripts/refresh_data.py --skip-vdh    # skip PDF download
"""

import argparse
import csv
import json
import os
import sys
import urllib.request
from datetime import date
from pathlib import Path

# Load .env file if present (local dev only — GitHub Actions uses secrets directly)
_env_file = Path(__file__).parent.parent / ".env.local"
if _env_file.exists():
    for line in _env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

# Optional imports — checked at runtime
try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
CENSUS_API_KEY = os.environ.get("CENSUS_API_KEY", "")
CENSUS_BASE    = "https://api.census.gov/data/2023/acs/acs5"
RICHMOND_FIPS_STATE  = "51"
RICHMOND_FIPS_COUNTY = "760"

CDC_PLACES_URL = "https://data.cdc.gov/resource/swc5-untb.json?locationid=51760&$limit=100"
CDC_TEEN_BIRTH_URL = (
    "https://data.cdc.gov/resource/3h58-x6cd.json"
    "?combined_fips_code=51760&$limit=50&$order=year+DESC"
)

VDH_BASE      = "https://apps.vdh.virginia.gov/HealthStats/documents/pdf"
VDH_YEAR      = 2020   # most recent year available in VDH annual PDF reports
VDH_FILES = {
    "births":         f"{VDH_BASE}/birth_1-1_{VDH_YEAR}.pdf",
    "birth_rates":    f"{VDH_BASE}/birth_1-2_{VDH_YEAR}.pdf",
    "low_weight":     f"{VDH_BASE}/birth_1-10_{VDH_YEAR}.pdf",
    "infant_deaths":  f"{VDH_BASE}/inf_1-1_{VDH_YEAR}.pdf",
    "fetal_deaths":   f"{VDH_BASE}/fetal_1-1_{VDH_YEAR}.pdf",
    "teen_pregnancy": f"{VDH_BASE}/preg_3-8_{VDH_YEAR}.pdf",
    "teen_preg_race": f"{VDH_BASE}/preg_3-10_{VDH_YEAR}.pdf",
}

SCRIPT_DIR = Path(__file__).parent
DATA_DIR   = SCRIPT_DIR.parent / "data"
OUT_FILE   = DATA_DIR / "indicators.json"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def fetch_json(url: str) -> list | dict:
    req = urllib.request.Request(url, headers={"User-Agent": "RVA-People-Data/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def download_pdf(url: str, dest: Path) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "RVA-People-Data/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            dest.write_bytes(r.read())
        return True
    except Exception as e:
        print(f"  WARNING: could not download {url}: {e}", file=sys.stderr)
        return False


def find_richmond_row(pdf_path: Path) -> list[str] | None:
    """Return the first text line containing 'RICHMOND CITY' from a VDH PDF."""
    if not HAS_PDFPLUMBER:
        return None
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for line in text.split("\n"):
                if "RICHMOND CITY" in line.upper():
                    return line.split()
    return None


def safe_float(val: str) -> float | None:
    try:
        v = float(val.replace(",", ""))
        return None if v == -888888888 else v
    except (ValueError, AttributeError):
        return None


def indicator(
    category: str,
    subcategory: str,
    name: str,
    value,
    unit: str,
    source: str,
    source_url: str,
    year: int,
    *,
    race: str = "all",
    va_average=None,
    definition: str = "",
    notes: str = "",
) -> dict:
    return {
        "category": category,
        "subcategory": subcategory,
        "name": name,
        "value": float(value) if value is not None else None,
        "unit": unit,
        "race": race,
        "geography": "richmond_city",
        "source": source,
        "source_url": source_url,
        "year": year,
        "va_average": float(va_average) if va_average is not None else None,
        "definition": definition,
        "notes": notes,
    }

# ---------------------------------------------------------------------------
# Census ACS
# ---------------------------------------------------------------------------
def fetch_census(records: list) -> None:
    print("Fetching Census ACS 2023...")
    src = "Census ACS"
    url = "https://api.census.gov/data/2023/acs/acs5"
    src_url = "https://api.census.gov/data/2023/acs/acs5"

    def get(*vars_, table="base"):
        varstr = ",".join(vars_)
        endpoints = {
            "base":    f"{url}?get={varstr}&for=county:{RICHMOND_FIPS_COUNTY}&in=state:{RICHMOND_FIPS_STATE}&key={CENSUS_API_KEY}",
            "subject": f"{url}/subject?get={varstr}&for=county:{RICHMOND_FIPS_COUNTY}&in=state:{RICHMOND_FIPS_STATE}&key={CENSUS_API_KEY}",
            "profile": f"{url}/profile?get={varstr}&for=county:{RICHMOND_FIPS_COUNTY}&in=state:{RICHMOND_FIPS_STATE}&key={CENSUS_API_KEY}",
        }
        data = fetch_json(endpoints[table])
        headers, row = data[0], data[1]
        return dict(zip(headers, row))

    # --- Population & demographics ---
    d = get("B01001_001E", "B01002_001E",
            "B01001_003E", "B01001_027E",   # under-5 male/female
            "B02001_002E", "B02001_003E", "B02001_005E",  # white, black, asian
            "B03002_012E", "B03002_003E", "B03002_004E",  # hispanic, NH-white, NH-black
            # women 15-44
            "B01001_031E","B01001_032E","B01001_033E",
            "B01001_034E","B01001_035E","B01001_036E","B01001_037E")

    total_pop   = int(d["B01001_001E"])
    under5      = int(d["B01001_003E"]) + int(d["B01001_027E"])
    women_1544  = sum(int(d[v]) for v in [
        "B01001_031E","B01001_032E","B01001_033E",
        "B01001_034E","B01001_035E","B01001_036E","B01001_037E"])

    records += [
        indicator("population","demographics","Total Population",
                  total_pop,"count",src,src_url,2023,
                  definition="Total civilian resident population"),
        indicator("population","demographics","Median Age",
                  float(d["B01002_001E"]),"years",src,src_url,2023),
        indicator("population","demographics","Population Under 5",
                  under5,"count",src,src_url,2023),
        indicator("population","demographics","Women of Childbearing Age (15–44)",
                  women_1544,"count",src,src_url,2023),
        indicator("population","race_ethnicity","Population — Non-Hispanic White",
                  int(d["B03002_003E"]),"count",src,src_url,2023,race="white"),
        indicator("population","race_ethnicity","Population — Non-Hispanic Black",
                  int(d["B03002_004E"]),"count",src,src_url,2023,race="black"),
        indicator("population","race_ethnicity","Population — Hispanic or Latino",
                  int(d["B03002_012E"]),"count",src,src_url,2023,race="hispanic"),
        indicator("population","race_ethnicity","Population — Asian",
                  int(d["B02001_005E"]),"count",src,src_url,2023,race="asian"),
    ]

    # --- Poverty (S1701) ---
    p = get("S1701_C01_001E","S1701_C02_001E","S1701_C03_001E",
            "S1701_C01_002E","S1701_C02_002E",
            "S1701_C01_003E","S1701_C02_003E", table="subject")

    records += [
        indicator("poverty","poverty_rates","Poverty Rate",
                  safe_float(p["S1701_C03_001E"]),"%",src,src_url,2023,
                  definition="% of residents below the federal poverty line"),
        indicator("poverty","poverty_rates","People Below Poverty Line",
                  int(p["S1701_C02_001E"]),"count",src,src_url,2023),
        indicator("poverty","poverty_rates","Children Under 18 in Poverty",
                  int(p["S1701_C02_002E"]),"count",src,src_url,2023),
        indicator("poverty","poverty_rates","Child Poverty Rate (Under 18)",
                  round(int(p["S1701_C02_002E"])/int(p["S1701_C01_002E"])*100,1),
                  "%",src,src_url,2023),
        indicator("poverty","poverty_rates","Children Under 5 in Poverty",
                  int(p["S1701_C02_003E"]),"count",src,src_url,2023),
    ]

    # --- Health insurance (S2701) ---
    h = get("S2701_C01_001E","S2701_C04_001E","S2701_C05_001E",
            "S2701_C01_006E","S2701_C04_006E","S2701_C05_006E", table="subject")

    records += [
        indicator("health","insurance","Uninsured Adults",
                  safe_float(h["S2701_C05_001E"]),"%",src,src_url,2023,
                  definition="% of civilian noninstitutionalized population without health insurance"),
        indicator("health","insurance","Uninsured Adults — Count",
                  int(h["S2701_C04_001E"]),"count",src,src_url,2023),
        indicator("health","insurance","Uninsured Children (Under 19)",
                  safe_float(h["S2701_C05_006E"]),"%",src,src_url,2023),
    ]

    # --- Housing & income ---
    r = get("B25064_001E","B19013_001E")
    # Also get housing cost burden: B25070 (gross rent as % of income)
    burden = get("B25070_007E","B25070_008E","B25070_009E","B25070_010E","B25070_001E")
    cost_burdened_count = sum(int(burden[v]) for v in
        ["B25070_007E","B25070_008E","B25070_009E","B25070_010E"])
    total_renters = int(burden["B25070_001E"])
    severe_burdened = sum(int(burden[v]) for v in ["B25070_009E","B25070_010E"])

    records += [
        indicator("poverty","housing","Median Household Income",
                  int(r["B19013_001E"]),"dollars",src,src_url,2023),
        indicator("poverty","housing","Median Gross Rent",
                  int(r["B25064_001E"]),"dollars",src,src_url,2023),
        indicator("poverty","housing","Renters — Cost Burdened (30%+ income on rent)",
                  round(cost_burdened_count/total_renters*100,1) if total_renters else None,
                  "%",src,src_url,2023,
                  definition="Renter households spending 30%+ of income on gross rent"),
        indicator("poverty","housing","Renters — Severely Cost Burdened (50%+ income on rent)",
                  round(severe_burdened/total_renters*100,1) if total_renters else None,
                  "%",src,src_url,2023),
    ]

    # --- Low income (< 200% poverty) via C17002 (collapsed ratio table) ---
    # 002=<.50, 003=.50-.99, 004=1.00-1.24, 005=1.25-1.49, 006=1.50-1.84, 007=1.85-1.99
    p2 = get("C17002_001E","C17002_002E","C17002_003E","C17002_004E",
             "C17002_005E","C17002_006E","C17002_007E","C17002_008E")
    below200 = sum(int(p2[f"C17002_00{i}E"]) for i in range(2, 8))
    total_p2  = int(p2["C17002_001E"])
    records.append(indicator("poverty","poverty_rates",
        "Population with Low Income (Under 200% Poverty Level)",
        round(below200/total_p2*100,1) if total_p2 else None,
        "%",src,src_url,2023,
        definition="% of population with income below 200% of the federal poverty line"))

    print(f"  Census: {len([r for r in records if r['source']=='Census ACS'])} indicators")


# ---------------------------------------------------------------------------
# CDC PLACES
# ---------------------------------------------------------------------------
def fetch_cdc_places(records: list) -> None:
    print("Fetching CDC PLACES 2022...")
    src = "CDC PLACES"
    src_url = "https://data.cdc.gov/resource/swc5-untb.json"

    MEASURE_MAP = {
        "ACCESS2":    ("health","insurance","Uninsured Adults 18–64 (Age-Adjusted)","Age-adjusted prevalence"),
        "CSMOKING":   ("health","risk_factors","Current Cigarette Smoking","Age-adjusted prevalence"),
        "OBESITY":    ("health","risk_factors","Obesity","Age-adjusted prevalence"),
        "DIABETES":   ("health","outcomes","Diabetes","Age-adjusted prevalence"),
        "DEPRESSION": ("health","outcomes","Depression","Crude prevalence"),
        "MHLTH":      ("health","outcomes","Frequent Mental Distress (14+ days/month)","Age-adjusted prevalence"),
        "PHLTH":      ("health","outcomes","Frequent Physical Distress","Crude prevalence"),
        "CHD":        ("health","outcomes","Coronary Heart Disease","Age-adjusted prevalence"),
        "STROKE":     ("health","outcomes","Stroke","Crude prevalence"),
        "CASTHMA":    ("health","outcomes","Current Asthma","Age-adjusted prevalence"),
        "COPD":       ("health","outcomes","Chronic Obstructive Pulmonary Disease","Age-adjusted prevalence"),
        "LPA":        ("health","risk_factors","No Leisure-Time Physical Activity","Age-adjusted prevalence"),
        "BINGE":      ("health","risk_factors","Binge Drinking","Age-adjusted prevalence"),
        "SLEEP":      ("health","risk_factors","Short Sleep Duration","Crude prevalence"),
        "CHECKUP":    ("health","preventive","Routine Checkup in Past Year","Age-adjusted prevalence"),
        "MAMMOUSE":   ("health","preventive","Mammography Use (Women 50–74)","Crude prevalence"),
        "DENTAL":     ("health","preventive","Dental Visit in Past Year","Age-adjusted prevalence"),
        "CHOLSCREEN": ("health","preventive","Cholesterol Screening","Age-adjusted prevalence"),
        "FOODSTAMP":  ("poverty","food_assistance","Received Food Stamps","Crude prevalence"),
        "HOUSINSECU": ("poverty","housing","Housing Insecurity","Crude prevalence"),
        "LACKTRPT":   ("poverty","transportation","Lack Reliable Transportation","Crude prevalence"),
        "SHUTUTILITY":("poverty","housing","Utility Shutoff Threat","Age-adjusted prevalence"),
        "LONELINESS": ("health","outcomes","Loneliness","Age-adjusted prevalence"),
        "EMOTIONSPT": ("health","outcomes","Lack of Social/Emotional Support","Age-adjusted prevalence"),
    }

    rows = fetch_json(CDC_PLACES_URL)
    seen = set()
    for row in rows:
        mid = row.get("measureid")
        vtype = row.get("data_value_type", "")
        if mid not in MEASURE_MAP:
            continue
        cat, subcat, name, preferred_type = MEASURE_MAP[mid]
        # deduplicate: prefer the specified type
        key = (mid, preferred_type)
        if key in seen or vtype != preferred_type:
            continue
        seen.add(key)
        val = safe_float(str(row.get("data_value", "")))
        records.append(indicator(
            cat, subcat, name, val, "%",
            src, src_url, 2022,
            definition=f"CDC PLACES modeled estimate ({vtype}). Not for clinical use.",
            notes="Modeled estimate from 2022 BRFSS + ACS. Label as estimated prevalence."
        ))

    print(f"  CDC PLACES: {len([r for r in records if r['source']=='CDC PLACES'])} indicators")


# ---------------------------------------------------------------------------
# CDC Teen Birth Rates
# ---------------------------------------------------------------------------
def fetch_cdc_teen_births(records: list) -> None:
    print("Fetching CDC teen birth rates...")
    src = "CDC NCHS"
    src_url = "https://data.cdc.gov/resource/3h58-x6cd.json"

    rows = fetch_json(CDC_TEEN_BIRTH_URL)
    if not isinstance(rows, list) or not rows:
        print("  WARNING: no teen birth rate data returned")
        return

    for row in rows[:5]:   # most recent 5 years
        year = int(row.get("year", 0))
        rate = safe_float(str(row.get("birth_rate", "")))
        if year and rate:
            records.append(indicator(
                "maternal_health","birth_outcomes",
                "Teen Birth Rate (Ages 15–19)",
                rate,"per 1,000 women 15–19",
                src,src_url,year,
                definition="Live births per 1,000 female population aged 15–19. Richmond City VA.",
            ))

    print(f"  CDC teen births: added {min(5,len(rows))} years")


# ---------------------------------------------------------------------------
# VDH Annual Health Statistics (PDF download + parse)
# ---------------------------------------------------------------------------
def fetch_vdh(records: list, skip: bool = False) -> None:
    if skip:
        print("Skipping VDH PDF fetch (--skip-vdh)")
        return
    if not HAS_PDFPLUMBER:
        print("WARNING: pdfplumber not installed — skipping VDH PDF parsing. "
              "Run: pip install pdfplumber", file=sys.stderr)
        return

    import tempfile
    src = "VDH"
    src_url = "https://apps.vdh.virginia.gov/HealthStats/stats.htm"
    tmpdir = Path(tempfile.mkdtemp())
    print(f"Fetching VDH PDFs for {VDH_YEAR}...")

    def dl(key: str) -> Path | None:
        url = VDH_FILES[key]
        dest = tmpdir / f"{key}.pdf"
        ok = download_pdf(url, dest)
        return dest if ok else None

    # --- Live births ---
    pdf = dl("births")
    if pdf:
        row = find_richmond_row(pdf)
        if row:
            # Format: RICHMOND CITY | occur_total occur_white occur_black occur_other |
            #         res_total res_white res_black res_other |
            #         rate_total rate_white rate_black rate_other
            # Typical: RICHMOND CITY 3604 1668 1435 501 2999 1229 1468 302 12.9 10.8 13.3 38.5
            nums = [x for x in row if x not in ("RICHMOND", "CITY")]
            if len(nums) >= 12:
                records += [
                    indicator("maternal_health","birth_outcomes","Resident Live Births",
                              int(nums[4].replace(",","")), "count",src,src_url,VDH_YEAR),
                    indicator("maternal_health","birth_outcomes","Birth Rate (per 1,000 population)",
                              safe_float(nums[8]),"per 1,000",src,src_url,VDH_YEAR,
                              va_average=None),
                ]

    # --- Birth rates + non-marital ---
    pdf = dl("birth_rates")
    if pdf:
        row = find_richmond_row(pdf)
        if row:
            nums = [x for x in row if x not in ("RICHMOND","CITY")]
            # Format: res births (total, W, B, O) | rates | non-marital count (T W B O) | pct
            # RICHMOND CITY 2999 1229 1468 302 51.0 40.1 57.4 115.8 1776 335 1255 186 59.2 27.3 85.5 61.6
            if len(nums) >= 13:
                records += [
                    indicator("maternal_health","birth_outcomes","Non-Marital Births",
                              safe_float(nums[12]),"%",src,src_url,VDH_YEAR,
                              race="all",definition="% of live births to unmarried mothers"),
                    indicator("maternal_health","birth_outcomes","Non-Marital Births",
                              safe_float(nums[13]),"%",src,src_url,VDH_YEAR,race="white"),
                    indicator("maternal_health","birth_outcomes","Non-Marital Births",
                              safe_float(nums[14]),"%",src,src_url,VDH_YEAR,race="black"),
                ]

    # --- Low weight births ---
    pdf = dl("low_weight")
    if pdf:
        row = find_richmond_row(pdf)
        if row:
            nums = [x for x in row if x not in ("RICHMOND","CITY")]
            # Format: LBW total W B O | pct total W B O | VLBW total W B O | pct T W B O
            # RICHMOND CITY 346 81 242 23 11.5 6.6 16.5 7.6 82 18 58 6 2.7 1.5 4.0 2.0
            if len(nums) >= 16:
                records += [
                    indicator("maternal_health","birth_outcomes","Low Birth Weight (<2,500g)",
                              safe_float(nums[4]),"%",src,src_url,VDH_YEAR,
                              va_average=8.3, race="all",
                              definition="% of live births weighing less than 2,500 grams"),
                    indicator("maternal_health","birth_outcomes","Low Birth Weight (<2,500g)",
                              safe_float(nums[5]),"%",src,src_url,VDH_YEAR,race="white"),
                    indicator("maternal_health","birth_outcomes","Low Birth Weight (<2,500g)",
                              safe_float(nums[6]),"%",src,src_url,VDH_YEAR,race="black"),
                    indicator("maternal_health","birth_outcomes","Very Low Birth Weight (<1,500g)",
                              safe_float(nums[12]),"%",src,src_url,VDH_YEAR,
                              va_average=1.4, race="all"),
                    indicator("maternal_health","birth_outcomes","Very Low Birth Weight (<1,500g)",
                              safe_float(nums[14]),"%",src,src_url,VDH_YEAR,race="black"),
                ]

    # --- Infant deaths ---
    pdf = dl("infant_deaths")
    if pdf:
        row = find_richmond_row(pdf)
        if row:
            nums = [x for x in row if x not in ("RICHMOND","CITY")]
            # Format: occ_total occ_W occ_B occ_O | res_count T W B O | rates T W B O
            # RICHMOND CITY 57 20 31 6 21 7 13 1 7.0 5.7 8.9 3.3
            if len(nums) >= 12:
                records += [
                    indicator("maternal_health","infant_mortality","Infant Mortality Rate",
                              safe_float(nums[8]),"per 1,000 live births",
                              src,src_url,VDH_YEAR, va_average=5.3,
                              race="all",
                              notes="Suppress if fewer than 20 deaths — counts near threshold"),
                    indicator("maternal_health","infant_mortality","Infant Mortality Rate",
                              safe_float(nums[9]),"per 1,000 live births",
                              src,src_url,VDH_YEAR,race="white"),
                    indicator("maternal_health","infant_mortality","Infant Mortality Rate",
                              safe_float(nums[10]),"per 1,000 live births",
                              src,src_url,VDH_YEAR,race="black"),
                    indicator("maternal_health","infant_mortality","Resident Infant Deaths",
                              int(nums[4]),"count",src,src_url,VDH_YEAR,race="all"),
                ]
                # Derived disparity metrics
                imr_black = safe_float(nums[10])
                imr_white = safe_float(nums[9])
                if imr_black and imr_white and imr_white > 0:
                    records += [
                        indicator("maternal_health","infant_mortality",
                                  "Infant Mortality Rate — Black–White Difference",
                                  round(imr_black - imr_white, 1),
                                  "per 1,000",src,src_url,VDH_YEAR),
                        indicator("maternal_health","infant_mortality",
                                  "Infant Mortality Rate — Black–White Ratio",
                                  round(imr_black / imr_white, 2),
                                  "ratio",src,src_url,VDH_YEAR),
                    ]

    # --- Fetal deaths ---
    pdf = dl("fetal_deaths")
    if pdf:
        row = find_richmond_row(pdf)
        if row:
            nums = [x for x in row if x not in ("RICHMOND","CITY")]
            if len(nums) >= 6:
                records.append(indicator(
                    "maternal_health","birth_outcomes","Fetal Mortality Rate",
                    safe_float(nums[4]) if len(nums) > 4 else None,
                    "per 1,000",src,src_url,VDH_YEAR,
                    definition="Fetal deaths per 1,000 live births + fetal deaths"))

    # --- Teen pregnancy ---
    pdf = dl("teen_pregnancy")
    if pdf:
        row = find_richmond_row(pdf)
        if row:
            nums = [x for x in row if x not in ("RICHMOND","CITY")]
            if nums:
                records.append(indicator(
                    "maternal_health","adolescent_health","Teen Pregnancies (Total)",
                    int(nums[0].replace(",","")),"count",
                    src,src_url,VDH_YEAR,
                    definition="Total pregnancies to women under age 20"))

    print(f"  VDH: {len([r for r in records if r['source']=='VDH'])} indicators")


# ---------------------------------------------------------------------------
# VDOE static files
# ---------------------------------------------------------------------------
def load_vdoe(records: list) -> None:
    print("Loading VDOE static files...")
    src = "VDOE"

    # School quality JSON
    sq_path = DATA_DIR / "vdoe_school_quality.json"
    if sq_path.exists():
        sq = json.loads(sq_path.read_text())
        src_url = sq.get("source_url","")
        sol = sq.get("sol_pass_rate_pct", {})
        grad = sq.get("graduation_rate_4yr_pct", {})
        y = 2025

        for subject, data in sol.items():
            if not isinstance(data, dict):
                continue
            records.append(indicator(
                "education","academic_performance",
                f"SOL Pass Rate — {subject.title()}",
                data.get("division_2024_2025"), "%",
                src, src_url, y,
                va_average=data.get("state_2024_2025"),
                definition=f"% of students passing {subject.title()} Standards of Learning assessment"))

        records += [
            indicator("education","enrollment","Total Student Enrollment",
                      sq.get("enrollment_total",{}).get("2024_2025"), "count",
                      src,src_url,y),
            indicator("education","attendance","Chronic Absenteeism Rate",
                      sq.get("chronic_absenteeism_2024_2025",{}).get("pct_missed_10pct_or_more_days"),
                      "%",src,src_url,y,
                      definition="% of students missing 10% or more of enrolled school days"),
            indicator("education","graduation","4-Year Graduation Rate",
                      grad.get("2024_2025",{}).get("division"), "%",
                      src,src_url,y,
                      va_average=grad.get("2024_2025",{}).get("state")),
            indicator("education","graduation","Dropout Rate",
                      sq.get("dropout_rate_pct",{}).get("division_class_of_2025"), "%",
                      src,src_url,y,
                      va_average=sq.get("dropout_rate_pct",{}).get("state_class_of_2025")),
            indicator("education","postsecondary","Postsecondary Enrollment Rate",
                      sq.get("postsecondary_enrollment_pct",{}).get("division"), "%",
                      src,src_url,2022,
                      va_average=sq.get("postsecondary_enrollment_pct",{}).get("state"),
                      definition="% of graduates enrolled in college within 16 months"),
            indicator("poverty","food_assistance","Students Qualifying for Free Lunch (CEP)",
                      100.0, "%", src,
                      "https://www.vdoe.virginia.gov/data-policy-funding/data-reports/statistics-reports/free-reduced-price-lunch-eligibility",
                      2025,
                      definition="Richmond City is a CEP district — 100% of students qualify for free meals"),
        ]

    # Cohort graduation by race (CSV)
    # Columns: Cohort Year, Level, Division Number, Division Name, Type of Graduation Rate,
    #          Rate Type, Race, Gender, Disadvantaged, English Learner, Homeless,
    #          Military, Foster Care, Disabled, Graduation Rate, ...
    grad_path = DATA_DIR / "vdoe_cohort_graduation.csv"
    if grad_path.exists():
        grad_url = "https://www.vdoe.virginia.gov/data-policy-funding/data-reports/statistics-reports/cohort-graduation-statistics"
        # Aggregate by race: collect M+F non-subgroup rows and compute weighted avg
        from collections import defaultdict
        cohorts: dict = defaultdict(lambda: {"grads": 0, "total": 0})
        with open(grad_path, newline="", encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                if (row.get("Division Name", "").strip() != "Richmond City"
                        or row.get("Type of Graduation Rate", "").strip() != "Federal Graduation Indicator"
                        or row.get("Rate Type", "").strip() != "4 yr rate"
                        or row.get("Disadvantaged", "").strip() != "N"
                        or row.get("English Learner", "").strip() != "N"
                        or row.get("Disabled", "").strip() != "N"):
                    continue
                year_str = row.get("Cohort Year", "").strip()
                race_raw = row.get("Race", "").strip()
                total_str = row.get("Students in Cohort", "").strip().replace(",","")
                grads_str = row.get("Total Graduates", "").strip().replace(",","")
                if not year_str or race_raw == "<" or total_str in ("<","") or grads_str in ("<",""):
                    continue
                race_map = {
                    "Black, not of Hispanic origin": "black",
                    "White, not of Hispanic origin": "white",
                    "Hispanic": "hispanic",
                    "Asian": "asian",
                    "American Indian or Alaska Native": "american_indian",
                    "Native Hawaiian  or Pacific Islander": "pacific_islander",
                    "Non-Hispanic, two or more races": "multiracial",
                }
                race_key = race_map.get(race_raw, race_raw.lower()[:20])
                key = (year_str, race_key)
                try:
                    cohorts[key]["grads"] += int(grads_str)
                    cohorts[key]["total"] += int(total_str)
                except ValueError:
                    continue

        for (year_str, race_key), vals in cohorts.items():
            if vals["total"] > 0:
                rate = round(vals["grads"] / vals["total"] * 100, 1)
                year_val = int(year_str) if year_str.isdigit() else None
                records.append(indicator(
                    "education","graduation","4-Year Graduation Rate",
                    rate,"%",src,grad_url,year_val,race=race_key))

    print(f"  VDOE: {len([r for r in records if r['source']=='VDOE'])} indicators")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(description="Refresh Richmond People Data")
    parser.add_argument("--skip-vdh", action="store_true",
                        help="Skip VDH PDF download/parse step")
    parser.add_argument("--skip-census", action="store_true")
    parser.add_argument("--skip-cdc", action="store_true")
    args = parser.parse_args()

    if not CENSUS_API_KEY:
        print("ERROR: CENSUS_API_KEY environment variable not set.", file=sys.stderr)
        print("  Set it in .env.local or as a GitHub Actions secret.", file=sys.stderr)
        sys.exit(1)

    records: list[dict] = []

    try:
        if not args.skip_census:
            fetch_census(records)
    except Exception as e:
        print(f"ERROR in Census fetch: {e}", file=sys.stderr)

    try:
        if not args.skip_cdc:
            fetch_cdc_places(records)
            fetch_cdc_teen_births(records)
    except Exception as e:
        print(f"ERROR in CDC fetch: {e}", file=sys.stderr)

    try:
        fetch_vdh(records, skip=args.skip_vdh)
    except Exception as e:
        print(f"ERROR in VDH fetch: {e}", file=sys.stderr)

    try:
        load_vdoe(records)
    except Exception as e:
        print(f"ERROR in VDOE load: {e}", file=sys.stderr)

    # Write output
    DATA_DIR.mkdir(exist_ok=True)
    out = {
        "generated": date.today().isoformat(),
        "total_indicators": len(records),
        "indicators": records,
    }
    OUT_FILE.write_text(json.dumps(out, indent=2))
    print(f"\nWrote {len(records)} indicators to {OUT_FILE}")
    print("\nBreakdown by category:")
    from collections import Counter
    for cat, count in Counter(r["category"] for r in records).most_common():
        print(f"  {cat:30s} {count}")
    print("\nBreakdown by source:")
    for src, count in Counter(r["source"] for r in records).most_common():
        print(f"  {src:30s} {count}")


if __name__ == "__main__":
    main()
