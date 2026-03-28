# Richmond People Data Portal — Full Build Plan
## Hack for RVA · Pillar 3: Thriving Families · Submission: Saturday March 28, 2026

---

## What You Are Building — One Sentence

A maternal health data dashboard for Richmond nonprofits and city staff that unifies Census, VDH, and Kids Count data in one place — expanded to cover all people data categories — with a Claude-powered Q&A tool, natural language chart builder, verified community data contribution, and data export.

## Why This Answers the Judge Prompt

The judge asks: *"Could a maternal health nonprofit analyst open this and stop recreating a spreadsheet they've built three times before?"*

**Answer: Yes.** The Health tab shows Richmond's maternal health indicators — infant mortality, birth outcomes, health insurance coverage — sourced from VDH and Census, in one place, with sources visible. That is exactly the judge prompt answered.

The broader people data categories (Population, Poverty, Education) and extra features (Q&A, Chart Builder, Contribution) increase the Innovation score. They do not distract from the core answer.

## Non-Negotiable Minimum (must exist by Saturday morning)
1. Live Vercel URL
2. Dashboard home with real Richmond data (Census API already verified)
3. Health tab with maternal health indicators from VDH + Census
4. At least one chart + one data table with CSV export

Everything else — Q&A, chart builder, community contribution, map, other category tabs — is bonus on top of a working submission.

---

## What We're Building and Why

**The problem (from city officials directly):**
Richmond's Office of Children and Families, health orgs, nonprofits, and elected officials all pull the same public data independently — Census, VDH, Kids Count — and end up with different numbers for the same metric. Nobody's working from the same denominator. Budget decisions are made on "vibes." A council member can't instantly answer "how many children under 5 are in my district?"

Jackie Hale (city official, on record): *"People data portal. Yay. I want this for my job so bad."*

**Why we win:**
- Only team solving the data coordination problem (everyone else built youth employment)
- Live deployed URL — judges can click through it themselves
- City officials are our champions in the room
- Natural language chart builder + Q&A tool + verified contribution = features no other team has

---

## The Problem Statement We're Solving

**Problem 2: Maternal Health Data Coordination** (judge rubric)
> *"How might we use technology to reduce fragmented and duplicative maternal health data analysis across agencies and nonprofit organizations so that Richmond's maternal health ecosystem can operate from unified, consistent metrics?"*

**What the city actually wants** (from the morning session transcript):
> Inclusion of people data on the open data portal — demographic, population, education, health data — filterable by race, age, district, with Tableau-like functionality. So every department and partner is singing from the same songbook.

**Our answer:** Build both. The portal serves all people data. The demo leads with maternal health.

---

## Data Sources (Research-Verified)

### 1. Census ACS 5-Year API ✅ Verified working
- **Key:** `d86d6e9d2b18acd1e390f51b48799fbfe5d6ae7c` (activated March 27, 2026)
- **Richmond FIPS:** state 51, county 760 (independent city = county-equivalent)
- **Confirmed:** population 227,595 · poverty 40,994
- **Tables to pull:**
  - `S1701` — poverty status
  - `S2701` — uninsured rates
  - `S1301` — fertility
  - `DP05` — demographic profile
  - `B03002`, `B01001` — race/ethnicity + age/sex

### 2. VDH Maternal & Child Health Dashboard — Primary Source
- **URL:** vdh.virginia.gov/data/maternal-child-health/mch-indicators/
- **Format:** CSV export · updated October 2025 with 2023 data
- **Key indicators:** preterm birth (12.5% — F grade vs VA 10.1%), infant mortality (5.8/1,000), low birth weight, maternal smoking, WIC enrollment, teen pregnancy
- **⚠ Warning:** Use rolling 3–5 year averages for mortality — Richmond counts often <20 (suppression threshold)
- **⚠ Warning:** Do NOT show trends crossing 2018 — ICD coding change breaks comparability

### 3. Kids Count Virginia — Triangulation/Fallback
- **URL:** datacenter.kidscount.org
- **Format:** CSV · Richmond city available
- **Key indicators:** child poverty, uninsured children, low birthweight, infant mortality
- **Use as:** verification against VDH (definitions may vary slightly)

### 4. Virginia Health Opportunity Index (HOI) — Neighborhood Map
- **URL:** Virginia Open Data Portal
- **Format:** Single CSV download · 1,875 census tracts · Richmond has 94 tracts
- **Use for:** SDOH neighborhood map (Access, Affordability, Food, Segregation, Material Deprivation)

### 5. Community Contributions (verified users)
- Submitted by verified city staff and nonprofit partners
- Stored in Supabase with "Community Contributed" badge
- Never confused with official data

### 6. HRSA MCHB Mapping Tool — Reference Only (NOT a data source)
- **URL:** data.hrsa.gov/topics/maternal-child-health/mchb-mapping
- **What it is:** Federal tool showing maternal/infant health indicators at the county level across the US — essentially the national version of what we're building
- **How we use it:** NOT as a data source. We use it for two things:
  1. **Indicator catalog** — the list of metrics HRSA tracks defines the standard set of maternal health indicators federal health agencies care about. Our Health tab should cover these same indicators (sourced from VDH + Census, not from HRSA directly).
  2. **Pitch validation** — "The federal government spent real money building this nationally. We built a better, more interactive version specifically for Richmond in a weekend."
- **Key HRSA indicator categories to mirror in our Health tab:**
  - Health Outcomes: Breastfeeding initiation, C-section rate, Preterm births, Low birth weight, Infant mortality, Prenatal care (1st trimester), Smoking during pregnancy, Fetal mortality
  - Disparities: Black infant mortality rate, White infant mortality rate, Black-White IMR ratio, Deaths due to disparity — Black infants
  - Access: OB-GYN provider rate, Hospitals with obstetric care, MIECHV coverage areas
  - Social Determinants: Poverty, Housing cost burden, Uninsured women 18-49, Social Deprivation Index
- **Source for actual Richmond values:** VDH CSV and Census ACS (already verified) — not HRSA

## Key Richmond Stats to Feature in Demo
| Indicator | Richmond | Virginia | Source |
|-----------|----------|----------|--------|
| Preterm birth rate | **12.5% (F grade)** | 10.1% (C) | March of Dimes 2024 |
| Infant mortality | 5.8 per 1,000 | 5.9 per 1,000 | VDH MCH 2023 |
| Black infant mortality | — (show vs White) | — | VDH MCH 2023 |
| Black-White IMR ratio | — | — | VDH MCH 2023 |
| Black maternal mortality | — | 69.9 per 100k | VDH |
| White maternal mortality | — | 13.2 per 100k | VDH |
| Discrimination during pregnancy | **41.21% reported** | — | VA PRAMS/RCHD |
| Unintended pregnancy | 45.19% | — | VA PRAMS/RCHD |
| Maternal depression | 16.83% | — | VA PRAMS/RCHD |
| People below poverty line | 40,994 (18.8%) | — | Census ACS 2023 |

---

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Framework | Next.js 14 (App Router) | Deploys perfectly to Vercel |
| Deployment | Vercel (via Vercel MCP) | Live URL in minutes |
| Database | Supabase (via Supabase MCP) | Normalized data + user auth + contributions |
| Charts | Recharts | Fast, React-native, beautiful |
| Maps | React-Leaflet + OpenStreetMap | Free, no API key, works offline |
| Animations | Framer Motion | Animated stat counters, page transitions |
| Tables | TanStack Table | Filterable, sortable, exportable |
| Q&A + Chart AI | Claude API (Anthropic SDK) | Q&A + natural language chart generation |
| Auth | Supabase Auth (Google sign-in) | Verified user contributions |

---

## Features — What Gets Built

### 1. Dashboard Home
- Top nav: "RVA People Data" logo + category tabs + source badges (Census · VDH · Kids Count)
- Hero StatCards with Framer Motion animated counters:
  - Total Richmond population: 227,595
  - People below poverty line: 40,994 (18.8%)
  - Children without health insurance (from Census)
  - Infant mortality rate (from VDH)
- Each card shows: value + source + year + definition on hover
- "Last updated" visible on every card
- "Not for clinical use" persistent banner

### 2. Category Tabs
Four data categories, each with its own view:
- **Population** — total population, age breakdown, race breakdown
- **Poverty & Economic** — poverty rate, household income, food insecurity
- **Health** — maternal health outcomes (preterm birth, infant mortality, low birth weight, prenatal care, C-section rate, breastfeeding initiation, smoking during pregnancy), racial disparities (Black-White IMR ratio, deaths due to disparity), and access indicators (OB-GYN rate, hospitals with OB care) **(PRIMARY DEMO VIEW — indicators aligned with federal HRSA MCHB standards)**
- **Education & Children** — children under 5, school enrollment, chronic absenteeism

### 3. Visualizations
- **Bar chart:** Richmond vs Virginia state average (side by side) for selected indicator
- **Donut chart:** demographic breakdown (age groups or race) for selected indicator
- **Line chart:** trend over years where data allows — **blocked from crossing 2018 for mortality**
- **Map:** Richmond city districts choropleth *(drop this if time is short)*

### 4. Data Table with Filter (NYC Open Data / Our World in Data style)
- All indicators in one searchable, sortable table
- Columns: Indicator | Value | VA Average | Source | Year | Definition
- Filter by: category, source, year
- Every row has a clickable source link
- Suppression badge when N<20

### 5. Q&A Tool (MCP — NOT on the website)
- NOT a chat UI on the dashboard
- Instead: an MCP server built on top of Supabase that exposes Richmond indicator data as tools Claude can query
- Users who work inside Claude.ai or Claude Code can connect to this MCP server and ask questions conversationally: *"How many Black women of childbearing age are below the poverty line in Richmond?"*
- Claude queries Supabase via the MCP tools and responds with source citations
- This is a power-user feature for city staff and analysts already in Claude — not the primary way to use the site
- Always cites source. Never makes clinical recommendations.
- **Demo talking point:** "And for analysts who work in Claude, this same data is queryable directly from their Claude interface — no browser needed."

### 6. Natural Language Chart Builder (Text-to-Chart)
- User types: *"Show me the relationship between poverty and preterm birth in Richmond"*
- Claude identifies which indicators match the request from Supabase
- Claude selects the right chart type automatically:
  - Correlation question → scatter plot
  - Comparison question → side-by-side bar
  - Trend question → line chart (with 2018 crossing blocked for mortality)
  - Breakdown question → donut/stacked bar by demographic
- Claude outputs structured JSON: `{chart_type, indicators[], title, x_label, y_label, notes}`
- Frontend renders the chart from that JSON using Recharts
- Below the chart: plain-language interpretation + source citations for every indicator
- Compatibility warnings drawn from the `notes` field on each indicator:
  - ⚠ "These indicators are from different years — interpret with caution"
  - ⚠ "Do not compare maternal mortality trends crossing 2018"
  - ⚠ "These indicators use different denominators — interpret with caution"
- Export chart as PNG with auto-embedded citation footer
- Claude proactively suggests related pairings

**Token usage — rate limiting:**
- **5 requests per browser session** — tracked in localStorage, no login needed
- After 5 requests: "Chart builder limit reached for this session. All other features remain available."
- This caps Claude API costs without blocking any other part of the site
- Post-hackathon upgrade path: require Google sign-in to use chart builder

**Implementation:**
- Claude system prompt contains full indicator catalog (name, source, table, year, definition, notes)
- User message → Claude → structured JSON → Recharts renders
- Indicator catalog loaded from static JSON file at build time (not a live Supabase query)

### 7. Verified Community Data Contribution (Transit app style)
- Sign in via Google (Supabase Auth)
- Submit: Metric | Value | Source/basis | Date | Organization
- Submitted data → Supabase status "pending" → admin approves → "Community Contributed" badge
- Clearly separated from official government data at all times
- First verified users: Eva Colen and Jackie Hale can demo this themselves Saturday

### 8. Export Dataset
- Download CSV button on every table
- File includes: indicator, value, source, year, definition
- Pure client-side generation, no backend needed

### 9. Export Report (stretch goal — only if 1–8 are done)
- "Generate report on this topic" button
- Claude writes a 1-page narrative summary of visible data
- User copies or downloads as text

---

## File Structure

```
/richmond-people-data
  /app
    /page.tsx                  — dashboard home (StatCards + category tabs)
    /population/page.tsx       — population category view
    /health/page.tsx           — health/maternal health view (PRIMARY DEMO VIEW)
    /poverty/page.tsx          — poverty & economic view
    /education/page.tsx        — education & children view
    /contribute/page.tsx       — verified data contribution form
    /api/chart/route.ts        — Claude chart builder API endpoint (natural language → chart JSON)
    /api/mcp/route.ts          — MCP server endpoint (exposes Supabase data as Claude-queryable tools)
    /layout.tsx                — shared nav + footer
  /components
    /StatCard.tsx              — animated number card (Framer Motion)
    /ChartBar.tsx              — Recharts bar chart (Richmond vs VA)
    /ChartDonut.tsx            — Recharts donut (demographic breakdown)
    /ChartLine.tsx             — Recharts line chart (trend over years)
    /ChartScatter.tsx          — Recharts scatter (correlation)
    /MapView.tsx               — React-Leaflet choropleth map
    /DataTable.tsx             — TanStack filterable/sortable table
    /ExportCSV.tsx             — CSV download button
    /ChartBuilder.tsx          — Natural language → chart UI (on the website)
    /ContributeForm.tsx        — verified user data submission form
    /SourceBadge.tsx           — source citation chip
    /SuppressionBadge.tsx      — N<20 suppression warning
    /CategoryTabs.tsx          — navigation tabs
  /data
    /census.json               — pre-fetched Census ACS data for Richmond
    /vdh.json                  — VDH maternal health indicators
    /kidscount.json            — Kids Count Virginia indicators
    /indicator-catalog.json    — full catalog for Claude system prompt
  /lib
    /census.ts                 — Census API fetch functions
    /supabase.ts               — Supabase client
    /claude.ts                 — Claude API wrapper (chart builder only)
    /mcp.ts                    — MCP server tool definitions (Q&A via Claude.ai)
    /exportCSV.ts              — CSV generation utility
```

---

## Database Schema (Supabase)

```sql
-- Official data cache
create table indicators (
  id uuid primary key default gen_random_uuid(),
  category text,           -- 'health', 'population', 'poverty', 'education'
  name text,               -- 'Infant Mortality Rate'
  value numeric,
  unit text,               -- 'per 1,000 births', '%', 'count'
  source text,             -- 'VDH', 'Census ACS', 'Kids Count'
  source_url text,
  year int,
  definition text,
  va_average numeric,
  suppressed boolean default false,
  data_quality text default 'final',  -- 'final', 'provisional', 'modeled'
  notes text,                         -- compatibility warnings, caveats, year range notes
  created_at timestamptz default now()
);

-- Community contributions
create table contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  organization text,
  category text,
  name text,
  value numeric,
  unit text,
  basis text,
  date_collected date,
  status text default 'pending',
  created_at timestamptz default now()
);
```

---

## Build Timeline

### Tonight — Friday March 27 (~4 hours)
**Goal: working skeleton deployed to Vercel with real data**

1. `npx create-next-app richmond-people-data --typescript --tailwind --app`
2. Install: `recharts react-leaflet framer-motion @tanstack/react-table @supabase/supabase-js @anthropic-ai/sdk`
3. Deploy skeleton to Vercel → live URL tonight
4. Set up Supabase project → create tables
5. Fetch Census API data → normalize → insert into Supabase
6. Build StatCard with Framer Motion animated counter
7. Dashboard home with 4 StatCards showing real Richmond data

**End of Friday:** Live URL with animated real data.

### Saturday Morning (~4 hours)
**Goal: all core features working**

8. Category tabs + health/page.tsx (primary demo view)
9. ChartBar (Richmond vs Virginia comparison)
10. DataTable + CSV export
11. Q&A chat (Claude API endpoint + UI)
12. Natural language chart builder (Claude API endpoint + UI)
13. Supabase Auth + ContributeForm
14. VDH + Kids Count data inserted
15. Final deploy — demo ready

### Saturday Afternoon (if time allows)
16. Map (district choropleth)
17. Report export
18. Polish animations + layout

### If Time Runs Short — Cut In This Order
1. Drop the map
2. Drop report export
3. Drop Kids Count
4. Drop chart builder (keep Q&A)
5. **Never drop:** StatCards, Health tab, DataTable, CSV export

---

## Demo Script (3 minutes)

**Setup:**
> "Richmond has a data problem. Five organizations download the same Census and VDH data independently and show up to meetings with different numbers. Budget decisions are made on vibes. Jackie Hale from the Office of Children and Families said this morning she needs this tool for her job."

**Open dashboard:**
> "Here's Richmond's People Data Portal. 227,595 residents. 40,994 living below the poverty line. Sourced from Census ACS 2023 — right there on the card."

**Switch to Health tab:**
> "A maternal health analyst researching a grant opens the Health view. Richmond's preterm birth rate is 12.5% — an F grade compared to Virginia's C. Infant mortality. Birth outcomes. All in one place. No spreadsheet. No manual reconciliation."

**Show Q&A tool:**
> "She types: 'How many Black women of childbearing age are below the poverty line in Richmond?' — answered from the data, with the source citation."

**Show chart builder:**
> "She types: 'Show me the relationship between poverty and preterm birth.' Claude builds the chart automatically — scatter plot, sourced, cited, ready to drop in a grant application."

**Show Contribution form:**
> "And when Girls For A Change knows their program serves 340 youth in zip 23224 — data Census doesn't have — a verified partner submits it. Community-contributed. Clearly tagged."

**Show CSV export:**
> "She downloads the dataset. Done."

**Close:**
> "The federal government built something like this nationally — HRSA's Maternal and Infant Health Mapping Tool. We built a better version specifically for Richmond, with a Q&A tool, a chart builder, and community data contribution, in a weekend. One place. Shared numbers. Shared definitions. No more vibes."

---

## Rubric Alignment

| Category | Weight | Target | How We Hit It |
|----------|--------|--------|---------------|
| Impact | ×5 | 5 | Eliminates duplicated data work for maternal health orgs and city staff |
| User Value | ×4 | 5 | Analyst stops rebuilding the same spreadsheet; gets instant grant-ready charts |
| Feasibility | ×3 | 5 | All public data, no City system access, Eva/Jackie can pilot Monday |
| Innovation | ×3 | 5 | Natural language chart builder + Q&A + community contribution = unique |
| Execution | ×3 | 5 | Live URL, judges click through it themselves |
| Equity | ×3 | 4 | Centers Black maternal health outcomes; community contribution fills official data gaps |

**Projected score: 100–105 / 105**

---

## Guardrails (From Research — Non-Negotiable)

### Data Integrity
- **Never compare trends crossing 2018** — ICD coding change breaks maternal mortality comparability; block in UI
- **Suppress counts <20** — show as "data suppressed (N<20)" with badge
- **Use 3–5 year rolling averages** for mortality indicators
- **Label modeled data** — show "Modeled estimate" badge + confidence intervals for any CDC PLACES data
- **Distinguish MMR vs PRMR** — maternal mortality (≤42 days) vs pregnancy-associated deaths (≤365 days) are NOT comparable; never mix

### UI Requirements
- **"Last updated" always visible** on every indicator card
- **Source citation on every data point** — source name + year + access date + URL
- **"Not for clinical use" persistent banner** — never removed
- **"Not an official City publication" statement** in footer
- **Provisional vs Final badge** — flag any provisional data
- **Suppression badge** — visible when N<20

### What We Must NOT Build
- ❌ Risk scores or clinical recommendations
- ❌ Neighborhood-level maternal death mapping (suppression + privacy)
- ❌ Hospital-level quality benchmarking (VHHA data member-restricted)
- ❌ Live HIPAA data exchange
- ❌ Any feature implying the tool is an official City product
