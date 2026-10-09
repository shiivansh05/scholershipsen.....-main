# Scholarship Sentinel

> **Detect patterns, not individuals.**  
> A graph-based scholarship intelligence system designed for government oversight officers. Surfaces explainable anomaly clusters across student records, institutions, disbursement accounts, and mobile networks without accusing individuals.

---

## 🏛️ System Overview

Scholarship Sentinel delivers an **investigator's instrument** look and feel: calm, precise, and physical, set on a clean mineral-grey desk under soft studio light. 

### Core Principles
1. **Clusters, not accusations:** The unit of output is a cluster (`CL-104`), never a student.
2. **Explainable:** Every flag lists the exact signals and points behind it (e.g., Shared Bank `+25` + Shared Mobile `+20` + Cross-Institution `+15` + Low Attendance `+15` + Document Template `+12` = **87**).
3. **Human decides:** The system recommends; an officer verifies, assigns field inspectors, requisitions documents, or escalates to the Anti-Corruption Bureau.
4. **Score is not probability:** An 87/100 score indicates the convergence of multiple unusual signals, not an 87% chance of fraud.

---

## 🎨 Design System & Visuals (`DESIGN.md` Compliant)

- **Zero Forbidden Colors:** Strictly **no** purple, violet, indigo, fuchsia, or magenta across all UI, shadows, focus rings, and 3D scenes.
- **Mineral Palette Tokens:**
  - `mist` (`#E6EDEF`): Desk background
  - `paper` (`#F6F9F9`): Elevated panels and data tables
  - `ink` (`#12262E`): Primary high-contrast typography
  - `steel` (`#6B8794`): Secondary captions and structural borders
  - `petrol` (`#0F4C5C`): Primary investigative actions, selection, links
  - `harbor` (`#0A2A33`): Dark 3D canvas stage background and physical sidebar rail
  - `signal` (`#E0452B`): High risk priority anomalies only
  - `amber` (`#E8A02A`): Review required secondary queues
  - `sea` (`#2F9E8F`): Verified, nominal volume, and resolved status
- **Typography:**
  - Headings & Display Numbers: `Bricolage Grotesque` (600/700, tight tracking)
  - UI & Body: `Public Sans` (400/500/600, tabular numerals for IDs and figures)
- **3D Hero Scenes (Three.js):**
  - **Cluster Graph (Hero `CL-104`):** Nodes morph by type (Student sphere, Bank faceted octahedron, Mobile cube, Institution cylinder, Address cone, Document slab). Shared nodes feature emissive halos and gentle pulsing motion. Auto-orbit halts on user drag; click to focus and inspect entity attributes.
  - **Institution Surge Map:** Isometric 3D bar map showing application volume vs. active capacity. Bars exceeding the 3x threshold trigger signal-red alerts.

---

## 📊 Processed Datasets

1. **National Sentinel Benchmark (10,000 Applications):**
   - 8,940 verified Normal
   - 820 Review Required
   - 240 High Risk concentrated in 12 explainable clusters
   - **Hero Cluster `CL-104`:** Cross-institution ring spanning 4 students across 3 colleges routing to single Bank Account `BA103` and Mobile `98710003` with 11.8% mean attendance (**Score: 87**).
2. **Local `students.csv` Analysis (157 Records):**
   - Analyzed live via Python NetworkX graph clustering.
   - Detected `CL-CSV-01` (Aadhaar `593974214828` & Account `0684041000001517` shared across Kasturi Sharma, Adrash Kumar, and Kritika Sharma).
   - Detected `CL-CSV-02` (Duplicate identity pair: Vansh and Amit Kumar).
   - Detected `CL-CSV-03` (Shared mobile triad: `9149831704`).

---

## 🚀 How to Run

### 1. Backend (FastAPI & NetworkX)
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/api/health`

### 2. Frontend (React 19, TypeScript, Vite, Tailwind, Three.js)
```bash
cd frontend
npm run dev
```
- Open `http://localhost:5173/` in your browser.

---

## ⏱️ 2-Minute Demo Script (Built-in Interactive Walkthrough)
1. **Overview:** View 10,000 applications analyzed; observe the 3D isometric institution surge map.
2. **Pick `CL-104`:** Open the high-risk priority queue and select Hero cluster `CL-104`.
3. **Inspect 3D Graph:** Rotate and click nodes to view 4 students converging onto single Bank `BA103` and Mobile `98710003`.
4. **Review Signal Points:** Verify the explainable breakdown (`25 + 20 + 15 + 15 + 12 = 87`).
5. **Officer Action:** Click **Assign investigator** or **Request documents** to update status and log to the audit timeline.
6. **Data Explorer:** Switch to the `Data Explorer` tab to see the live graph analysis on `students.csv`.
