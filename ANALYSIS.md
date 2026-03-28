# Gap Analysis — RVA People Data vs. Pillar 3 Rubric
Richmond Civic Hackathon · March 27–29, 2026

---

## Which Problem We're Solving

**Problem 2: Maternal Health Data Coordination** — a shared indicator dashboard built from confirmed public data sources.

Judge prompt: *"Could a maternal health nonprofit analyst open this and stop recreating a spreadsheet they've built three times before?"*

---

## Critical Data Missing From the Database

| Indicator | Research Says | Current Build |
|---|---|---|
| **Preterm Birth Rate** | Richmond City 12.5% (March of Dimes "F" grade) — headline stat in every demo script | Not in database |
| **Late / No Prenatal Care** | Listed as a required indicator card in MVP spec (H3) | Not present |
| **Severe Maternal Morbidity** | SMM per 10,000 deliveries | Not present |
| **Maternal Mortality** | 33.4 per 100,000 — VDH 2018–2023 | Not present |
| **Pregnancy-Associated Deaths** | 37.4% occur 43–365 days postpartum; 40% are overdoses | Not present |
| **WIC Use During Pregnancy** | Explicitly listed as required card in H3 | Not present |
| **Kids Count Data** | Named in rubric; research calls it the primary backup source; has Richmond-specific CSVs for low birthweight, infant mortality, teen births | Not present |

**Most damaging gap:** Preterm birth at 12.5% is the single stat used in every demo script, grant pitch, and equity framing in the research files. Richmond earns an "F" from March of Dimes because of it. It is not in the database.

---

## The "Grant Pack" Feature Is the Core Product — Not Built

The research (I3) describes the killer feature: *"With one click, export a bundle: harmonized metrics, methodology notes, citation stamps, suppression flags — ready to attach to an RFP."*

The research quantifies the value:
| Task | Status Quo | With Tool |
|---|---|---|
| Source identification (5–7 sources) | 2–3 hours | 5 minutes |
| Vintage/geography harmonization | 2 hours | Automated |
| Map creation/overlays | 1–2 hours | 5 minutes |
| Methods/citation write-up | 1 hour | Auto-included |
| **Total per grant pack** | **6–8 hours** | **<30 minutes** |

The current CSV export button is not this. It dumps a raw data table. It has no pre-curated indicator set, no citation stamps, no "latest stable year" badge, no methodology notes, no suppression flags.

---

## Four User Personas — Only One Addressed

The user research (B3) identifies four personas:

| Persona | What They Need | Current Build |
|---|---|---|
| **Program Coordinator / Grants Lead** | Quick Facts builder, grant-ready export in 5 clicks | Partially — CSV export exists but isn't grant-ready |
| **Advocacy Nonprofit Researcher** | Equity module, rate ratios by race, disparity visuals | Numbers exist but disparity is invisible in the UI |
| **City/Health District Epidemiologist** | Data lineage, vintage badges, suppression warnings, custom queries | Not addressed |
| **Health System Quality Analyst** | Alignment with AHRQ measures, benchmarking | Not addressed |

Research says: *"a successful tool cannot be one-size-fits-all; it must offer a 'Quick Facts' interface for coordinators and an 'Analyst Mode' for epidemiologists."* Neither mode is explicitly present.

---

## Equity Story — Numbers Present, Story Invisible

The research equity framing centers on:
- Richmond Black low birth weight 16.5% vs. all 11.5% — **in the database, not surfaced**
- Richmond Black infant mortality 8.9 vs. all 7.0 vs. Virginia 5.3 — **in the database, not surfaced**
- 40% of postpartum deaths are overdoses, disproportionately affecting Black mothers — **not in database**

There is no disparity callout, no rate ratio calculation, no visual that makes the racial gap unmissable. A judge specifically scoring equity will see a dropdown and a bar chart.

---

## HOI (Virginia Health Opportunity Index) — Not Present

Research (F3) calls HOI *"the ultimate quick win dataset — 1,875 census tracts, 20 fields, zero API authentication required."* The demo pitch script walks through toggling on HOI as Step 2 of the 5-step demo. It maps neighborhood-level SDOH context that connects maternal outcomes to place.

No map layer, no tract-level data, no HOI exists in the current build.

---

## Vintage / Provisional Badges — Missing Trust Layer

Research (B3) says this is a core trust requirement: every stat needs a badge showing "Final" vs. "Provisional," and the tool should default to the latest stable year. A VDH epidemiologist would immediately distrust a dashboard that doesn't surface this.

The `year` column exists. No final/provisional distinction is shown anywhere.

---

## What Is Built and Aligns

- VDH 2020 maternal health indicators: live births, infant mortality, low birth weight, non-marital births, teen pregnancies (count) ✓
- Race disaggregation for VDH indicators (Black, White, all) ✓
- Census ACS 2023: poverty, uninsured, income, population ✓
- CDC PLACES 2022: obesity, depression, diabetes ✓
- VDOE 2025: enrollment, graduation, SOL, absenteeism ✓
- Automated pipeline (GitHub Actions, annual cron) ✓
- Live deployment on Vercel ✓
- No private data, no PII, no clinical claims ✓
- NL chart builder (Groq / Llama 3.3) ✓

Infrastructure is stronger than what the research recommended (Streamlit + CSV snapshots). The data foundation is real. The product framing is weak.

---

## Scoring Estimate

| Category | Weight | Score | Points | Reason |
|---|---|---|---|---|
| Impact | 5 | 2 | 10 | Missing preterm birth, prenatal care, Grant Pack, HOI |
| User Value | 4 | 2 | 8 | No Grant Pack, no persona differentiation, no workflow fit |
| Feasibility | 3 | 5 | 15 | Best in room — live, automated, deployed, no private data |
| Innovation | 3 | 3 | 9 | NL chart builder is real; pipeline is real; general dashboard is not new |
| Execution | 3 | 4 | 12 | Working live demo is strong — most teams won't have this |
| Equity | 3 | 2 | 6 | Numbers in DB but disparity is invisible in UI |
| **Total** | | | **60/105** | |

To be competitive: need ~85+.

---

## Priority Fix List

### Must fix (high score impact)

1. **Add preterm birth data** — Kids Count Virginia has it as a free CSV for Richmond City. This is the #1 missing stat. Without it the headline Richmond story cannot be told.

2. **Build the Grant Pack** — a single button that downloads a pre-curated set of the 8–10 most grant-relevant maternal health indicators with source citations. This is the difference between a data portal and a solution to the actual problem.

3. **Surface the disparity explicitly** — a visible callout card or comparison: Richmond Black infant mortality vs. Richmond overall vs. Virginia average, side by side, labeled. Make the racial gap unmissable.

4. **Add vintage labels** — "2023 Final" / "Provisional" badge per stat. 30 minutes of work, immediately signals credibility to health researchers.

### Nice to have

5. Kids Count data as a validation layer (low birthweight, infant mortality, teen births)
6. Postpartum death / overdose stat as a callout card
7. A one-sentence "who this is for" landing message (maternal health organizations, not a general city portal)
8. Preterm birth in the database (from Kids Count or CDC WONDER)
