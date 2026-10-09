"""
Graph Construction and Network Anomaly Clustering Module for Scholarship Sentinel.
Section 3, 4, 5 of SCHOLARSHIP_SENTINEL_FINAL.md:
- Constructs multipartite entity relationship graph (NetworkX)
- Links students through shared identifier nodes (Bank, Mobile, Aadhaar, Address)
- Excludes common values via degree cap (default 25)
- Finds connected components with >= 2 students
- Applies Family Shield to discount or clear legitimate sibling households
- Integrates Identifier Forensics (Verhoeff checksum, malformed Aadhaar, sequential runs)
- Computes explainable score (0-100) and risk band
"""

import networkx as nx
import pandas as pd
import re
from typing import Dict, List, Any, Optional
from .cleaning import normalize_name, normalize_mobile, normalize_account, mask_account, mask_mobile
from .rules import evaluate_signals_comprehensive
from .family import evaluate_family_shield, find_cleared_sibling_groups
from .forensics import validate_aadhaar_format, validate_ifsc_code, detect_sequential_runs, detect_near_duplicates
from .vault import generate_hmac_token, vault_store_identifier

def parse_class_grade(class_str: str) -> Optional[int]:
    """Extracts numeric grade from class string like '8th', '10th', 'Class 12'."""
    m = re.search(r"(\d+)", str(class_str))
    if m:
        return int(m.group(1))
    return None

def calculate_age_outlier(dob_str: str, class_str: str, ref_year: int = 2026) -> bool:
    """
    Checks if student is 4+ years older than expected grade cohort.
    Expected age = grade + 5.5 years.
    """
    grade = parse_class_grade(class_str)
    if not grade:
        return False
    # Parse year from DD-MM-YYYY or YYYY-MM-DD
    m = re.search(r"(\d{4})", str(dob_str))
    if m:
        birth_year = int(m.group(1))
        current_age = ref_year - birth_year
        expected_age = grade + 5.5
        if current_age >= expected_age + 4:
            return True
    return False

def build_student_graph_from_records(
    records: List[Dict[str, Any]],
    degree_cap: int = 25
) -> Dict[str, Any]:
    """
    Constructs an entity graph from student records and identifies anomaly clusters.
    Supports both user-provided rosters (CSV/Excel) and synthetic benchmark records.
    """
    G = nx.Graph()
    clean_records = []

    # 1. Normalize and register nodes in graph
    for idx, r in enumerate(records):
        sid = str(r.get("Student_ID", r.get("student_id", r.get("id", idx + 1))))
        sname = r.get("Student_Name", r.get("student_name", r.get("name", f"Student {sid}")))
        sclass = str(r.get("Class", r.get("class", r.get("course", "N/A"))))
        adm = str(r.get("Admission_No", r.get("admission_no", "N/A")))
        dob = str(r.get("DOB", r.get("dob", "")))
        cat = str(r.get("Category", r.get("category", "Gen")))
        fname = str(r.get("Father_Name", r.get("father_name", "")))
        mname = str(r.get("Mother_Name", r.get("mother_name", "")))
        inst_name = str(r.get("institution", r.get("Institution", "J&K Government High School")))
        inst_id = str(r.get("institution_id", "INST-001"))

        acc_raw = str(r.get("Account_No", r.get("account_no", "")))
        acc = normalize_account(acc_raw)
        
        mob_raw = str(r.get("Contact_No", r.get("phone_no", r.get("mobile", ""))))
        mob = normalize_mobile(mob_raw)
        
        aadhaar_raw = str(r.get("Aadhaar_No", r.get("aadhaar_no", r.get("aadhaar", "")))).strip()
        aadhaar = re.sub(r"\D", "", aadhaar_raw)
        
        ifsc = str(r.get("IFSC_Code", r.get("ifsc", ""))).strip().upper()

        # Vault tokens
        acc_token = generate_hmac_token("acc", acc) if acc else ""
        mob_token = generate_hmac_token("mob", mob) if mob else ""
        aadh_token = generate_hmac_token("aadh", aadhaar) if aadhaar else ""

        if acc_token:
            vault_store_identifier(acc_token, "bank_account", acc, sid)
        if mob_token:
            vault_store_identifier(mob_token, "mobile", mob, sid)
        if aadh_token:
            vault_store_identifier(aadh_token, "aadhaar", aadhaar, sid)

        # Record standard dict
        std_record = {
            "Student_ID": sid,
            "Student_Name": sname,
            "Admission_No": adm,
            "Class": sclass,
            "DOB": dob,
            "Category": cat,
            "Father_Name": fname,
            "Mother_Name": mname,
            "Account_No": acc,
            "Contact_No": mob,
            "Aadhaar_No": aadhaar_raw,
            "IFSC_Code": ifsc,
            "institution": inst_name,
            "institution_id": inst_id,
            "attendance": float(r.get("attendance", r.get("attendance_pct", 78))),
            "amount": int(r.get("amount", 15000)),
            "scheme": str(r.get("scheme", r.get("scholarship_type", f"{cat} Welfare Scholarship"))),
            "doc_hash": str(r.get("doc_hash", f"TPL-STD-{sid}")),
            "raw_issue": str(r.get("issue", ""))  # If present from Excel dataset
        }
        clean_records.append(std_record)

        student_node = f"STUDENT_{sid}"
        G.add_node(
            student_node,
            type="student",
            label=sname,
            details=f"Class {sclass} | Adm #{adm} | {inst_name}",
            raw=std_record
        )

        if acc:
            bank_node = f"BANK_{acc}"
            G.add_node(bank_node, type="bank", label=f"Acc ••••{acc[-4:] if len(acc)>=4 else acc}", raw_id=acc)
            G.add_edge(student_node, bank_node, label="PAID_TO")

        if mob:
            mob_node = f"MOB_{mob}"
            G.add_node(mob_node, type="mobile", label=f"Mob {mask_mobile(mob)}", raw_id=mob)
            G.add_edge(student_node, mob_node, label="USES_MOBILE")

        if aadhaar and len(aadhaar) >= 8:
            doc_node = f"AADH_{aadhaar}"
            G.add_node(doc_node, type="aadhaar", label=f"Aadhaar ••••{aadhaar[-4:]}", raw_id=aadhaar)
            G.add_edge(student_node, doc_node, label="HAS_AADHAAR")

    # 2. Apply Degree Cap (default 25) to prevent generic hub collapse
    nodes_to_prune = [n for n in G.nodes() if G.nodes[n].get("type") != "student" and G.degree(n) > degree_cap]
    for n in nodes_to_prune:
        G.remove_node(n)

    # 3. Detect Connected Components over shared-identifier links
    detected_clusters = []
    seen_cleared_groups = []
    cluster_idx = 1

    # Run dataset-wide forensics
    forensics_info = {
        "invalid_aadhaar": [],
        "invalid_ifsc": [],
        "sequence_runs": detect_sequential_runs(clean_records, "Account_No") + detect_sequential_runs(clean_records, "Contact_No"),
        "near_duplicates": detect_near_duplicates(clean_records, "Account_No")
    }

    for r in clean_records:
        a_check = validate_aadhaar_format(r["Aadhaar_No"])
        if not a_check["valid"]:
            forensics_info["invalid_aadhaar"].append({
                "student_id": r["Student_ID"],
                "name": r["Student_Name"],
                "value": r["Aadhaar_No"],
                "reason": a_check["reason"]
            })
        if r["IFSC_Code"]:
            i_check = validate_ifsc_code(r["IFSC_Code"])
            if not i_check["valid"]:
                forensics_info["invalid_ifsc"].append({
                    "student_id": r["Student_ID"],
                    "name": r["Student_Name"],
                    "value": r["IFSC_Code"],
                    "reason": i_check["reason"]
                })

    for comp in nx.connected_components(G):
        sub = G.subgraph(comp)
        students_in_comp = [n for n in sub.nodes() if sub.nodes[n].get("type") == "student"]

        if len(students_in_comp) >= 2:
            student_records = [sub.nodes[s].get("raw", {}) for s in students_in_comp]
            
            # Check shared nodes
            banks = [n for n in sub.nodes() if sub.nodes[n].get("type") == "bank"]
            mobiles = [n for n in sub.nodes() if sub.nodes[n].get("type") == "mobile"]
            aadhaars = [n for n in sub.nodes() if sub.nodes[n].get("type") == "aadhaar"]
            
            shared_banks = [b for b in banks if sub.degree(b) > 1]
            shared_mobs = [m for m in mobiles if sub.degree(m) > 1]
            shared_aadhs = [a for a in aadhaars if sub.degree(a) > 1]

            # Institution span
            institutions_spanned = list(set(r.get("institution_id", "INST-001") for r in student_records))
            
            # Attendance mean
            attendances = [r.get("attendance", 78) for r in student_records]
            mean_attendance = sum(attendances) / len(attendances) if attendances else 78.0

            # Age outlier check
            has_age_outlier = any(
                calculate_age_outlier(r.get("DOB", ""), r.get("Class", ""))
                for r in student_records
            )

            # Check invalid identifiers in component
            has_invalid_id = any(
                not validate_aadhaar_format(r.get("Aadhaar_No", ""))["valid"]
                for r in student_records
            )

            # Check Family Shield: are all students in this component siblings sharing mobile?
            family_eval = evaluate_family_shield(
                student_records,
                shared_mobile=bool(shared_mobs)
            )

            # If Family Shield clears it AND no shared bank or Aadhaar is present, move to seen_cleared_groups!
            if family_eval["is_cleared"] and not shared_banks and not shared_aadhs:
                seen_cleared_groups.append({
                    "id": f"CLEARED-HH-{len(seen_cleared_groups)+1:02d}",
                    "students_count": len(student_records),
                    "student_names": [r.get("Student_Name") for r in student_records],
                    "parents": f"{family_eval.get('household_father')} & {family_eval.get('household_mother')}",
                    "cleared_reason": family_eval["explanation"],
                    "status": "Cleared by Family Shield",
                    "score": 12,
                    "band": "normal"
                })
                continue

            # Evaluate full signal scoring
            score, band, reasons = evaluate_signals_comprehensive(
                num_students=len(students_in_comp),
                num_institutions=len(institutions_spanned),
                shared_bank_count=len(shared_banks),
                shared_mobile_count=len(shared_mobs),
                shared_aadhaar_count=len(shared_aadhs),
                mean_attendance=mean_attendance,
                has_shared_doc=len(shared_aadhs) > 0,
                has_age_outlier=has_age_outlier,
                is_invalid_identifier=has_invalid_id,
                is_family_shielded=family_eval["is_cleared"]
            )

            # Nodes for 3D visualizer
            nodes_out = []
            for n in sub.nodes():
                nd = sub.nodes[n]
                ntype = nd.get("type", "student")
                is_shared = sub.degree(n) > 1 and ntype != "student"
                risk_lvl = "high" if is_shared else ("flagged" if ntype == "student" else "normal")
                nodes_out.append({
                    "id": n,
                    "label": nd.get("label", n),
                    "type": ntype,
                    "risk": risk_lvl,
                    "is_shared": is_shared,
                    "details": nd.get("details", "")
                })

            edges_out = []
            for u, v, data in sub.edges(data=True):
                is_flagged = sub.degree(u) > 1 or sub.degree(v) > 1
                edges_out.append({
                    "source": u,
                    "target": v,
                    "label": data.get("label", "LINK"),
                    "flagged": is_flagged
                })

            student_details = []
            for r in student_records:
                student_details.append({
                    "id": str(r.get("Student_ID")),
                    "name": r.get("Student_Name", "Student"),
                    "institution": r.get("institution", "Government School"),
                    "institution_id": r.get("institution_id", "INST-001"),
                    "course": f"Class {r.get('Class', 'N/A')}",
                    "year": f"DOB: {r.get('DOB', 'N/A')}",
                    "attendance": r.get("attendance", 25),
                    "bank_masked": mask_account(r.get("Account_No", "")),
                    "mobile_masked": mask_mobile(r.get("Contact_No", "")),
                    "address": f"Father: {r.get('Father_Name', 'N/A')} | Mother: {r.get('Mother_Name', 'N/A')}",
                    "amount": r.get("amount", 15000),
                    "scheme": r.get("scheme", "General Scholarship"),
                    "doc_hash": f"Aadhaar ••••{str(r.get('Aadhaar_No', ''))[-4:]}",
                    "status": "Flagged"
                })

            pattern_desc = f"{len(students_in_comp)} students share "
            shared_items = []
            if shared_banks:
                shared_items.append("bank account")
            if shared_mobs:
                shared_items.append("mobile number")
            if shared_aadhs:
                shared_items.append("Aadhaar identity")
            pattern_desc += " and ".join(shared_items) if shared_items else "multiple identifiers"
            if len(institutions_spanned) > 1:
                pattern_desc += f" across {len(institutions_spanned)} institutions"

            detected_clusters.append({
                "id": f"CL-SCAN-{cluster_idx:02d}",
                "title": f"Convergence Cluster #{cluster_idx} ({len(students_in_comp)} Linked Students)",
                "pattern": pattern_desc,
                "score": score,
                "band": band,
                "status": "open",
                "is_hero": False,
                "created_at": "Just now (Sentinel Engine)",
                "counts": {
                    "students": len(students_in_comp),
                    "institutions": len(institutions_spanned),
                    "banks": len(banks),
                    "mobiles": len(mobiles),
                    "addresses": 1,
                    "documents": len(aadhaars)
                },
                "reasons": reasons,
                "students": student_details,
                "cleared": [],
                "timeline": [
                    {"time": "Just now", "officer": "Sentinel NetworkX Engine", "action": "Cluster Extracted", "note": f"Graph partitioned {len(students_in_comp)} linked identities (Score: {score}/100)"}
                ],
                "graph": {
                    "nodes": nodes_out,
                    "edges": edges_out
                }
            })
            cluster_idx += 1

    # Also extract dataset-wide cleared households for the seen-but-not-flagged panel
    all_cleared = find_cleared_sibling_groups(clean_records)
    seen_cleared_groups.extend(all_cleared)

    return {
        "clusters": detected_clusters,
        "cleared_groups": seen_cleared_groups,
        "forensics": forensics_info,
        "total_nodes": G.number_of_nodes(),
        "total_edges": G.number_of_edges(),
        "records": clean_records
    }
