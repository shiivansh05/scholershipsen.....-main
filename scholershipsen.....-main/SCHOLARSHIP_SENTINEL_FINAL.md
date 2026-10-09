# Scholarship Sentinel: Final Project Document

> Detect patterns, not individuals.

This is the single source of truth for the project: purpose, data, detection logic, features, architecture, API, design, build plan, demo script and judge Q&A. It supersedes `PROJECT.md`, `DEMO_DATA.md`, `DESIGN.md` and `VIBE_PROMPT.md`.

---

## 1. What we are building

A graph-based scholarship intelligence system. It links students, institutions, bank accounts, Aadhaar numbers, mobiles, addresses, guardians, documents and attendance into one relationship graph, then surfaces **explainable anomaly clusters** for human investigation.

One sentence: *a system that tells an officer which groups of applications look connected in ways that normal applications are not, shows exactly why, and leaves the decision to a human.*

### The pitch

| Traditional system | Scholarship Sentinel |
|---|---|
| "Is this application valid?" | "Across 10,000 applications, what hidden relationships are we missing?" |
| Checks one record at a time | Checks the network around every record |
| Output: pass or fail | Output: a cluster, a score, and the evidence |

### Principles

1. **Clusters, not accusations.** The unit of output is a cluster (CL-104). The system never calls a student fraudulent.
2. **Explainable.** Every flag lists the signals and the points behind it.
3. **Explainable non-flags.** The system also shows what it saw and chose not to flag, and why.
4. **Human decides.** Verify, assign, request documents, escalate or close are officer actions.
5. **Score is not probability.** 87/100 means several unusual signals together, not "87% fraud". The UI says this next to every score.
6. **Privacy by design.** Identifiers are pseudonymized before analysis; raw values are masked and unmasking is logged.

---

## 2. Data

### 2.1 Source roster: `students.csv`

155 complete rows, 13 columns. A sixth-to-twelfth-grade school roster.

| Column | Notes |
|---|---|
| Student_ID, Admission_No | Admission numbers repeat across classes, so treat as a weak key |
| Student_Name, Class, DOB, Category | Category values: Gen 59, OBC 59, SC 37 |
| Father_Name, Mother_Name | Used by Family Shield (section 4.2) |
| Aadhaar_No, Account_No, Contact_No, IFSC_Code | The linking identifiers |
| Identification_Mark | Free text, weak signal |

### 2.2 What the roster already contains (verified)

| Finding | Detail |
|---|---|
| Shared Aadhaar and bank account | Students 1, 19, 29 share one Aadhaar and one account. Students 16 and 40 share another pair. |
| Shared mobiles | 21, 26, 30 share one number. Pairs: 1 and 2; 14 and 34; 19 and 29; 22 and 31; 38 and 40. |
| Linked group A | 1, 2, 19, 29: Aadhaar and account shared by 1, 19, 29; mobiles link 1 to 2 and 19 to 29. |
| Linked group B | 16, 38, 40: Aadhaar and account shared by 16 and 40; mobile links 40 to 38. |
| Malformed Aadhaar | Student 37 has a 15-digit value (it resembles an account number). |
| IFSC variant | 152 rows use `JAKA0KALBAR`; students 15, 17, 18 use `JAKA0KALTAR`. |
| Over-age for class | 44 students are 4 or more years older than expected for their class (method in 4.1). Students 2 to 12 are in 10th grade at about 22 to 26 years old. |
| Siblings | Same father and mother: for example 14 and 33, 15 and 18, 20 and 25, 24 and 32. |
| Non-family mobile sharing | 14 and 34 share a mobile but have different parents. |

### 2.3 Known issue: rows 58 to 155 are filler

- Account numbers for students 49 to 155 are 107 consecutive values.
- Mobiles for students 58 to 155 are 98 consecutive values.
- Aadhaar checksum: 43 of 56 valid in rows 1 to 57 (excluding student 37), but only 9 of 98 valid in rows 58 to 155. That is about what random numbers give.
- Many pairs of Aadhaar numbers differ by one digit.

Sequence Forensics (4.1) will correctly flag these rows as a fabricated batch. Choose one:

| Option | Effect |
|---|---|
| **A. Regenerate rows 58+ (recommended)** | The generator produces random, checksum-valid Aadhaar numbers and non-sequential accounts and mobiles. Normal population stays normal. |
| B. Keep as is | The batch becomes a deliberate "fabricated batch" finding. It flags 107 of 155 students, which looks noisy. |
| C. Remove rows 58+ | Use only the 57 authentic-format rows plus generated data. |

### 2.4 Extended synthetic dataset (for scale)

The roster is one school and has no attendance, institution or application fields. The generator builds the rest, keeping the roster's formats.

| Item | Value |
|---|---|
| Seed | 42 |
| Applications | 10,000 |
| Students | about 9,200 |
| Institutions | 60 (the roster school is one of them) |
| Scholarship types | Merit, Minority, SC/ST, Post-Matric, Girl Child |
| Locale | Indian names, `en_IN` Faker |

Tables:

```
institutions(institution_id, name, state, district, type, registered_students, active_students)
students(student_id, name, name_key, class, dob, category, father, mother, family_id,
         institution_id, address_id, aadhaar_token, account_token, mobile_token, ifsc, ident_mark)
addresses(address_id, address_key, district, state)
applications(application_id, student_id, scholarship_type, amount, status, applied_on,
             disbursed_on, disbursed_flag)
attendance(student_id, total_classes, present_days, attendance_pct)
documents(document_id, student_id, doc_type, template_hash, issued_by, issued_on)
audit_log(seq, ts, actor, action, target, reason, prev_hash, entry_hash)
cases(case_id, cluster_id, status, assignee, opened_on, closed_on)
case_events(event_id, case_id, ts, actor, action, note)
```

Raw Aadhaar, account and mobile values live only in an encrypted vault table (section 4.8). The graph and the analysis use tokens.

Expected result after analysis:

| Band | Applications |
|---|---|
| Normal | 8,940 |
| Review required | 820 |
| High risk | 240 (inside 12 clusters) |

### 2.5 Normal population (about 8,940 applications)

- Each student has their own Aadhaar, account and mobile. Aadhaar numbers pass the Verhoeff checksum.
- Attendance mean 78%, standard deviation 12%, clamped to 35 to 100.
- Amounts: Merit 12,000 to 30,000; Minority 8,000 to 20,000; SC/ST 10,000 to 25,000; Post-Matric 9,000 to 22,000; Girl Child 7,000 to 15,000.
- Applications per institution never exceed 1.1 times active students.
- Age for class stays within 2 years of expected for 97% of students.
- 3% of names carry noise (case, spacing, initials) that must still normalize to the same key.
- Category mix follows the roster (about 38% Gen, 38% OBC, 24% SC), spread evenly across institutions.

### 2.6 Decoys (feed the Review band and test false positives)

| Decoy | Approx. apps | Expected band |
|---|---|---|
| Siblings with the same parents sharing address or mobile | 300 | Normal (Family Shield removes the penalty) |
| Two unrelated students sharing one mobile | 220 | Normal, shown under "seen but not flagged" |
| 3 unrelated students sharing a mobile across 2 schools plus an over-age member | 150 | Review (scores about 40) |
| Large institution with high but valid volume, plus mild attendance dip | 150 | Review |

### 2.7 Planted high-risk clusters (240 applications, 12 clusters)

| ID | Pattern | Apps |
|---|---|---|
| **CL-104** | Shared bank and mobile ring (hero): 4 students, 3 institutions | 4 |
| CL-107 | Ghost institution: 14 active students, 62 applications | 62 |
| CL-111 | Mobile farm: one number, 18 students, 5 institutions | 18 |
| CL-115 | Bank hub: one account, 9 payments, 4 institutions | 9 |
| CL-118 | Duplicate identity: name variants, same guardian and DOB | 31 |
| CL-122 | Attendance cohort: paid students with 0 to 5% attendance | 14 |
| CL-126 | Document template reuse across unrelated students | 22 |
| CL-131 | Sudden spike: 16 applications in 3 days | 16 |
| CL-135 | Address stack: 12 unrelated students at one address | 12 |
| CL-140 | Shared account plus similar documents | 20 |
| CL-144 | Guardian hub: one guardian, 17 students, 4 institutions | 17 |
| CL-149 | Second cross-institution ring with low attendance | 15 |

Total: 4 + 62 + 18 + 9 + 31 + 14 + 22 + 16 + 12 + 20 + 17 + 15 = 240.

CL-104 detail:

| Student | Institution | Attendance | Bank | Mobile |
|---|---|---|---|---|
| S003 | Institution 12 | 8% | BA103 | 98710003 |
| S006 | Institution 31 | 12% | BA103 | 98710003 |
| S007 | Institution 31 | 16% | BA103 | 98710003 |
| S008 | Institution 47 | 11% | BA103 | 98710003 |

Score: shared bank 25 + shared mobile 20 + cross-institution 15 + attendance 15 + documents 12 = **87**. Students have different names and addresses, so the link is visible only in the graph.

The generator also writes a hidden `ground_truth.csv` (student_id, cluster_id) used only for testing.

---

## 3. Processing pipeline

```
Raw data -> Clean -> Normalize -> Pseudonymize -> Entity match
         -> Graph -> Signals -> Family Shield -> Score -> Clusters -> Officer
```

| Step | What happens |
|---|---|
| Clean | Trim, fix encodings, parse dates (DD-MM-YYYY) |
| Normalize | Names lowercase, honorifics removed ("Smt"), spaces collapsed. Mobile: last 10 digits. Account and Aadhaar: digits only |
| Pseudonymize | HMAC-SHA256 with a secret key turns each identifier into a token. Raw value goes to the vault |
| Entity match | v1 exact keys. v2 fuzzy name (rapidfuzz) plus same DOB or same parents |
| Graph | Student nodes linked through shared-identifier nodes |
| Signals | Rules in section 4 |
| Family Shield | Discounts sharing explained by same-parent households (4.2) |
| Score | Additive points, capped at 100 |
| Clusters | Connected components with 2 or more students and a score of 40 or more |

### Graph model

Nodes: Student, Institution, Aadhaar, BankAccount, Mobile, Address, Guardian, Document.
Edges: ENROLLED_AT, HAS_AADHAAR, PAID_TO, USES_MOBILE, LIVES_AT, GUARDIAN_OF, HAS_DOCUMENT.

Clustering uses connected components over **shared-identifier nodes only** (Aadhaar, account, mobile, address, guardian, document hash). Institutions are cluster attributes, never links; otherwise the graph collapses into one giant component. Very common values (a school's main phone, a shared test address) are excluded by a degree cap (default 25).

---

## 4. Detection engine

### 4.1 Signals and points

| Signal | Condition | Points |
|---|---|---|
| Shared Aadhaar | 2+ students, one Aadhaar | +30 |
| Shared bank account | 2+ students, one account | +25 |
| Shared mobile (unrelated) | 3+ students | +20 |
| Shared mobile (unrelated) | 2 students | +12 |
| Cross-institution span | Cluster spans 2+ institutions | +15 |
| Attendance anomaly | Cluster mean attendance below 30% | +15 |
| Application surge | Applications above 3x active students | +15 |
| Document similarity | Same template or metadata hash | +12 |
| Shared address (non-family) | 5+ unrelated students | +10 |
| Sequential-identifier batch | 5+ consecutive account or mobile values | +20 |
| Near-duplicate identifier | Aadhaar or account differs by one digit | +10 |
| Invalid identifier | Aadhaar not 12 digits, fails Verhoeff, or malformed IFSC | +10 |
| Age-for-grade outlier | 4+ years above expected age | +5 |
| Family Shield | Sharing explained by same parents | -15 |

Score is the sum, floor 0, cap 100.

| Band | Range | Action |
|---|---|---|
| Normal | 0 to 39 | None |
| Review required | 40 to 69 | Queue for officer |
| High risk | 70 to 100 | Priority investigation |

Expected roster results (asserted in tests): group A scores 72 (Aadhaar 30 + account 25 + mobile 12 + age outlier 5, High). Group B scores 67 (Aadhaar 30 + account 25 + mobile 12, Review, three points under High).

Age-for-grade: expected age is grade number plus 5.5 years, measured at the analysis date. Late admission and open schooling exist, so this signal is deliberately small.

### 4.2 Family Shield

Students with identical father and mother names form a household. Mobile or address sharing inside one household is expected, so it earns no penalty and is moved to "seen but not flagged". Sharing across households stays penalized. Example: students 14 and 33 are siblings (fine); students 14 and 34 share a mobile with different parents (flagged).

### 4.3 Graph and anomaly analysis

- Dense clusters and cross-institution paths come from the component structure.
- Optional anomaly layer: isolation forest on per-institution features (applications per active student, attendance mean, amount mean). Off by default. Rules and graph carry the demo.

---

## 5. Beyond the brief: features judges will not expect

Each feature is small enough to build on top of the engine. Tiers show build priority.

### Tier A: build these

**1. Identifier Forensics.**
Aadhaar Verhoeff checksum, length checks, IFSC format, near-duplicate identifiers (one digit apart), and sequence detection (runs of consecutive account or mobile numbers across different students, a mark of generated records). The roster itself triggers it: student 37's 15-digit Aadhaar, and the consecutive accounts in rows 49 to 155. *Demo line: "It caught fabricated records before looking at a single relationship."*

**2. Seen but not flagged.**
A panel listing groups the system found and deliberately cleared, each with the reason ("siblings, same parents"). Most fraud tools only explain what they flag. This shows judgment and answers the false-positive question before it is asked.

**3. Counterfactual explanations.**
On any cluster, toggle a signal off and see the score and band recompute. "Remove the shared mobile: 87 becomes 67 and the cluster drops to Review." It shows which evidence carries the case, so an officer knows what to verify first. Pure function over the additive score; cheap.

**4. Red Team mode (live).**
A button in the demo: pick a pattern (shared bank, mobile farm, ghost institution, evasive ring), set a size, and the system injects synthetic records and re-analyzes. Judges watch a new cluster appear in the graph within seconds. The **evasive ring** uses unique banks and mobiles but a shared address and guardian; it scores lower and the UI shows which links still gave it away. This is honest about limits and proves the system was not tuned to one planted case.

**5. Fairness audit.**
Flag rate by Category (Gen, OBC, SC), by district and by institution type, with a disparate-impact ratio (lowest group rate divided by highest). An alert shows when the ratio leaves 0.8 to 1.25. Clusters are built from identifier sharing, not demographics, so a clean ratio is expected on balanced data; the panel is the proof. For a government system, showing this unprompted is memorable.

**6. Money at risk and payment hold.**
Rupees in each band, split into "not yet paid" (hold recommended) and "already paid" (recovery review). A pre-disbursement check endpoint scores a new application before payment. Headline: "Rs X held before payment." Amounts are synthetic.

### Tier B: build if time remains

**7. Cluster time-lapse.**
A slider replays application dates; nodes and edges appear as the cluster forms. A metric shows detection lead time: the date the cluster would have crossed 70 versus its first payment. Uses the 3D graph already built.

**8. Privacy vault with tamper-evident audit log.**
Analysis runs on HMAC tokens. Raw Aadhaar, account and mobile values are encrypted in a vault. Unmasking requires a typed reason, and every unmask, status change and export is an entry in an append-only log where each entry hashes the previous one. A "Verify audit chain" button recomputes the hashes and shows intact or broken. Demonstrate by editing a row and re-verifying.

**9. Auto case brief.**
One click produces a printable one-page brief: cluster summary, evidence with points, the counterfactual table, masked student list, and a field-verification checklist ("check enrollment register for S003", "compare certificate templates"). Generated from HTML to PDF (WeasyPrint).

### Stretch

- Hindi and English interface toggle.
- Benford-style check on amount digits per institution.
- Natural-language search over clusters ("clusters touching 3 or more institutions").

### Build order for the features

| Priority | Feature | Estimate |
|---|---|---|
| 1 | Identifier Forensics (1) | 2 h |
| 2 | Family Shield and Seen but not flagged (2) | 2 h |
| 3 | Counterfactuals (3) | 1.5 h |
| 4 | Money at risk (6) | 1.5 h |
| 5 | Fairness audit (5) | 2 h |
| 6 | Red Team mode (4) | 3 h |
| 7 | Time-lapse (7) | 3 h |
| 8 | Audit log and vault (8) | 3 h |
| 9 | Case brief (9) | 2 h |

Estimates assume the core engine and graph page already work. Cut from the bottom.

---

## 6. Architecture

| Layer | Responsibility | Tech |
|---|---|---|
| Data | Storage, cleaning, vault | PostgreSQL, pandas, cryptography |
| Analysis | Signals, graph, clusters, scoring | Python 3.11, NetworkX, rapidfuzz |
| API | Clusters, cases, simulation, audit | FastAPI, pydantic |
| User | Dashboard, 3D graph, case management | React, TypeScript, Vite, Tailwind, Three.js (react-three-fiber, drei), TanStack Query |

NetworkX is the graph engine. Neo4j is a post-demo upgrade for scale.

### Repository

```
sentinel/
  backend/
    app/
      main.py             routes
      db.py               connection and session
      models.py           pydantic schemas
      cleaning.py         normalization
      vault.py            HMAC tokens, encrypted raw values
      graph.py            build graph, components
      signals.py          rule functions
      forensics.py        checksum, format, sequence, near-duplicate
      family.py           household detection, Family Shield
      scoring.py          points, bands, counterfactuals
      fairness.py         group flag rates, disparate-impact ratio
      redteam.py          synthetic ring injection
      audit.py            hash-chained log and verification
      brief.py            case brief PDF
    scripts/generate_data.py
    tests/
  frontend/
    src/ (pages/, components/, scene/, lib/api.ts, fixtures/)
  data/                   students.csv, generated CSVs, ground_truth.csv
  docs/                   this file
```

### API

```
GET  /api/summary                       totals, band counts, institutions flagged, money by band
GET  /api/clusters?band=&status=        cluster list
GET  /api/clusters/{id}                 reasons[], students[], graph{nodes,edges}, cleared[]
GET  /api/clusters/{id}/counterfactual  score and band with each signal removed
GET  /api/clusters/{id}/timeline        ordered events with dates, lead time
GET  /api/clusters/{id}/brief           PDF
POST /api/clusters/{id}/action          {action, note, assignee?}
GET  /api/institutions                  per-institution flags and application ratios
GET  /api/fairness                      group rates and ratio
GET  /api/cleared                       groups seen but not flagged
POST /api/applications/check            pre-disbursement score for one application
POST /api/redteam/inject                {pattern, size}
POST /api/vault/unmask                  {token, reason}  (logged)
GET  /api/audit/verify                  chain status
```

Actions: `verify`, `assign`, `request_documents`, `escalate`, `close`. Each writes a case event and an audit entry.

Cluster detail:

```json
{
  "id": "CL-104", "score": 87, "band": "high", "status": "open",
  "counts": {"students": 4, "institutions": 3, "banks": 1, "mobiles": 1},
  "reasons": [
    {"signal": "shared_bank", "points": 25, "text": "4 students share one bank account"},
    {"signal": "shared_mobile", "points": 20, "text": "4 students share one mobile number"},
    {"signal": "cross_institution", "points": 15, "text": "Linked students attend 3 institutions"},
    {"signal": "attendance", "points": 15, "text": "Average attendance 12%"},
    {"signal": "documents", "points": 12, "text": "Income certificates share one template"}
  ],
  "cleared": [],
  "graph": {"nodes": [], "edges": []}
}
```

---

## 7. Interface and design

### 7.1 Direction

An investigator's instrument for government officers: calm, precise, physical. Matte faceted objects under soft studio light on a mineral-grey desk. Depth comes from real 3D and layered surfaces. The memorable moment is the 3D relationship graph; everything else stays quiet so it carries the demo.

### 7.2 Color

| Token | Hex | Use |
|---|---|---|
| mist | `#E6EDEF` | App background |
| paper | `#F6F9F9` | Panels, tables |
| ink | `#12262E` | Text |
| steel | `#6B8794` | Secondary text, borders |
| petrol | `#0F4C5C` | Primary actions, selection |
| harbor | `#0A2A33` | 3D stage, sidebar |
| signal | `#E0452B` | High risk only (small text uses `#B8321B`) |
| amber | `#E8A02A` | Review only |
| sea | `#2F9E8F` | Normal, resolved |

No violet, purple, indigo, fuchsia or magenta anywhere: not in shadows, focus rings, charts or 3D lighting. The Tailwind config replaces the default palette with these tokens so forbidden colors cannot be used by accident. Risk colors are semantic, never decorative.

### 7.3 Typography

Bricolage Grotesque (600 to 700, tight tracking) for headings and key numbers. Public Sans for body and UI, with tabular numerals for IDs, scores and amounts. Scale 12 / 14 / 16 / 20 / 28 / 44. Sentence case. Lines under 75 characters.

### 7.4 3D

**Cluster graph (hero).** React Three Fiber on a harbor stage with a faint floor grid, key and rim light, light fog. Node shapes by type so the graph reads without a legend: student sphere, bank account octahedron, Aadhaar slab with a notch, mobile cube, institution cylinder, address cone, document flat plate. Edges are thin tubes, thicker toward shared nodes. Shared nodes glow signal or amber and pulse slowly (the only always-on motion). Camera orbits slowly until the user drags, then stops; click focuses a node and opens details; a reset button restores the view. Labels appear on hover and for shared nodes. Cap 200 nodes, use instanced meshes, pause rendering in hidden tabs.

**Institution map (overview).** Isometric extruded bars, one per flagged institution; height equals applications relative to active students; bars above 3x turn signal; hover lifts a bar.

**Surfaces.** Three elevation levels only (flat, raised, floating). Shadows are soft, offset down, tinted with petrol. The selected cluster card tilts up to 3 degrees toward the pointer. The sidebar rail sits slightly above the page with a visible edge.

### 7.5 Layout

Left rail (harbor): Overview, Clusters, Institutions, Cases, Fairness, Audit.

- **Overview:** one wide row of headline numbers with unequal widths (applications, review, high risk, money held), the 3D institution map at about 60% width beside the top clusters list, then recent officer activity.
- **Cluster detail:** header with ID, risk meter, band, status and actions; 3D graph at about 60% width; "Why this was flagged" with points that visibly add to the score; beneath it, the counterfactual toggles and the "Seen but not flagged" list; below, masked students table and case timeline.
- **Fairness:** group bars with the ratio and alert state.
- **Audit:** log table and the Verify chain button.

### 7.6 Components

Risk meter (with the line "Score reflects unusual signals, not the chance of fraud"), why-flagged list, counterfactual toggles, status chips (Open, Assigned, Documents requested, Escalated, Closed), dense sortable tables (44 px rows, sticky header, right-aligned numbers), action dialogs with a note field, toasts that use the same verb as the button.

### 7.7 Motion

One entrance: bars in the institution map rise in sequence over 600 ms on first load. After that, motion responds to action only: dialogs, graph focus, time-lapse. `prefers-reduced-motion` disables orbit, pulse and rise-in.

### 7.8 Copy

Plain verbs: "Assign investigator", "Request documents". Never "fraudster", "guilty" or "criminal" about a student; use "linked students", "flagged cluster", "requires verification". Empty states say what to do next. Errors say what happened and the fix.

### 7.9 Craft standard (so it reads as designed, not generated)

- Real data everywhere. No placeholder text, no sample numbers that do not match the dataset.
- Hierarchy by size and weight: one dominant element per page, unequal panel widths, not a grid of identical cards.
- Specific copy that names things in this domain ("Aadhaar", "IFSC", "disbursed").
- One icon set, one stroke weight. No emoji.
- One signature motion (the rising bars) and one signature object (the 3D graph).
- Consistent spacing scale (4, 8, 12, 16, 24, 40) and consistent radii (4 and 8).
- Every state designed: loading skeletons, empty, error, no-results.
- Keyboard focus visible in petrol; AA contrast; color never the only carrier of meaning.
- Tablet layout stacks the graph above the reasons. Small screens show a static image with an "Open interactive view" action.

### 7.10 Engineering standard

Typed API client with schemas shared between backend and frontend; fixtures matching the API shapes; unit tests for every signal; end-to-end test that CL-104 scores 87; lint and format in CI; no unreviewed dependencies.

---

## 8. Security and privacy

- Analysis uses HMAC-SHA256 tokens. The key is stored outside the database.
- Raw identifiers are encrypted at rest and shown masked (account last 4, mobile `98••••0003`, Aadhaar last 4).
- Unmasking needs a role and a typed reason, and is written to the audit chain.
- Role model: Viewer (masked), Investigator (can unmask with reason), Supervisor (can escalate and close).
- Aadhaar handling is regulated (Aadhaar Act, DPDP Act). A real deployment needs legal review; the demo uses synthetic or consented sample data and states so on screen.

---

## 9. Evaluation

Run against `ground_truth.csv` and the roster expectations.

| Check | Target |
|---|---|
| Planted clusters found | 12 of 12 |
| CL-104 score | 87 |
| Roster group A / group B | 72 High / 67 Review |
| Student 37 flagged for invalid Aadhaar | Yes |
| Decoy sibling groups | None above 39 |
| Evasive red-team ring | Detected, lower score, reasons shown |
| Fairness ratio on generated data | Between 0.8 and 1.25 |
| Audit chain after tampering one row | Reports broken |
| Total applications | 10,000 |
| Name-noise merge rate | At least 95% |
| Generator rerun | Identical output |
| Analysis runtime on 10,000 applications | A few seconds on a laptop (measure and report the actual figure) |

Report precision and recall on the synthetic data and say plainly that real-world performance is unknown until tested on real records.

---

## 10. Two-day build plan

**Day 1: engine**
1. `generate_data.py` (option A from 2.3) and PostgreSQL load.
2. Cleaning, vault, tokens.
3. Graph, components, degree cap.
4. Signals, Family Shield, scoring, counterfactual function, tests for CL-104 and roster groups.
5. Forensics checks.
6. API endpoints: summary, clusters, detail, action.

**Day 2: product**
1. Design system and shell.
2. Overview and clusters list.
3. Cluster detail with the 3D graph, why-flagged, counterfactual toggles, seen-but-not-flagged.
4. Officer actions and cases.
5. Money at risk and fairness pages.
6. Red Team button.
7. Rehearsal, recorded fallback video.
8. If time remains: time-lapse, audit chain, case brief.

Non-negotiable: the 3D graph, the why-flagged panel, Identifier Forensics, and the Red Team button. If anything must be cut, cut Tier B.

---

## 11. Demo script (about 3 minutes)

1. **Overview (20 s).** 10,000 applications analyzed. Most are normal. Rs held before payment shown.
2. **Forensics (20 s).** Open the roster school; show student 37's 15-digit Aadhaar and the consecutive-accounts finding.
3. **CL-104 (50 s).** Open the cluster. In the 3D graph four students converge on one bank account and one mobile across three institutions. Read the why-flagged list; the points add to 87.
4. **Counterfactual (20 s).** Toggle off the shared mobile: 87 becomes 67. "This tells the officer which evidence to verify first."
5. **Seen but not flagged (15 s).** Siblings 14 and 33 were cleared; 14 and 34 were flagged. "It does not accuse families."
6. **Red Team (40 s).** Inject a ring live; it appears and is scored. Inject the evasive ring; point out the lower score and the links that exposed it.
7. **Fairness (10 s).** Rates by category are in range.
8. **Officer action (15 s).** Assign investigator, request documents.
9. **Close.** "The system flags patterns. The officer decides."

Backup: a recorded run of the same flow, and exported screenshots of CL-104.

---

## 12. Judge Q&A

**Is this just rules?** Rules produce signals, the graph produces clusters, and the score combines them. Rules are used on purpose: every flag must be explainable to an officer and defensible in an appeal. An anomaly model is optional and off by default.

**What about false positives?** Family Shield, a degree cap on common values, the Review band between normal and high, and the "Seen but not flagged" panel. Decoy groups are in the test data.

**Why not machine learning?** There are no trusted fraud labels in government scholarship data, and unexplained scores cannot trigger payment holds. We chose explainability first and keep ML as a ranking aid.

**What if fraudsters adapt?** Red Team mode shows it. An evasive ring that avoids shared banks and mobiles still shares addresses, guardians or document templates; it scores lower and we show which links caught it. Weights are configurable.

**Is it biased?** Clusters come from identifier sharing, not demographics. The Fairness page checks flag rates by category and district on every run.

**How does it handle privacy?** Pseudonymized analysis, masked display, logged unmasking, and a tamper-evident audit chain.

**Does it scale to crores of records?** Component finding is linear in nodes and edges. At scale, add blocking keys, move to Neo4j or igraph, and run incrementally on new applications through the pre-disbursement check. Not proven beyond the demo size.

**Who makes the final decision?** The officer. The system never approves or rejects an application.

**Is the data real?** The demo is synthetic or sample data and is labeled that way in the interface.

---

## 13. Limits to state openly

- Demo data is synthetic; thresholds need tuning on real records.
- Age-for-grade and Admission_No signals can be explained innocently; their weights are small.
- A flag is a lead, not evidence.
- Identifier checksums confirm format, not truth: a valid Aadhaar number can still belong to someone else.
- Real deployment needs data-sharing agreements, legal review and security audit.
