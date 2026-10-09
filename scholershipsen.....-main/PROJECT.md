# Scholarship Sentinel

> Detect patterns, not individuals.

A graph-based scholarship intelligence system. It analyzes relationships across students, institutions, bank accounts, mobiles, addresses, documents and attendance to surface **explainable anomaly clusters** for human investigation. It never labels a person as fraudulent.

## Principles

1. **Clusters, not accusations.** The unit of output is a cluster (CL-104), never a student.
2. **Explainable.** Every flag lists the exact signals behind it.
3. **Human decides.** The system recommends; an officer verifies, escalates or closes.
4. **Score is not probability.** 87/100 means "several unusual signals together", not "87% fraud". Show this in the UI.

## Architecture

| Layer | Responsibility | Tech |
|---|---|---|
| Data | Raw records, cleaning, entity matching | PostgreSQL, pandas |
| Analysis | Rules, graph build, clustering, scoring | Python, NetworkX |
| API | Clusters, summary, case actions | FastAPI |
| User | Dashboard, 3D graph, case management | React, Tailwind, Three.js |

Flow: `Raw data → Clean → Normalize → Entity match → Graph → Rules → Clusters → Score → Dashboard → Officer`

NetworkX is the graph engine for the demo. Neo4j is a later upgrade, not needed to win the demo.

## Data processing

- Names: lowercase, trim, collapse spaces, strip honorifics. `Rahul Kumar`, `RAHUL  KUMAR`, `rahul kumar` map to one key.
- Mobile: digits only, last 10 digits.
- Address: lowercase, remove punctuation, expand common abbreviations.
- Bank account: digits only. Treat as an identifier, never display in full (mask to last 4).
- Entity matching v1: exact normalized keys. v2: fuzzy name match (rapidfuzz) plus same guardian or DOB.

## Graph model

Nodes: `Student`, `Institution`, `BankAccount`, `Mobile`, `Address`, `Guardian`, `Document`.
Edges: `ENROLLED_AT`, `PAID_TO`, `USES_MOBILE`, `LIVES_AT`, `GUARDIAN_OF`, `HAS_DOCUMENT`.

Clustering: build the graph, then find connected components over **shared-identifier nodes only** (bank, mobile, address, guardian, document hash). Components with 3 or more students become candidate clusters. Ignore Institution as a linking node, otherwise everything merges into one giant component. Institutions are attributes of a cluster, not links.

## Detection rules and scoring

| Signal | Condition | Points |
|---|---|---|
| Shared bank account | 2+ students, one account | +25 |
| Shared mobile | 2+ students, one number | +20 |
| Cross-institution link | Cluster spans 2+ institutions | +15 |
| Attendance anomaly | Cluster mean attendance below 30% | +15 |
| Document similarity | Same template or metadata hash | +12 |
| Application surge | Applications greater than 3x active students at an institution | +15 |
| Shared address (non-family) | 5+ unrelated students at one address | +10 |

Score is the sum, capped at 100.

| Band | Range | Label |
|---|---|---|
| Normal | 0 to 39 | No action |
| Review required | 40 to 69 | Queue for officer |
| High risk | 70 to 100 | Priority investigation |

Guard against false positives: siblings sharing an address and a guardian mobile must stay below 40. See `DEMO_DATA.md` for the decoys.

## API contract

```
GET  /api/summary                 -> totals, band counts, institutions flagged
GET  /api/clusters?band=high      -> list: id, score, band, counts, status
GET  /api/clusters/{id}           -> detail: reasons[], students[], graph{nodes,edges}
GET  /api/institutions            -> per-institution flag counts and application ratios
POST /api/clusters/{id}/action    -> body {action, note, assignee?}
```

Actions: `verify`, `assign`, `request_documents`, `escalate`, `close`. Each action is logged with a timestamp.

Cluster detail example:

```json
{
  "id": "CL-104",
  "score": 87,
  "band": "high",
  "status": "open",
  "counts": {"students": 4, "institutions": 3, "banks": 1, "mobiles": 1},
  "reasons": [
    {"signal": "shared_bank", "points": 25, "text": "4 students share one bank account"},
    {"signal": "shared_mobile", "points": 20, "text": "4 students share one mobile number"},
    {"signal": "cross_institution", "points": 15, "text": "Linked students attend 3 institutions"},
    {"signal": "attendance", "points": 15, "text": "Average attendance 12%"},
    {"signal": "documents", "points": 12, "text": "Income certificates share one template"}
  ],
  "graph": {"nodes": [], "edges": []}
}
```

## Suggested structure

```
sentinel/
  backend/
    app/
      main.py          # FastAPI routes
      db.py            # PostgreSQL connection
      cleaning.py      # normalization
      graph.py         # build graph, find components
      rules.py         # signals and scoring
      models.py        # pydantic schemas
    scripts/generate_data.py
  frontend/
    src/ (pages, components, three/, lib/api.ts)
  data/                # generated CSVs
  docs/                # these md files
```

## Two-day plan

**Day 1: backend**
1. Run `generate_data.py` and load into PostgreSQL.
2. Cleaning and normalization.
3. Graph build and clustering.
4. Rules and scoring, with a test that CL-104 scores 87.
5. API endpoints, tested with the generated data.

**Day 2: frontend**
1. Design system and layout (see `DESIGN.md`).
2. Overview and cluster list.
3. Cluster detail with 3D graph and "why flagged".
4. Officer actions.
5. Demo rehearsal and a recorded fallback video.

If time runs out, cut extra rules and the institutions page. Never cut the 3D graph or the "why flagged" panel.

## Demo script (2 minutes)

1. Overview: 10,000 applications analyzed, most are normal.
2. Open the high-risk list, pick CL-104.
3. Show the 3D graph: four students converge on one bank account and one mobile.
4. Read the "why flagged" list.
5. Click Assign investigator, then Request documents.
6. Close with: "The system flags patterns. The officer decides."

## Limits (say these to the judges)

- Demo data is synthetic; real deployment needs data-sharing agreements and privacy review.
- Rules need tuning on real data to control false positives.
- Every flag is a lead for investigation, not evidence.
