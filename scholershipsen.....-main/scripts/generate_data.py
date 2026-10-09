import json
import random
import os
import pandas as pd

random.seed(42)

def generate_sentinel_data():
    print("Generating Sentinel dataset based on DEMO_DATA.md & PROJECT.md...")

    # 1. Institutions (60 institutions)
    institutions = [
        {"id": "INST-012", "name": "North Valley Technical Institute", "state": "Punjab", "district": "Jalandhar", "type": "Polytechnic", "registered": 420, "active": 390, "applications": 412, "surge_ratio": 1.05},
        {"id": "INST-024", "name": "Apex Institute of Vocational Studies", "state": "Haryana", "district": "Rohtak", "type": "Private Institute", "registered": 28, "active": 14, "applications": 62, "surge_ratio": 4.43}, # Surge > 3x!
        {"id": "INST-031", "name": "Pragathi Engineering College", "state": "Telangana", "district": "Hyderabad", "type": "Engineering", "registered": 850, "active": 810, "applications": 830, "surge_ratio": 1.02},
        {"id": "INST-047", "name": "Sunrise Institute of Technology", "state": "Maharashtra", "district": "Pune", "type": "Polytechnic", "registered": 620, "active": 580, "applications": 605, "surge_ratio": 1.04},
        {"id": "INST-005", "name": "Modern Vocational Training Center", "state": "Rajasthan", "district": "Jaipur", "type": "Vocational", "registered": 45, "active": 18, "applications": 59, "surge_ratio": 3.28}, # Surge > 3x!
        {"id": "INST-018", "name": "Shri Ram Degree College", "state": "Uttar Pradesh", "district": "Lucknow", "type": "Degree College", "registered": 980, "active": 920, "applications": 950, "surge_ratio": 1.03},
        {"id": "INST-029", "name": "National Rural Polytechnic", "state": "Bihar", "district": "Patna", "type": "Polytechnic", "registered": 34, "active": 12, "applications": 48, "surge_ratio": 4.00}, # Surge > 3x!
        {"id": "INST-033", "name": "St. Xavier Institute of Sciences", "state": "Goa", "district": "North Goa", "type": "Science", "registered": 520, "active": 500, "applications": 510, "surge_ratio": 1.02},
        {"id": "INST-042", "name": "Vidya Bharti Memorial College", "state": "Madhya Pradesh", "district": "Bhopal", "type": "Degree College", "registered": 410, "active": 390, "applications": 405, "surge_ratio": 1.04},
        {"id": "INST-055", "name": "Global Academy of Higher Learning", "state": "Karnataka", "district": "Bengaluru", "type": "Engineering", "registered": 1200, "active": 1150, "applications": 1180, "surge_ratio": 1.03},
    ]

    states = ["Maharashtra", "Tamil Nadu", "Gujarat", "Kerala", "West Bengal", "Odisha", "Assam", "Jharkhand", "Himachal Pradesh", "Uttarakhand"]
    districts = ["Central", "North", "South", "East", "West", "Suburban", "Metro", "Valley", "Uplands", "Coastal"]
    types = ["Engineering", "Degree College", "Polytechnic", "Vocational", "Medical Sciences"]

    for i in range(11, 61):
        inst_id = f"INST-{i:03d}"
        active = random.randint(180, 850)
        registered = int(active * random.uniform(1.05, 1.2))
        is_surge = (i in [15, 38, 52])
        if is_surge:
            apps = int(active * random.uniform(3.1, 4.2))
            surge = round(apps / active, 2)
        else:
            apps = int(active * random.uniform(0.85, 1.08))
            surge = round(apps / active, 2)
            
        institutions.append({
            "id": inst_id,
            "name": f"Government College of Excellence {i:02d}",
            "state": states[i % len(states)],
            "district": districts[i % len(districts)],
            "type": types[i % len(types)],
            "registered": registered,
            "active": active,
            "applications": apps,
            "surge_ratio": surge
        })

    # 2. Planted High-Risk Clusters (12 clusters, 240 applications)
    # HERO CLUSTER: CL-104 (Target score: 87)
    cl_104 = {
        "id": "CL-104",
        "title": "Cross-Institution Shared Bank & Mobile Ring",
        "pattern": "Shared bank and mobile ring across 3 independent institutions with attendance anomaly",
        "score": 87,
        "band": "high",
        "status": "open",
        "is_hero": True,
        "created_at": "2026-03-28 09:15:00",
        "counts": {
            "students": 4,
            "institutions": 3,
            "banks": 1,
            "mobiles": 1,
            "addresses": 4,
            "documents": 1
        },
        "reasons": [
            {"signal": "shared_bank", "label": "Shared bank account", "points": 25, "text": "4 students across 3 institutions route disbursements to single account BA103"},
            {"signal": "shared_mobile", "label": "Shared contact number", "points": 20, "text": "4 unrelated student applications registered with identical mobile 98710003"},
            {"signal": "cross_institution", "label": "Cross-institution link", "points": 15, "text": "Linked students attend 3 separate geographical institutions (Inst 12, Inst 31, Inst 47)"},
            {"signal": "attendance", "label": "Attendance anomaly", "points": 15, "text": "Cluster mean attendance is 11.8% (critically below 30% verification threshold)"},
            {"signal": "documents", "label": "Document similarity", "points": 12, "text": "Income certificates share identical layout geometry and template hash TPL-INC-991"}
        ],
        "students": [
            {
                "id": "S003",
                "name": "Aarav Sharma",
                "institution": "North Valley Technical Institute",
                "institution_id": "INST-012",
                "course": "Diploma in Mechanical Engg",
                "year": "2nd Year",
                "attendance": 8,
                "bank_masked": "••••BA103",
                "mobile_masked": "98••••0003",
                "address": "42 Canal View Rd, Jalandhar",
                "amount": 22000,
                "scheme": "Post-Matric Scholarship",
                "doc_hash": "TPL-INC-991",
                "status": "Flagged"
            },
            {
                "id": "S006",
                "name": "Pooja V. Reddy",
                "institution": "Pragathi Engineering College",
                "institution_id": "INST-031",
                "course": "B.Tech Computer Science",
                "year": "3rd Year",
                "attendance": 12,
                "bank_masked": "••••BA103",
                "mobile_masked": "98••••0003",
                "address": "18 Banjara Hills, Hyderabad",
                "amount": 28000,
                "scheme": "Merit Scholarship",
                "doc_hash": "TPL-INC-991",
                "status": "Flagged"
            },
            {
                "id": "S007",
                "name": "Karthik Naidu",
                "institution": "Pragathi Engineering College",
                "institution_id": "INST-031",
                "course": "B.Tech Electronics & Comm",
                "year": "1st Year",
                "attendance": 16,
                "bank_masked": "••••BA103",
                "mobile_masked": "98••••0003",
                "address": "77 Ring Road, Secunderabad",
                "amount": 24000,
                "scheme": "Minority Welfare",
                "doc_hash": "TPL-INC-991",
                "status": "Flagged"
            },
            {
                "id": "S008",
                "name": "Tanvi R. Deshmukh",
                "institution": "Sunrise Institute of Technology",
                "institution_id": "INST-047",
                "course": "Diploma in Civil Engg",
                "year": "2nd Year",
                "attendance": 11,
                "bank_masked": "••••BA103",
                "mobile_masked": "98••••0003",
                "address": "104 Model Colony, Pune",
                "amount": 19000,
                "scheme": "Girl Child Assistance",
                "doc_hash": "TPL-INC-991",
                "status": "Flagged"
            }
        ],
        "timeline": [
            {"time": "2026-03-28 09:15:00", "officer": "Sentinel Intelligence", "action": "Cluster Detected", "note": "High-risk convergence detected across Bank BA103 and Mobile 98710003."},
            {"time": "2026-03-28 11:30:10", "officer": "Rajesh V. (Zonal Insp)", "action": "Case Opened", "note": "Assigned priority review. Notice sent to nodal verification desks."}
        ],
        "graph": {
            "nodes": [
                {"id": "S003", "label": "Aarav Sharma", "type": "student", "risk": "flagged", "details": "North Valley Tech (Att: 8%)"},
                {"id": "S006", "label": "Pooja V. Reddy", "type": "student", "risk": "flagged", "details": "Pragathi Engg (Att: 12%)"},
                {"id": "S007", "label": "Karthik Naidu", "type": "student", "risk": "flagged", "details": "Pragathi Engg (Att: 16%)"},
                {"id": "S008", "label": "Tanvi R. Deshmukh", "type": "student", "risk": "flagged", "details": "Sunrise Tech (Att: 11%)"},
                
                {"id": "BANK-BA103", "label": "Account ••••BA103", "type": "bank", "risk": "high", "is_shared": True, "details": "Account linked to 4 separate applications"},
                {"id": "MOB-98710003", "label": "Mobile 98••••0003", "type": "mobile", "risk": "high", "is_shared": True, "details": "Shared primary authentication contact"},
                {"id": "DOC-991", "label": "Template Hash #991", "type": "document", "risk": "high", "is_shared": True, "details": "Income Cert Certificate Template reused"},
                
                {"id": "INST-012", "label": "North Valley Tech", "type": "institution", "risk": "normal", "details": "Jalandhar, Punjab"},
                {"id": "INST-031", "label": "Pragathi Engg", "type": "institution", "risk": "normal", "details": "Hyderabad, Telangana"},
                {"id": "INST-047", "label": "Sunrise Tech", "type": "institution", "risk": "normal", "details": "Pune, Maharashtra"},
                
                {"id": "ADDR-1", "label": "Canal View Rd", "type": "address", "risk": "normal", "details": "Jalandhar"},
                {"id": "ADDR-2", "label": "Banjara Hills", "type": "address", "risk": "normal", "details": "Hyderabad"},
                {"id": "ADDR-3", "label": "Ring Road", "type": "address", "risk": "normal", "details": "Secunderabad"},
                {"id": "ADDR-4", "label": "Model Colony", "type": "address", "risk": "normal", "details": "Pune"}
            ],
            "edges": [
                # Students to shared Bank
                {"source": "S003", "target": "BANK-BA103", "label": "PAID_TO", "flagged": True},
                {"source": "S006", "target": "BANK-BA103", "label": "PAID_TO", "flagged": True},
                {"source": "S007", "target": "BANK-BA103", "label": "PAID_TO", "flagged": True},
                {"source": "S008", "target": "BANK-BA103", "label": "PAID_TO", "flagged": True},

                # Students to shared Mobile
                {"source": "S003", "target": "MOB-98710003", "label": "USES_MOBILE", "flagged": True},
                {"source": "S006", "target": "MOB-98710003", "label": "USES_MOBILE", "flagged": True},
                {"source": "S007", "target": "MOB-98710003", "label": "USES_MOBILE", "flagged": True},
                {"source": "S008", "target": "MOB-98710003", "label": "USES_MOBILE", "flagged": True},

                # Students to shared Document
                {"source": "S003", "target": "DOC-991", "label": "HAS_DOCUMENT", "flagged": True},
                {"source": "S006", "target": "DOC-991", "label": "HAS_DOCUMENT", "flagged": True},
                {"source": "S007", "target": "DOC-991", "label": "HAS_DOCUMENT", "flagged": True},
                {"source": "S008", "target": "DOC-991", "label": "HAS_DOCUMENT", "flagged": True},

                # Students to Institutions
                {"source": "S003", "target": "INST-012", "label": "ENROLLED_AT", "flagged": False},
                {"source": "S006", "target": "INST-031", "label": "ENROLLED_AT", "flagged": False},
                {"source": "S007", "target": "INST-031", "label": "ENROLLED_AT", "flagged": False},
                {"source": "S008", "target": "INST-047", "label": "ENROLLED_AT", "flagged": False},

                # Addresses
                {"source": "S003", "target": "ADDR-1", "label": "LIVES_AT", "flagged": False},
                {"source": "S006", "target": "ADDR-2", "label": "LIVES_AT", "flagged": False},
                {"source": "S007", "target": "ADDR-3", "label": "LIVES_AT", "flagged": False},
                {"source": "S008", "target": "ADDR-4", "label": "LIVES_AT", "flagged": False}
            ]
        }
    }

    clusters = [cl_104]

    other_clusters_specs = [
        ("CL-107", "Ghost Institution Surge", "One institution with 14 active students but 62 scholarship applications (4.4x surge)", 62, 1, 82, "INST-024", [
            {"signal": "application_surge", "label": "Application surge", "points": 15, "text": "Applications 4.43x greater than active students at Apex Institute (INST-024)"},
            {"signal": "attendance", "label": "Attendance anomaly", "points": 15, "text": "Average classroom attendance registered at 14.2%"},
            {"signal": "shared_address", "label": "Shared address cluster", "points": 10, "text": "28 applications originate from same hostel pin without registration"},
            {"signal": "shared_bank", "label": "Shared disbursement hub", "points": 25, "text": "Sub-groups share batch accounts BA204 and BA209"},
            {"signal": "document_similarity", "label": "Bulk verification seal", "points": 12, "text": "Same digital stamp hash applied to 58 certificates"}
        ]),
        ("CL-111", "Mobile Farm Network", "One primary contact number registered across 18 students at 5 institutions", 18, 5, 75, "INST-031", [
            {"signal": "shared_mobile", "label": "High-degree shared mobile", "points": 20, "text": "18 students across 5 independent colleges share contact 98710011"},
            {"signal": "cross_institution", "label": "Cross-institution dispersion", "points": 15, "text": "Cluster spans 5 state institutions"},
            {"signal": "shared_bank", "label": "Co-occurring account linkages", "points": 25, "text": "3 separate accounts receiving multiple disbursements"},
            {"signal": "attendance", "label": "Borderline attendance", "points": 15, "text": "Mean attendance across cohort is 26.4%"}
        ]),
        ("CL-115", "Consolidated Bank Hub", "One bank account receiving 9 payments across 4 institutions", 9, 4, 75, "INST-012", [
            {"signal": "shared_bank", "label": "Shared bank account", "points": 25, "text": "Single account BA115 registered across 9 distinct students"},
            {"signal": "cross_institution", "label": "Cross-institution distribution", "points": 15, "text": "Spans 4 separate universities in northern zone"},
            {"signal": "shared_mobile", "label": "Shared contact cluster", "points": 20, "text": "Pairs share alternate guardian numbers"},
            {"signal": "attendance", "label": "Attendance deficit", "points": 15, "text": "Mean verified attendance 22.1%"}
        ]),
        ("CL-118", "Duplicate Identity Ring", "Name variants, identical guardian and DOB with multi-scheme filings", 31, 2, 72, "INST-005", [
            {"signal": "document_similarity", "label": "Identity document duplication", "points": 12, "text": "Exact matching guardian ID and DOB with slight spelling variations"},
            {"signal": "shared_bank", "label": "Shared bank accounts", "points": 25, "text": "Disbursements funnel into 4 recurring bank accounts"},
            {"signal": "shared_mobile", "label": "Shared contact gateway", "points": 20, "text": "Common family contact phone registered across 31 records"},
            {"signal": "cross_institution", "label": "Multi-institution enrollment", "points": 15, "text": "Concurrent applications filed in 2 separate districts"}
        ]),
        ("CL-122", "Zero-Attendance Cohort", "Paid applicants with 0% to 5% attendance at one vocational center", 14, 1, 70, "INST-029", [
            {"signal": "attendance", "label": "Severe attendance anomaly", "points": 15, "text": "Cohort mean attendance is 2.8% over two consecutive semesters"},
            {"signal": "application_surge", "label": "Surge ratio exceeded", "points": 15, "text": "National Rural Polytechnic applications 4.0x active student baseline"},
            {"signal": "shared_bank", "label": "Shared bank cluster", "points": 25, "text": "Multiple payments routed to centralized institutional manager account"},
            {"signal": "cross_institution", "label": "Cross-district claims", "points": 15, "text": "Disbursement requested from remote sub-centers"}
        ]),
        ("CL-126", "Document Template Reuse Network", "Income certificate template hash duplicated across 22 unrelated candidates", 22, 3, 74, "INST-047", [
            {"signal": "documents", "label": "Template metadata hash match", "points": 12, "text": "Identical issuing officer signature hash TPL-INC-404 across 22 applications"},
            {"signal": "shared_bank", "label": "Shared bank account", "points": 25, "text": "Cluster aggregates into 3 primary bank accounts"},
            {"signal": "cross_institution", "label": "Cross-institution span", "points": 15, "text": "Claims filed across 3 colleges in western district"},
            {"signal": "shared_mobile", "label": "Shared mobile cluster", "points": 20, "text": "Applications registered from common service kiosk mobile"}
        ]),
        ("CL-131", "Sudden Application Spike", "16 applications generated within a 72-hour window from single IP/kiosk", 16, 1, 70, "INST-018", [
            {"signal": "application_surge", "label": "Rapid surge anomaly", "points": 15, "text": "16 applications logged within 72 hours from single operator endpoint"},
            {"signal": "shared_bank", "label": "Shared disbursement accounts", "points": 25, "text": "Cluster routes funds to shared cooperative bank ledger"},
            {"signal": "documents", "label": "Document similarity", "points": 12, "text": "Consecutively numbered income affidavits with same date stamp"},
            {"signal": "attendance", "label": "Below threshold attendance", "points": 15, "text": "Registered students exhibit 18.5% average attendance"}
        ]),
        ("CL-135", "Address Stacking Cluster", "12 unrelated students registered to single 1-room address", 12, 2, 75, "INST-012", [
            {"signal": "shared_address", "label": "Shared address (non-family)", "points": 10, "text": "12 non-related candidates claim same 120 sq ft residential address"},
            {"signal": "shared_bank", "label": "Shared bank account", "points": 25, "text": "Payments routed into 2 shared branch accounts"},
            {"signal": "shared_mobile", "label": "Shared contact number", "points": 20, "text": "Single agent contact used for OTP authentication"},
            {"signal": "cross_institution", "label": "Cross-institution link", "points": 15, "text": "Students enrolled across 2 distinct vocational institutes"}
        ]),
        ("CL-140", "Disbursement & Certificate Syndicate", "Shared accounts coupled with duplicated category certificates", 20, 2, 82, "INST-042", [
            {"signal": "shared_bank", "label": "Shared bank account", "points": 25, "text": "20 applications funnel through 2 centralized merchant accounts"},
            {"signal": "shared_mobile", "label": "Shared contact ring", "points": 20, "text": "Linked applications authenticate with same mobile pair"},
            {"signal": "cross_institution", "label": "Cross-institution link", "points": 15, "text": "Applicants enrolled in 2 regional colleges"},
            {"signal": "documents", "label": "Duplicate certificate seal", "points": 12, "text": "Caste validity certificates possess identical digital seal watermark"}
        ]),
        ("CL-144", "Guardian Hub Aggregation", "Single guardian ID claimed by 17 students across 4 institutions", 17, 4, 72, "INST-055", [
            {"signal": "shared_mobile", "label": "Shared guardian contact", "points": 20, "text": "Same guardian phone and name claimed by 17 non-sibling students"},
            {"signal": "cross_institution", "label": "Cross-institution spread", "points": 15, "text": "Students belong to 4 independent degree faculties"},
            {"signal": "shared_bank", "label": "Shared account links", "points": 25, "text": "Direct payment routed to guardian account"},
            {"signal": "documents", "label": "Document verification alert", "points": 12, "text": "Income proofs share identical sanction numbers"}
        ]),
        ("CL-149", "Tri-Institution Intercept Ring", "Shared account across 3 institutions with critical attendance deficit", 15, 3, 79, "INST-033", [
            {"signal": "shared_bank", "label": "Shared bank account", "points": 25, "text": "Cluster routes 15 student disbursements through one centralized account"},
            {"signal": "shared_mobile", "label": "Shared mobile number", "points": 20, "text": "Shared contact number registered across all filings"},
            {"signal": "cross_institution", "label": "Cross-institution presence", "points": 15, "text": "Spans 3 independent institutes across state border"},
            {"signal": "attendance", "label": "Attendance anomaly", "points": 15, "text": "Cluster average attendance stands at 9.4%"}
        ]),
    ]

    statuses = ["open", "assigned", "documents_requested", "open", "assigned"]

    for cid, ctitle, cpattern, num_apps, num_inst, cscore, primary_inst, creasons in other_clusters_specs:
        stud_list = []
        cnodes = []
        cedges = []
        bank_id = f"BANK-BA{cid.replace('CL-', '')}"
        mob_id = f"MOB-9871{cid.replace('CL-', '')}"
        
        cnodes.append({"id": bank_id, "label": f"Account ••••BA{cid.replace('CL-', '')}", "type": "bank", "risk": "high", "is_shared": True, "details": "Shared disbursement destination"})
        cnodes.append({"id": mob_id, "label": f"Mobile 98••••{cid.replace('CL-', '')}", "type": "mobile", "risk": "amber", "is_shared": True, "details": "Shared verification contact"})
        
        sample_names = ["Rohan Verma", "Sneha Kulkarni", "Vikram Rathore", "Priya Nair", "Deepak Joshi", "Ananya Sen", "Manish Tiwari", "Kavita Rao", "Sameer Qureshi", "Pooja Bisht", "Gaurav Malhotra", "Simran Kaur", "Arjun Das", "Neha Pathak"]
        
        for s_idx in range(min(num_apps, 8)):
            sid = f"S{cid.replace('CL-', '')}{s_idx+1:02d}"
            sname = sample_names[s_idx % len(sample_names)] if s_idx < len(sample_names) else f"Applicant {s_idx+1}"
            att = random.randint(6, 28)
            stud_list.append({
                "id": sid,
                "name": sname,
                "institution": f"Inst {primary_inst}",
                "institution_id": primary_inst,
                "course": "Vocational / Technical",
                "year": f"{(s_idx%3)+1}st Year",
                "attendance": att,
                "bank_masked": f"••••BA{cid.replace('CL-', '')}",
                "mobile_masked": f"98••••{cid.replace('CL-', '')}",
                "address": f"District Zone {s_idx+1}",
                "amount": random.randint(14000, 26000),
                "scheme": "Post-Matric Technical",
                "doc_hash": f"TPL-{cid}",
                "status": "Flagged"
            })
            cnodes.append({"id": sid, "label": sname, "type": "student", "risk": "flagged", "details": f"Attendance: {att}%"})
            cedges.append({"source": sid, "target": bank_id, "label": "PAID_TO", "flagged": True})
            cedges.append({"source": sid, "target": mob_id, "label": "USES_MOBILE", "flagged": True})
        
        clusters.append({
            "id": cid,
            "title": ctitle,
            "pattern": cpattern,
            "score": cscore,
            "band": "high",
            "status": statuses[len(clusters) % len(statuses)],
            "is_hero": False,
            "created_at": f"2026-03-{random.randint(18, 29):02d} 10:{random.randint(10, 50):02d}:00",
            "counts": {
                "students": num_apps,
                "institutions": num_inst,
                "banks": 1 if "bank" in ctitle.lower() or "disbursement" in ctitle.lower() else 2,
                "mobiles": 1 if "mobile" in ctitle.lower() or "contact" in ctitle.lower() else 2,
                "addresses": max(1, num_apps // 2),
                "documents": 1
            },
            "reasons": creasons,
            "students": stud_list,
            "timeline": [
                {"time": "2026-03-24 14:20:00", "officer": "Sentinel Rules Engine", "action": "Cluster Detected", "note": f"Automatic anomaly trigger: {cpattern}"}
            ],
            "graph": {
                "nodes": cnodes,
                "edges": cedges
            }
        })

    # 3. Add Decoys (Review Required: 40 - 69 score)
    # Siblings, shared parent phone, moderate low attendance
    decoys_specs = [
        ("CL-DEC-01", "Family Sibling Pair (Decoy)", "Two siblings sharing registered residential address and father mobile number", 2, 1, 35, "normal", [
            {"signal": "shared_address", "label": "Shared address (family)", "points": 10, "text": "Same guardian name and home address registered"},
            {"signal": "shared_mobile", "label": "Shared guardian contact", "points": 20, "text": "Two siblings use parent mobile number"}
        ]),
        ("CL-DEC-02", "Parent Contact Shared (Review)", "Two students at same college sharing guardian mobile number", 2, 1, 45, "review", [
            {"signal": "shared_mobile", "label": "Shared mobile contact", "points": 20, "text": "2 students at same college share guardian phone"},
            {"signal": "attendance", "label": "Moderate attendance", "points": 15, "text": "Mean attendance is 32% (just below baseline)"},
            {"signal": "shared_address", "label": "Same pin code", "points": 10, "text": "Rural pin code shared"}
        ]),
        ("CL-DEC-03", "Low Attendance Verification", "Sub-group with low attendance but verified individual accounts", 3, 1, 45, "review", [
            {"signal": "attendance", "label": "Attendance review required", "points": 15, "text": "Three candidates exhibit 34% attendance during agricultural harvest period"},
            {"signal": "shared_address", "label": "Shared village cluster", "points": 10, "text": "Common village hamlet registered"},
            {"signal": "cross_institution", "label": "Separate branches", "points": 15, "text": "Enrolled in morning vs evening batch"}
        ]),
        ("CL-DEC-04", "Common Rural Kiosk Mobile", "Three applications registered through common village CSC center", 3, 2, 55, "review", [
            {"signal": "shared_mobile", "label": "Kiosk mobile registration", "points": 20, "text": "Common Common-Service-Center operator number used"},
            {"signal": "cross_institution", "label": "Cross-institution link", "points": 15, "text": "Applicants study at adjacent rural polytechnics"},
            {"signal": "attendance", "label": "Moderate attendance", "points": 15, "text": "Average attendance 38%"}
        ]),
    ]

    for did, dtitle, dpattern, dapps, dinst, dscore, dband, dreasons in decoys_specs:
        clusters.append({
            "id": did,
            "title": dtitle,
            "pattern": dpattern,
            "score": dscore,
            "band": dband,
            "status": "closed" if dband == "normal" else "open",
            "is_hero": False,
            "created_at": "2026-03-27 16:45:00",
            "counts": {"students": dapps, "institutions": dinst, "banks": dapps, "mobiles": 1, "addresses": 1, "documents": dapps},
            "reasons": dreasons,
            "students": [
                {
                    "id": f"S-DEC-{i+1}",
                    "name": f"Candidate {i+1}",
                    "institution": "North Valley Technical Institute",
                    "institution_id": "INST-012",
                    "course": "General Science",
                    "year": "1st Year",
                    "attendance": 36,
                    "bank_masked": f"••••99{i+1}2",
                    "mobile_masked": "98••••4411",
                    "address": "Rural Block 4, Sector B",
                    "amount": 15000,
                    "scheme": "Post-Matric",
                    "doc_hash": f"TPL-DEC-{i}",
                    "status": "Verified" if dband == "normal" else "Review"
                } for i in range(dapps)
            ],
            "timeline": [
                {"time": "2026-03-27 16:45:00", "officer": "Sentinel Rules Engine", "action": "Cluster Detected", "note": dpattern}
            ],
            "graph": {
                "nodes": [
                    {"id": f"S-DEC-{i+1}", "label": f"Candidate {i+1}", "type": "student", "risk": "normal", "details": "Regular student"} for i in range(dapps)
                ] + [
                    {"id": "MOB-DEC", "label": "Mobile 98••••4411", "type": "mobile", "risk": "amber", "is_shared": True, "details": "Parent contact"}
                ],
                "edges": [
                    {"source": f"S-DEC-{i+1}", "target": "MOB-DEC", "label": "USES_MOBILE", "flagged": False} for i in range(dapps)
                ]
            }
        })

    # 4. Process the user's uploaded students.csv to create Real CSV Clusters
    print("Processing local students.csv to create graph clusters...")
    csv_path = "students.csv"
    csv_clusters = []
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        # Find duplicate Aadhaar, Account, Contact
        dup_aadhaar = df[df.duplicated(subset=['Aadhaar_No'], keep=False)]
        dup_accounts = df[df.duplicated(subset=['Account_No'], keep=False)]
        dup_contacts = df[df.duplicated(subset=['Contact_No'], keep=False)]
        
        # Cluster CSV-01: Kasturi Sharma, Adrash Kumar, Kritika Sharma
        # Shared Aadhaar 593974214828 and Account 0684041000001517
        sub_c1 = df[df['Aadhaar_No'].astype(str) == '593974214828'].to_dict('records')
        if sub_c1:
            csv_clusters.append({
                "id": "CL-CSV-01",
                "title": "Aadhaar & Bank Account Duplication Ring (from students.csv)",
                "pattern": f"3 students share exact same Aadhaar 593974214828 and Bank Account 0684041000001517 across multiple classes",
                "score": 85,
                "band": "high",
                "status": "open",
                "is_hero": False,
                "created_at": "2026-10-06 14:00:00",
                "counts": {
                    "students": len(sub_c1),
                    "institutions": 1,
                    "banks": 1,
                    "mobiles": 2,
                    "addresses": 1,
                    "documents": 1
                },
                "reasons": [
                    {"signal": "shared_bank", "label": "Shared bank account", "points": 25, "text": f"{len(sub_c1)} students claim identical bank account 0684041000001517"},
                    {"signal": "shared_aadhaar", "label": "Duplicated Aadhaar ID", "points": 25, "text": "Identical Aadhaar 593974214828 registered for 3 different student profiles"},
                    {"signal": "shared_mobile", "label": "Shared contact number", "points": 20, "text": "Adrash Kumar and Kritika Sharma share contact 9697189784"},
                    {"signal": "category_mismatch", "label": "Category & Parent variance", "points": 15, "text": "Profiles list conflicting caste categories (Gen vs OBC) and conflicting parents"}
                ],
                "students": [
                    {
                        "id": f"CSV-S{r['Student_ID']}",
                        "name": r['Student_Name'],
                        "institution": f"J&K Government School (Adm #{r['Admission_No']})",
                        "institution_id": "INST-CSV-01",
                        "course": f"Class {r['Class']}",
                        "year": f"DOB: {r['DOB']}",
                        "attendance": 22,
                        "bank_masked": f"••••{str(r['Account_No'])[-4:]}",
                        "mobile_masked": f"{str(r['Contact_No'])[:2]}••••{str(r['Contact_No'])[-4:]}",
                        "address": f"Father: {r['Father_Name']}, Mother: {r['Mother_Name']}",
                        "amount": 18000,
                        "scheme": f"Category: {r['Category']}",
                        "doc_hash": f"Aadhaar ••••{str(r['Aadhaar_No'])[-4:]}",
                        "status": "Flagged"
                    } for r in sub_c1
                ],
                "timeline": [
                    {"time": "2026-10-06 14:00:00", "officer": "Sentinel CSV Engine", "action": "Cluster Detected", "note": "High-risk duplicate identity and account ring detected in uploaded students.csv"}
                ],
                "graph": {
                    "nodes": [
                        {"id": f"CSV-S{r['Student_ID']}", "label": r['Student_Name'], "type": "student", "risk": "flagged", "details": f"Class {r['Class']} | Adm #{r['Admission_No']}"} for r in sub_c1
                    ] + [
                        {"id": "CSV-ACC-1517", "label": "Account ••••1517", "type": "bank", "risk": "high", "is_shared": True, "details": "Shared Account 0684041000001517"},
                        {"id": "CSV-ADH-4828", "label": "Aadhaar ••••4828", "type": "document", "risk": "high", "is_shared": True, "details": "Shared Aadhaar 593974214828"},
                        {"id": "CSV-MOB-9784", "label": "Contact ••••9784", "type": "mobile", "risk": "amber", "is_shared": True, "details": "Shared Contact 9697189784"},
                        {"id": "CSV-MOB-8540", "label": "Contact ••••8540", "type": "mobile", "risk": "amber", "is_shared": True, "details": "Contact 9682558540"}
                    ],
                    "edges": [
                        {"source": f"CSV-S{r['Student_ID']}", "target": "CSV-ACC-1517", "label": "PAID_TO", "flagged": True} for r in sub_c1
                    ] + [
                        {"source": f"CSV-S{r['Student_ID']}", "target": "CSV-ADH-4828", "label": "HAS_DOCUMENT", "flagged": True} for r in sub_c1
                    ] + [
                        {"source": "CSV-S1", "target": "CSV-MOB-8540", "label": "USES_MOBILE", "flagged": False},
                        {"source": "CSV-S19", "target": "CSV-MOB-9784", "label": "USES_MOBILE", "flagged": True},
                        {"source": "CSV-S29", "target": "CSV-MOB-9784", "label": "USES_MOBILE", "flagged": True}
                    ]
                }
            })

        # Cluster CSV-02: Vansh & Amit Kumar (Shared Aadhaar 323008557821 and Account 0684041000002142)
        sub_c2 = df[df['Aadhaar_No'].astype(str) == '323008557821'].to_dict('records')
        if sub_c2:
            csv_clusters.append({
                "id": "CL-CSV-02",
                "title": "Duplicate Identity & Beneficiary Pair (from students.csv)",
                "pattern": "2 students share Aadhaar 323008557821 and Account 0684041000002142",
                "score": 75,
                "band": "high",
                "status": "open",
                "is_hero": False,
                "created_at": "2026-10-06 14:02:00",
                "counts": {
                    "students": len(sub_c2),
                    "institutions": 1,
                    "banks": 1,
                    "mobiles": 2,
                    "addresses": 1,
                    "documents": 1
                },
                "reasons": [
                    {"signal": "shared_bank", "label": "Shared bank account", "points": 25, "text": "Vansh and Amit Kumar share Account 0684041000002142"},
                    {"signal": "shared_aadhaar", "label": "Duplicated Aadhaar ID", "points": 25, "text": "Identical Aadhaar 323008557821 used on two separate admission files"},
                    {"signal": "attendance", "label": "Attendance verification", "points": 15, "text": "Conflicting age brackets (3rd Class vs 6th Class)"},
                    {"signal": "documents", "label": "Document anomaly", "points": 10, "text": "IFSC JAKA0KALBAR common branch routing"}
                ],
                "students": [
                    {
                        "id": f"CSV-S{r['Student_ID']}",
                        "name": r['Student_Name'],
                        "institution": f"J&K Government School (Adm #{r['Admission_No']})",
                        "institution_id": "INST-CSV-01",
                        "course": f"Class {r['Class']}",
                        "year": f"DOB: {r['DOB']}",
                        "attendance": 28,
                        "bank_masked": f"••••{str(r['Account_No'])[-4:]}",
                        "mobile_masked": f"{str(r['Contact_No'])[:2]}••••{str(r['Contact_No'])[-4:]}",
                        "address": f"Father: {r['Father_Name']}, Mother: {r['Mother_Name']}",
                        "amount": 12000,
                        "scheme": f"Category: {r['Category']}",
                        "doc_hash": f"Aadhaar ••••{str(r['Aadhaar_No'])[-4:]}",
                        "status": "Flagged"
                    } for r in sub_c2
                ],
                "timeline": [
                    {"time": "2026-10-06 14:02:00", "officer": "Sentinel CSV Engine", "action": "Cluster Detected", "note": "Duplicate Aadhaar and Account pair flagged"}
                ],
                "graph": {
                    "nodes": [
                        {"id": f"CSV-S{r['Student_ID']}", "label": r['Student_Name'], "type": "student", "risk": "flagged", "details": f"Class {r['Class']}"} for r in sub_c2
                    ] + [
                        {"id": "CSV-ACC-2142", "label": "Account ••••2142", "type": "bank", "risk": "high", "is_shared": True, "details": "Shared Account 0684041000002142"},
                        {"id": "CSV-ADH-7821", "label": "Aadhaar ••••7821", "type": "document", "risk": "high", "is_shared": True, "details": "Shared Aadhaar 323008557821"}
                    ],
                    "edges": [
                        {"source": f"CSV-S{r['Student_ID']}", "target": "CSV-ACC-2142", "label": "PAID_TO", "flagged": True} for r in sub_c2
                    ] + [
                        {"source": f"CSV-S{r['Student_ID']}", "target": "CSV-ADH-7821", "label": "HAS_DOCUMENT", "flagged": True} for r in sub_c2
                    ]
                }
            })

        # Cluster CSV-03: Shared Contact Triad (9149831704: Vikas Sharma, Sumit Kumar, Akshara)
        sub_c3 = df[df['Contact_No'].astype(str) == '9149831704'].to_dict('records')
        if sub_c3:
            csv_clusters.append({
                "id": "CL-CSV-03",
                "title": "Shared Mobile Contact Triad (from students.csv)",
                "pattern": f"3 students share contact 9149831704 across different classes and parentage",
                "score": 60,
                "band": "review",
                "status": "open",
                "is_hero": False,
                "created_at": "2026-10-06 14:05:00",
                "counts": {
                    "students": len(sub_c3),
                    "institutions": 1,
                    "banks": len(sub_c3),
                    "mobiles": 1,
                    "addresses": 1,
                    "documents": len(sub_c3)
                },
                "reasons": [
                    {"signal": "shared_mobile", "label": "Shared mobile contact", "points": 20, "text": "3 unrelated students (Vikas, Sumit, Akshara) share mobile 9149831704"},
                    {"signal": "cross_class", "label": "Multi-grade convergence", "points": 15, "text": "Spans 5th, 7th, and 8th grades"},
                    {"signal": "parent_mismatch", "label": "Distinct family heads", "points": 15, "text": "Three different father names registered (Radhay Sham, Rakesh Kumar, Sunil Kumar)"},
                    {"signal": "shared_branch", "label": "Common branch code", "points": 10, "text": "All accounts routed through IFSC JAKA0KALBAR"}
                ],
                "students": [
                    {
                        "id": f"CSV-S{r['Student_ID']}",
                        "name": r['Student_Name'],
                        "institution": f"J&K Government School (Adm #{r['Admission_No']})",
                        "institution_id": "INST-CSV-01",
                        "course": f"Class {r['Class']}",
                        "year": f"DOB: {r['DOB']}",
                        "attendance": 42,
                        "bank_masked": f"••••{str(r['Account_No'])[-4:]}",
                        "mobile_masked": f"{str(r['Contact_No'])[:2]}••••{str(r['Contact_No'])[-4:]}",
                        "address": f"Father: {r['Father_Name']}, Mother: {r['Mother_Name']}",
                        "amount": 10000,
                        "scheme": f"Category: {r['Category']}",
                        "doc_hash": f"Aadhaar ••••{str(r['Aadhaar_No'])[-4:]}",
                        "status": "Review"
                    } for r in sub_c3
                ],
                "timeline": [
                    {"time": "2026-10-06 14:05:00", "officer": "Sentinel CSV Engine", "action": "Cluster Detected", "note": "Multi-student contact sharing flagged for officer verification"}
                ],
                "graph": {
                    "nodes": [
                        {"id": f"CSV-S{r['Student_ID']}", "label": r['Student_Name'], "type": "student", "risk": "normal", "details": f"Class {r['Class']}"} for r in sub_c3
                    ] + [
                        {"id": "CSV-MOB-1704", "label": "Mobile 91••••1704", "type": "mobile", "risk": "amber", "is_shared": True, "details": "Shared Contact 9149831704"}
                    ],
                    "edges": [
                        {"source": f"CSV-S{r['Student_ID']}", "target": "CSV-MOB-1704", "label": "USES_MOBILE", "flagged": True} for r in sub_c3
                    ]
                }
            })

    # Summary
    summary = {
        "applications_analyzed": 10000,
        "students_count": 9200,
        "institutions_count": 60,
        "bands": {
            "normal": 8940,
            "review": 820,
            "high": 240
        },
        "clusters_count": {
            "total": len(clusters),
            "high_risk": sum(1 for c in clusters if c['band'] == 'high'),
            "review": sum(1 for c in clusters if c['band'] == 'review'),
            "normal": sum(1 for c in clusters if c['band'] == 'normal')
        },
        "institutions_flagged": sum(1 for i in institutions if i['surge_ratio'] > 1.2),
        "recent_activities": [
            {"time": "12 mins ago", "officer": "Vikram Sethi (Sr. Zonal Officer)", "action": "Escalated case", "cluster_id": "CL-104", "note": "Forwarded to State Anti-Corruption Bureau with graph topology evidence."},
            {"time": "45 mins ago", "officer": "Priya Sharma (Investigator)", "action": "Requested documents", "cluster_id": "CL-107", "note": "Issued summons to Principal of Apex Institute for physical register audit."},
            {"time": "2 hours ago", "officer": "Amitabh Sen (Nodal Officer)", "action": "Assigned investigator", "cluster_id": "CL-111", "note": "Field audit assigned to Rohtak District Inspectorate."},
            {"time": "4 hours ago", "officer": "Sunita Patil (Audit Lead)", "action": "Verified evidence", "cluster_id": "CL-115", "note": "Branch manager confirmed account BA115 opened with single identity."},
            {"time": "Yesterday", "officer": "System Intelligence", "action": "Cluster Detected", "cluster_id": "CL-126", "note": "High-confidence template reuse across 22 applications flagged."}
        ]
    }

    # Write files
    os.makedirs('data', exist_ok=True)
    os.makedirs('frontend/src/fixtures', exist_ok=True)

    with open('data/summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    with open('frontend/src/fixtures/summary.json', 'w') as f:
        json.dump(summary, f, indent=2)

    with open('data/institutions.json', 'w') as f:
        json.dump(institutions, f, indent=2)
    with open('frontend/src/fixtures/institutions.json', 'w') as f:
        json.dump(institutions, f, indent=2)

    with open('data/clusters.json', 'w') as f:
        json.dump(clusters, f, indent=2)
    with open('frontend/src/fixtures/clusters.json', 'w') as f:
        json.dump(clusters, f, indent=2)

    with open('data/csv_clusters.json', 'w') as f:
        json.dump(csv_clusters, f, indent=2)
    with open('frontend/src/fixtures/csv_clusters.json', 'w') as f:
        json.dump(csv_clusters, f, indent=2)

    # Also save raw students CSV as JSON for client-side table rendering
    if os.path.exists(csv_path):
        df_csv = pd.read_csv(csv_path)
        df_csv = df_csv.fillna("")
        students_raw = df_csv.to_dict('records')
        with open('data/students_raw.json', 'w') as f:
            json.dump(students_raw, f, indent=2)
        with open('frontend/src/fixtures/students_raw.json', 'w') as f:
            json.dump(students_raw, f, indent=2)

    print(f"Done! Created {len(institutions)} institutions, {len(clusters)} Sentinel clusters, and {len(csv_clusters)} CSV clusters.")
    print("CL-104 Score:", cl_104['score'])

if __name__ == "__main__":
    generate_sentinel_data()
