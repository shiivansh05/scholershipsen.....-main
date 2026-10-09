# Demo Data Specification

Everything here is **synthetic**. No real person, bank account or number. Use a fixed seed so the demo is identical every run.

## Targets

| Item | Value |
|---|---|
| Random seed | 42 |
| Applications | 10,000 |
| Students | about 9,200 (some apply to more than one scheme) |
| Institutions | 60 |
| Scholarship types | 5 (Merit, Minority, SC/ST, Post-Matric, Girl Child) |
| Locale | Indian names and states (Faker `en_IN`) |

Expected output after analysis:

| Band | Applications |
|---|---|
| Normal | 8,940 |
| Review required | 820 |
| High risk | 240 (inside 12 clusters) |

## Tables

```
institutions(institution_id, name, state, district, type, registered_students, active_students)
students(student_id, name, name_normalized, institution_id, course, year, dob, guardian_id, address_id)
guardians(guardian_id, name, mobile)
addresses(address_id, address_normalized, district, state)
bank_accounts(bank_id, account_no, ifsc, holder_name)
mobiles(mobile_id, number)
applications(application_id, student_id, scholarship_type, amount, status, applied_on, bank_id, mobile_id)
attendance(student_id, total_classes, present_days, attendance_pct)
documents(document_id, student_id, doc_type, template_hash, issued_by, issued_on)
```

Student ID format `S00001`. Application ID `A000001`. Bank IDs `BA101` and up. Planted cluster identifiers use readable values so the demo can point at them.

## Normal population (about 8,940 applications)

- Each student has their own bank account and mobile.
- Attendance is roughly normal: mean 78%, standard deviation 12%, clamped to 35 to 100.
- Amounts by type: Merit 12,000 to 30,000; Minority 8,000 to 20,000; SC/ST 10,000 to 25,000; Post-Matric 9,000 to 22,000; Girl Child 7,000 to 15,000.
- Applications per institution follow its size, never above 1.1 times active students.
- Document template hashes are unique per issuing office, so only a few students share one by chance.
- Add name noise to 3% of records: case changes, double spaces, initials. These must still normalize to the same key.

## Decoys (about 820 applications in Review required)

These show the system is careful, not trigger-happy.

| Decoy | Count | Expected result |
|---|---|---|
| Siblings sharing address and guardian mobile | about 300 | Score under 40, not flagged |
| Two students sharing one mobile (parent number) | about 220 | Score 40 to 55, review |
| Mildly low attendance (30 to 40%) alone | about 150 | Score 40, review |
| Large institution with high but valid applications | about 150 | Score 40 to 50, review |

## Planted high-risk clusters (240 applications, 12 clusters)

| ID | Pattern | Apps | Notes |
|---|---|---|---|
| **CL-104** | Shared bank and mobile ring (hero) | 4 | 4 students, 3 institutions, bank `BA103`, mobile `98710003`, attendance 8 to 16%, shared income certificate template. Target score 87. |
| CL-107 | Ghost institution | 62 | One institution with 14 active students but 62 applications. |
| CL-111 | Mobile farm | 18 | One mobile across 18 students at 5 institutions. |
| CL-115 | Bank hub | 9 | One account receiving 9 payments across 4 institutions. |
| CL-118 | Duplicate identity | 31 | Name variants, same guardian and DOB, multiple applications. |
| CL-122 | Attendance cohort | 14 | Paid students with 0 to 5% attendance at one institution. |
| CL-126 | Document template reuse | 22 | One income certificate template across unrelated students. |
| CL-131 | Sudden spike | 16 | One institution, 16 applications within 3 days. |
| CL-135 | Address stack | 12 | 12 unrelated students at one address. |
| CL-140 | Bank plus documents | 20 | Shared account and similar documents. |
| CL-144 | Guardian hub | 17 | One guardian across 17 students at 4 institutions. |
| CL-149 | Second cross-institution ring | 15 | Shared account across 3 institutions, low attendance. |

Total: 4 + 62 + 18 + 9 + 31 + 14 + 22 + 16 + 12 + 20 + 17 + 15 = 240.

### CL-104 detail (the demo cluster)

| Student | Institution | Attendance | Bank | Mobile |
|---|---|---|---|---|
| S003 | Institution 12 | 8% | BA103 | 98710003 |
| S006 | Institution 31 | 12% | BA103 | 98710003 |
| S007 | Institution 31 | 16% | BA103 | 98710003 |
| S008 | Institution 47 | 11% | BA103 | 98710003 |

Score breakdown: shared bank 25 + shared mobile 20 + cross-institution 15 + attendance 15 + documents 12 = **87**.

Give CL-104 students plausible but different names and addresses, so the link is only visible through the graph.

## Generator behaviour (`scripts/generate_data.py`)

1. Seed `random` and Faker with 42.
2. Create institutions, then normal students and applications.
3. Inject decoys.
4. Inject the 12 planted clusters. Keep a hidden `ground_truth.csv` (`student_id`, `cluster_id`) to test detection, never shown in the UI.
5. Write CSVs to `data/` and a `seed.sql` to load PostgreSQL.
6. Print a summary: counts per band target and per cluster.

## Acceptance checks

- Detection finds all 12 planted clusters (recall 12 of 12).
- CL-104 score equals 87.
- No decoy sibling group scores above 39.
- Total applications equals 10,000.
- Name-noise records merge correctly (at least 95% match rate).
- Re-running the generator gives identical files.

## Privacy note for the demo

Mask bank accounts to the last 4 digits in the UI. Display mobile numbers partially (`98••••0003`). State on screen that the data is synthetic.
