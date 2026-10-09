import os
import random
import csv
import json
from faker import Faker

fake = Faker('en_IN')
Faker.seed(42)
random.seed(42)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic")
os.makedirs(OUT_DIR, exist_ok=True)

def generate_all_synthetic_data():
    print("Generating comprehensive synthetic dataset (10,000 applications) per DEMO_DATA.md...")

    # 1. Institutions (60 institutions)
    institutions = []
    inst_names = [
        "North Valley Technical Institute", "Apex Institute of Vocational Studies", "Pragathi Engineering College",
        "Sunrise Institute of Technology", "Modern Vocational Training Center", "Shri Ram Degree College",
        "National Rural Polytechnic", "St. Xavier Institute of Sciences", "Vidya Bharti Memorial College",
        "Global Academy of Higher Learning"
    ]
    states = ["Punjab", "Haryana", "Telangana", "Maharashtra", "Rajasthan", "Uttar Pradesh", "Bihar", "Goa", "Madhya Pradesh", "Karnataka"]
    districts = ["Jalandhar", "Rohtak", "Hyderabad", "Pune", "Jaipur", "Lucknow", "Patna", "North Goa", "Bhopal", "Bengaluru"]
    types = ["Polytechnic", "Private Institute", "Engineering", "Polytechnic", "Vocational", "Degree College", "Polytechnic", "Science", "Degree College", "Engineering"]

    for i in range(1, 61):
        inst_id = f"INST-{i:03d}"
        if i <= len(inst_names):
            name = inst_names[i-1]
            state = states[i-1]
            district = districts[i-1]
            itype = types[i-1]
        else:
            name = f"Government Institute of Higher Studies {i:02d}"
            state = states[i % len(states)]
            district = f"District {(i%15)+1}"
            itype = types[i % len(types)]

        active = 14 if inst_id == "INST-024" else 12 if inst_id == "INST-029" else 18 if inst_id == "INST-005" else random.randint(220, 950)
        registered = int(active * random.uniform(1.05, 1.25))

        institutions.append({
            "institution_id": inst_id,
            "name": name,
            "state": state,
            "district": district,
            "type": itype,
            "registered_students": registered,
            "active_students": active
        })

    # Save institutions.csv
    with open(os.path.join(OUT_DIR, "institutions.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=institutions[0].keys())
        writer.writeheader()
        writer.writerows(institutions)

    # 2. Planted High-Risk Clusters (240 applications across 12 clusters)
    # CL-104 Hero: 4 students
    planted_apps = []
    ground_truth = []
    
    # CL-104 (Hero): S003, S006, S007, S008
    cl_104_students = [
        {"student_id": "S003", "name": "Aarav Sharma", "inst": "INST-012", "course": "Diploma Mech Engg", "att": 8, "bank": "BA103", "mobile": "98710003", "doc": "TPL-INC-991", "amt": 22000, "scheme": "Post-Matric"},
        {"student_id": "S006", "name": "Pooja V. Reddy", "inst": "INST-031", "course": "B.Tech CSE", "att": 12, "bank": "BA103", "mobile": "98710003", "doc": "TPL-INC-991", "amt": 28000, "scheme": "Merit"},
        {"student_id": "S007", "name": "Karthik Naidu", "inst": "INST-031", "course": "B.Tech ECE", "att": 16, "bank": "BA103", "mobile": "98710003", "doc": "TPL-INC-991", "amt": 24000, "scheme": "Minority"},
        {"student_id": "S008", "name": "Tanvi R. Deshmukh", "inst": "INST-047", "course": "Diploma Civil", "att": 11, "bank": "BA103", "mobile": "98710003", "doc": "TPL-INC-991", "amt": 19000, "scheme": "Girl Child Assistance"},
    ]
    for s in cl_104_students:
        ground_truth.append({"student_id": s["student_id"], "cluster_id": "CL-104"})

    planted_clusters_spec = [
        ("CL-107", 62, "INST-024", "BA107", "98710107"),
        ("CL-111", 18, "INST-031", "BA111", "98710011"),
        ("CL-115", 9,  "INST-012", "BA115", "98710115"),
        ("CL-118", 31, "INST-005", "BA118", "98710118"),
        ("CL-122", 14, "INST-029", "BA122", "98710122"),
        ("CL-126", 22, "INST-047", "BA126", "98710126"),
        ("CL-131", 16, "INST-018", "BA131", "98710131"),
        ("CL-135", 12, "INST-012", "BA135", "98710135"),
        ("CL-140", 20, "INST-042", "BA140", "98710140"),
        ("CL-144", 17, "INST-055", "BA144", "98710144"),
        ("CL-149", 15, "INST-033", "BA149", "98710149"),
    ]

    for cid, count, primary_inst, bank_id, mob in planted_clusters_spec:
        for idx in range(count):
            sid = f"S{cid.replace('CL-', '')}{idx+1:03d}"
            ground_truth.append({"student_id": sid, "cluster_id": cid})

    # Save ground_truth.csv
    with open(os.path.join(OUT_DIR, "ground_truth.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["student_id", "cluster_id"])
        writer.writeheader()
        writer.writerows(ground_truth)

    print(f"Planted {len(ground_truth)} students in ground_truth.csv across 12 clusters.")

    # 3. Generate Complete Applications (Target: 10,000)
    # Total students: ~9,200
    # Schemes: Merit (12k-30k), Minority (8k-20k), SC/ST (10k-25k), Post-Matric (9k-22k), Girl Child (7k-15k)
    schemes = [
        ("Merit Scholarship", 12000, 30000),
        ("Minority Welfare", 8000, 20000),
        ("SC/ST Welfare Scheme", 10000, 25000),
        ("Post-Matric Technical", 9000, 22000),
        ("Girl Child Assistance", 7000, 15000)
    ]

    students = []
    applications = []
    attendance = []
    bank_accounts = []
    mobiles = []
    documents = []
    guardians = []
    addresses = []

    # Inject CL-104 Students
    for s in cl_104_students:
        students.append({
            "student_id": s["student_id"],
            "name": s["name"],
            "name_normalized": s["name"].lower().strip(),
            "institution_id": s["inst"],
            "course": s["course"],
            "year": "2nd Year",
            "dob": "2004-05-12",
            "guardian_id": f"G_{s['student_id']}",
            "address_id": f"ADDR_{s['student_id']}"
        })
        applications.append({
            "application_id": f"A{len(applications)+1:06d}",
            "student_id": s["student_id"],
            "scholarship_type": s["scheme"],
            "amount": s["amt"],
            "status": "Flagged",
            "applied_on": "2026-03-24",
            "bank_id": s["bank"],
            "mobile_id": s["mobile"]
        })
        attendance.append({
            "student_id": s["student_id"],
            "total_classes": 180,
            "present_days": int(180 * (s["att"] / 100.0)),
            "attendance_pct": s["att"]
        })
        documents.append({
            "document_id": f"DOC_{s['student_id']}",
            "student_id": s["student_id"],
            "doc_type": "Income Certificate",
            "template_hash": s["doc"],
            "issued_by": "Tehsildar Office",
            "issued_on": "2026-02-15"
        })

    # Add shared bank & mobile for CL-104
    bank_accounts.append({"bank_id": "BA103", "account_no": "0684041000001034", "ifsc": "SBIN0004128", "holder_name": "R. Sharma & Assoc"})
    mobiles.append({"mobile_id": "98710003", "number": "9871000003"})

    # Inject Remaining Planted Clusters (236 applications)
    for cid, count, primary_inst, bank_id, mob in planted_clusters_spec:
        bank_accounts.append({"bank_id": bank_id, "account_no": f"06840410000{cid.replace('CL-', '')}", "ifsc": "SBIN0005521", "holder_name": f"Manager {cid}"})
        mobiles.append({"mobile_id": mob, "number": f"98710{mob[-5:]}"})

        for idx in range(count):
            sid = f"S{cid.replace('CL-', '')}{idx+1:03d}"
            sname = fake.name()
            sch_name, min_a, max_a = random.choice(schemes)
            att_val = random.randint(4, 26)
            students.append({
                "student_id": sid,
                "name": sname,
                "name_normalized": sname.lower().strip(),
                "institution_id": primary_inst,
                "course": "Vocational Tech",
                "year": f"{(idx%3)+1}st Year",
                "dob": "2005-08-20",
                "guardian_id": f"G_{sid}",
                "address_id": f"ADDR_{sid}"
            })
            applications.append({
                "application_id": f"A{len(applications)+1:06d}",
                "student_id": sid,
                "scholarship_type": sch_name,
                "amount": random.randint(min_a, max_a),
                "status": "Flagged",
                "applied_on": "2026-03-25",
                "bank_id": bank_id,
                "mobile_id": mob
            })
            attendance.append({
                "student_id": sid,
                "total_classes": 180,
                "present_days": int(180 * (att_val / 100.0)),
                "attendance_pct": att_val
            })
            documents.append({
                "document_id": f"DOC_{sid}",
                "student_id": sid,
                "doc_type": "Income Certificate",
                "template_hash": f"TPL-{cid}",
                "issued_by": "District Magistrate Office",
                "issued_on": "2026-02-18"
            })

    print(f"Planted applications injected: {len(applications)} (Target: 240)")

    # Inject Decoys (Target: ~820 applications in Review required)
    # Sibling pairs, shared parent phone, moderate attendance (30-40%)
    for i in range(410):
        s1_id = f"S_DEC_{i*2+1:04d}"
        s2_id = f"S_DEC_{i*2+2:04d}"
        parent_mob = f"9870{i:06d}"
        mobiles.append({"mobile_id": parent_mob, "number": parent_mob})
        g_name = fake.name_male()
        guardians.append({"guardian_id": f"G_DEC_{i}", "name": g_name, "mobile": parent_mob})
        addr = f"Village {fake.city()}, Block {(i%10)+1}"
        addresses.append({"address_id": f"ADDR_DEC_{i}", "address_normalized": addr.lower(), "district": "Rural Central", "state": "Punjab"})

        # Sibling 1
        b1 = f"BA_DEC_{i*2+1}"
        bank_accounts.append({"bank_id": b1, "account_no": f"40920199{i*2+1:04d}", "ifsc": "PUNB0021940", "holder_name": "Student"})
        sch_name, min_a, max_a = random.choice(schemes)
        att_pct = random.randint(32, 42) if i < 150 else random.randint(65, 88)
        students.append({
            "student_id": s1_id,
            "name": fake.first_name() + " " + g_name.split()[-1],
            "name_normalized": "sibling",
            "institution_id": f"INST-{(i%40)+1:03d}",
            "course": "General Arts",
            "year": "1st Year",
            "dob": "2006-03-12",
            "guardian_id": f"G_DEC_{i}",
            "address_id": f"ADDR_DEC_{i}"
        })
        applications.append({
            "application_id": f"A{len(applications)+1:06d}",
            "student_id": s1_id,
            "scholarship_type": sch_name,
            "amount": random.randint(min_a, max_a),
            "status": "Review Required" if att_pct < 40 or i < 110 else "Verified",
            "applied_on": "2026-03-20",
            "bank_id": b1,
            "mobile_id": parent_mob
        })
        attendance.append({"student_id": s1_id, "total_classes": 180, "present_days": int(180 * (att_pct/100.0)), "attendance_pct": att_pct})
        documents.append({"document_id": f"DOC_{s1_id}", "student_id": s1_id, "doc_type": "Income Certificate", "template_hash": f"TPL_DEC_{i}", "issued_by": "Block Officer", "issued_on": "2026-02-10"})

        # Sibling 2
        b2 = f"BA_DEC_{i*2+2}"
        bank_accounts.append({"bank_id": b2, "account_no": f"40920199{i*2+2:04d}", "ifsc": "PUNB0021940", "holder_name": "Student"})
        students.append({
            "student_id": s2_id,
            "name": fake.first_name() + " " + g_name.split()[-1],
            "name_normalized": "sibling",
            "institution_id": f"INST-{(i%40)+1:03d}",
            "course": "Science Stream",
            "year": "2nd Year",
            "dob": "2004-11-20",
            "guardian_id": f"G_DEC_{i}",
            "address_id": f"ADDR_DEC_{i}"
        })
        applications.append({
            "application_id": f"A{len(applications)+1:06d}",
            "student_id": s2_id,
            "scholarship_type": sch_name,
            "amount": random.randint(min_a, max_a),
            "status": "Review Required" if att_pct < 40 or i < 110 else "Verified",
            "applied_on": "2026-03-21",
            "bank_id": b2,
            "mobile_id": parent_mob
        })
        attendance.append({"student_id": s2_id, "total_classes": 180, "present_days": int(180 * (att_pct/100.0)), "attendance_pct": att_pct})
        documents.append({"document_id": f"DOC_{s2_id}", "student_id": s2_id, "doc_type": "Income Certificate", "template_hash": f"TPL_DEC_{i}", "issued_by": "Block Officer", "issued_on": "2026-02-10"})

    print(f"Decoy applications added: Total now {len(applications)}.")

    # 4. Generate Normal Population to reach exactly 10,000 applications
    needed = 10000 - len(applications)
    print(f"Generating {needed} normal applications to reach exactly 10,000...")

    common_names = ["Kumar", "Singh", "Sharma", "Verma", "Patel", "Reddy", "Yadav", "Devi", "Das", "Rao", "Joshi", "Bala"]

    for idx in range(needed):
        sid = f"S{len(students)+1:05d}"
        sname = fake.name()
        # Add 3% name noise (case changes, double spaces) as required by DEMO_DATA.md
        if random.random() < 0.03:
            sname = sname.upper() if random.random() < 0.5 else sname.replace(" ", "  ")

        inst_obj = random.choice(institutions)
        sch_name, min_a, max_a = random.choice(schemes)
        
        # Normal attendance (mean 78%, std 12%, clamped 35-100)
        att_raw = int(random.gauss(78, 12))
        att_pct = max(35, min(100, att_raw))

        bank_id = f"BA{len(bank_accounts)+1000:06d}"
        mob_id = f"9820{len(mobiles):06d}"

        bank_accounts.append({"bank_id": bank_id, "account_no": f"3089041000{random.randint(100000, 999999)}", "ifsc": "SBIN0010482", "holder_name": sname})
        mobiles.append({"mobile_id": mob_id, "number": mob_id})

        students.append({
            "student_id": sid,
            "name": sname,
            "name_normalized": sname.lower().replace("  ", " ").strip(),
            "institution_id": inst_obj["institution_id"],
            "course": "Undergraduate",
            "year": f"{random.randint(1, 4)}th Year",
            "dob": f"{random.randint(2003, 2008)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            "guardian_id": f"G_{sid}",
            "address_id": f"ADDR_{sid}"
        })

        applications.append({
            "application_id": f"A{len(applications)+1:06d}",
            "student_id": sid,
            "scholarship_type": sch_name,
            "amount": random.randint(min_a, max_a),
            "status": "Verified",
            "applied_on": f"2026-03-{random.randint(10, 28):02d}",
            "bank_id": bank_id,
            "mobile_id": mob_id
        })

        attendance.append({
            "student_id": sid,
            "total_classes": 180,
            "present_days": int(180 * (att_pct / 100.0)),
            "attendance_pct": att_pct
        })

        documents.append({
            "document_id": f"DOC_{sid}",
            "student_id": sid,
            "doc_type": "Income Certificate",
            "template_hash": f"TPL_{random.randint(1000, 9999)}",
            "issued_by": "Revenue Office",
            "issued_on": "2026-01-20"
        })

    print(f"Total Applications generated: {len(applications)}")
    print(f"Total Students generated: {len(students)}")

    # Write all CSV files into data/synthetic/
    with open(os.path.join(OUT_DIR, "applications.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=applications[0].keys())
        writer.writeheader()
        writer.writerows(applications)

    with open(os.path.join(OUT_DIR, "students.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=students[0].keys())
        writer.writeheader()
        writer.writerows(students)

    with open(os.path.join(OUT_DIR, "attendance.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=attendance[0].keys())
        writer.writeheader()
        writer.writerows(attendance)

    with open(os.path.join(OUT_DIR, "bank_accounts.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=bank_accounts[0].keys())
        writer.writeheader()
        writer.writerows(bank_accounts[:len(applications)])

    with open(os.path.join(OUT_DIR, "documents.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=documents[0].keys())
        writer.writeheader()
        writer.writerows(documents)

    # Generate seed.sql to load PostgreSQL
    with open(os.path.join(OUT_DIR, "seed.sql"), "w", encoding="utf-8") as f:
        f.write("""-- Scholarship Sentinel Database Schema & Seed
CREATE TABLE institutions (
    institution_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255),
    state VARCHAR(100),
    district VARCHAR(100),
    type VARCHAR(100),
    registered_students INT,
    active_students INT
);

CREATE TABLE students (
    student_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255),
    name_normalized VARCHAR(255),
    institution_id VARCHAR(32) REFERENCES institutions(institution_id),
    course VARCHAR(100),
    year VARCHAR(50),
    dob DATE,
    guardian_id VARCHAR(32),
    address_id VARCHAR(32)
);

CREATE TABLE applications (
    application_id VARCHAR(32) PRIMARY KEY,
    student_id VARCHAR(32) REFERENCES students(student_id),
    scholarship_type VARCHAR(100),
    amount NUMERIC,
    status VARCHAR(50),
    applied_on DATE,
    bank_id VARCHAR(32),
    mobile_id VARCHAR(32)
);

CREATE TABLE attendance (
    student_id VARCHAR(32) PRIMARY KEY,
    total_classes INT,
    present_days INT,
    attendance_pct NUMERIC
);

CREATE TABLE documents (
    document_id VARCHAR(32) PRIMARY KEY,
    student_id VARCHAR(32) REFERENCES students(student_id),
    doc_type VARCHAR(100),
    template_hash VARCHAR(100),
    issued_by VARCHAR(255),
    issued_on DATE
);

-- Copy commands for loading
\\copy institutions FROM 'institutions.csv' WITH (FORMAT csv, HEADER true);
\\copy students FROM 'students.csv' WITH (FORMAT csv, HEADER true);
\\copy applications FROM 'applications.csv' WITH (FORMAT csv, HEADER true);
\\copy attendance FROM 'attendance.csv' WITH (FORMAT csv, HEADER true);
\\copy documents FROM 'documents.csv' WITH (FORMAT csv, HEADER true);
""")

    # 5. Export a curated, rich sample (800 records) into frontend fixtures so the user can browse, filter, and inspect the synthetic applications table directly in the UI!
    sample_apps = []
    # Include all 240 planted cluster apps
    for app in applications[:240]:
        st = next((s for s in students if s["student_id"] == app["student_id"]), {})
        att = next((a for a in attendance if a["student_id"] == app["student_id"]), {})
        inst = next((i for i in institutions if i["institution_id"] == st.get("institution_id")), {})
        sample_apps.append({
            "application_id": app["application_id"],
            "student_id": app["student_id"],
            "student_name": st.get("name", "Applicant"),
            "institution_name": inst.get("name", "Institute"),
            "scholarship_type": app["scholarship_type"],
            "amount": app["amount"],
            "status": app["status"],
            "risk_band": "high",
            "attendance_pct": att.get("attendance_pct", 15),
            "bank_masked": f"••••{app['bank_id'][-4:]}",
            "mobile_masked": f"98••••{app['mobile_id'][-4:]}",
            "applied_on": app["applied_on"]
        })

    # Include decoys & normal apps up to 800
    for app in applications[240:800]:
        st = next((s for s in students if s["student_id"] == app["student_id"]), {})
        att = next((a for a in attendance if a["student_id"] == app["student_id"]), {})
        inst = next((i for i in institutions if i["institution_id"] == st.get("institution_id")), {})
        band = "review" if app["status"] == "Review Required" else "normal"
        sample_apps.append({
            "application_id": app["application_id"],
            "student_id": app["student_id"],
            "student_name": st.get("name", "Applicant"),
            "institution_name": inst.get("name", "Institute"),
            "scholarship_type": app["scholarship_type"],
            "amount": app["amount"],
            "status": app["status"],
            "risk_band": band,
            "attendance_pct": att.get("attendance_pct", 78),
            "bank_masked": f"••••{app['bank_id'][-4:]}",
            "mobile_masked": f"98••••{app['mobile_id'][-4:]}",
            "applied_on": app["applied_on"]
        })

    with open(os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "fixtures", "synthetic_applications.json"), "w", encoding="utf-8") as f:
        json.dump(sample_apps, f, indent=2)

    with open(os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_applications.json"), "w", encoding="utf-8") as f:
        json.dump(sample_apps, f, indent=2)

    print(f"Generated {len(sample_apps)} browsable synthetic applications fixture for frontend.")
    print("All CSV tables and seed.sql successfully written to data/synthetic/!")

if __name__ == "__main__":
    generate_all_synthetic_data()
