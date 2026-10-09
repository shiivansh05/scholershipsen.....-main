"""
Red Team Attack Simulation Module for Scholarship Sentinel.
Section 5.4 of SCHOLARSHIP_SENTINEL_FINAL.md:
Generates on-the-fly attack clusters:
1. Shared Bank Account Ring (classic mule)
2. Mobile Farm Ring (single call center number across schools)
3. Ghost Institution Surge (spike in non-existent student enrollments)
4. Evasive Ring (unique banks & mobiles, but shared address & guardian - tests system edge detection)
"""

import random
from typing import Dict, Any, List

def inject_red_team_attack(pattern: str, size: int = 5) -> Dict[str, Any]:
    """
    Generates synthetic attack records and returns a new cluster structure ready for graph injection.
    """
    cluster_num = random.randint(300, 999)
    cluster_id = f"CL-RED-{cluster_num}"
    size = max(3, min(size, 25))
    
    first_names = ["Arjun", "Kavita", "Rohan", "Sunita", "Deepak", "Pooja", "Vikram", "Anjali", "Suresh", "Meera"]
    last_names = ["Kumar", "Sharma", "Verma", "Reddy", "Patel", "Singh", "Das", "Joshi", "Nair", "Yadav"]
    
    students = []
    nodes = []
    edges = []
    reasons = []
    
    if pattern == "shared_bank":
        # Shared bank mule ring
        bank_acc = f"BA{random.randint(700, 899)}"
        phone = f"98{random.randint(10000000, 99999999)}"
        score = 85
        band = "high"
        title = f"Red Team Mule: {size} Students Sharing Single Bank Hub"
        
        reasons = [
            {"signal": "shared_bank", "label": "Shared bank account", "points": 25, "text": f"{size} students route disbursements to common account {bank_acc}"},
            {"signal": "shared_mobile", "label": "Shared mobile contact", "points": 20, "text": f"{size} students share contact {phone}"},
            {"signal": "cross_institution", "label": "Cross-institution span", "points": 15, "text": f"Cluster spans 3 independent colleges"},
            {"signal": "attendance", "label": "Attendance anomaly", "points": 15, "text": "Cohort mean attendance is 12.4% (well below 30% threshold)"},
            {"signal": "documents", "label": "Document similarity", "points": 10, "text": "Certificates share identical issuer stamp metadata"}
        ]
        
        bank_node_id = f"RED_BANK_{bank_acc}"
        nodes.append({"id": bank_node_id, "label": f"Bank ••••{bank_acc}", "type": "bank", "risk": "high", "is_shared": True})
        
        for i in range(size):
            sid = f"RED-S{random.randint(1000, 9999)}"
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            snode_id = f"STUDENT_{sid}"
            nodes.append({"id": snode_id, "label": name, "type": "student", "risk": "flagged"})
            edges.append({"source": snode_id, "target": bank_node_id, "label": "PAID_TO", "flagged": True})
            
            students.append({
                "id": sid,
                "name": name,
                "institution": f"Institute of Technology #{random.randint(1, 5)}",
                "course": "B.Tech Computer Science",
                "year": "2nd Year",
                "attendance": random.randint(5, 18),
                "bank_masked": f"••••{bank_acc}",
                "mobile_masked": f"{phone[:2]}••••{phone[-4:]}",
                "amount": 25000,
                "status": "Flagged"
            })

    elif pattern == "mobile_farm":
        # Mobile farm ring
        phone = f"91{random.randint(40000000, 49999999)}"
        score = 67
        band = "review"
        title = f"Red Team Mobile Farm: {size} Filings Tied to Single Sim Card"
        
        reasons = [
            {"signal": "shared_mobile", "label": "Shared mobile contact (bulk)", "points": 20, "text": f"{size} student filings originate from SIM {phone}"},
            {"signal": "cross_institution", "label": "Cross-institution span", "points": 15, "text": f"Filings span 4 distinct state districts"},
            {"signal": "sequential_batch", "label": "Sequential account filing", "points": 20, "text": "Bank account registration times cluster in 40-minute window"},
            {"signal": "documents", "label": "Document similarity", "points": 12, "text": "Income certificates share template geometry"}
        ]
        
        mob_node_id = f"RED_MOB_{phone[-4:]}"
        nodes.append({"id": mob_node_id, "label": f"Mob {phone[:2]}••••{phone[-4:]}", "type": "mobile", "risk": "amber", "is_shared": True})
        
        for i in range(size):
            sid = f"RED-S{random.randint(1000, 9999)}"
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            snode_id = f"STUDENT_{sid}"
            nodes.append({"id": snode_id, "label": name, "type": "student", "risk": "flagged"})
            edges.append({"source": snode_id, "target": mob_node_id, "label": "USES_MOBILE", "flagged": True})
            
            students.append({
                "id": sid,
                "name": name,
                "institution": f"District Polytechnic #{random.randint(1, 3)}",
                "course": "Diploma Electrical",
                "year": "1st Year",
                "attendance": random.randint(40, 65),
                "bank_masked": f"••••{random.randint(1000, 9999)}",
                "mobile_masked": f"{phone[:2]}••••{phone[-4:]}",
                "amount": 18000,
                "status": "Flagged"
            })

    elif pattern == "evasive_ring":
        # Evasive ring: unique banks & mobiles, but shared address & guardian!
        # Demonstrates limits & explainability (scores lower, e.g. 52, but caught through subtle links)
        address = "Plot 44, Industrial Area Sector 9, Solan"
        guardian = "Dharam Pal (Registered Guardian)"
        score = 52
        band = "review"
        title = f"Red Team Evasive Ring: {size} Students Concealing Identity via Shared Guardian/Address"
        
        reasons = [
            {"signal": "shared_address", "label": "Shared address (non-family)", "points": 15, "text": f"{size} students with distinct surnames list single industrial warehouse address"},
            {"signal": "cross_institution", "label": "Cross-institution span", "points": 15, "text": "Filings span 2 distinct private colleges"},
            {"signal": "documents", "label": "Document similarity", "points": 12, "text": "Affidavit stamped by identical notary registration number"},
            {"signal": "attendance", "label": "Attendance dip", "points": 10, "text": "Average classroom attendance 28.5%"}
        ]
        
        addr_node_id = "RED_ADDR_SECT9"
        guard_node_id = "RED_GUARD_DHARAM"
        nodes.append({"id": addr_node_id, "label": "Address: Sector 9 Industrial", "type": "address", "risk": "amber", "is_shared": True})
        nodes.append({"id": guard_node_id, "label": "Guardian: Dharam Pal", "type": "guardian", "risk": "amber", "is_shared": True})
        
        for i in range(size):
            sid = f"RED-S{random.randint(1000, 9999)}"
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            snode_id = f"STUDENT_{sid}"
            nodes.append({"id": snode_id, "label": name, "type": "student", "risk": "flagged"})
            edges.append({"source": snode_id, "target": addr_node_id, "label": "LIVES_AT", "flagged": True})
            edges.append({"source": snode_id, "target": guard_node_id, "label": "GUARDIAN_OF", "flagged": True})
            
            students.append({
                "id": sid,
                "name": name,
                "institution": "Apex College of Management",
                "course": "BBA Management",
                "year": "2nd Year",
                "attendance": random.randint(22, 34),
                "bank_masked": f"••••{random.randint(1000, 9999)}",
                "mobile_masked": f"98••••{random.randint(1000, 9999)}",
                "amount": 22000,
                "status": "Flagged"
            })
            
    else: # ghost_institution
        inst_name = f"Apex Rural Training Institute (Ghost #{cluster_num})"
        score = 75
        band = "high"
        title = f"Red Team Ghost Surge: {size * 4} Applications from Unregistered College"
        
        reasons = [
            {"signal": "application_surge", "label": "Application surge anomaly", "points": 25, "text": f"Application volume exceeds 4.2x verified campus student capacity"},
            {"signal": "attendance", "label": "Attendance anomaly", "points": 15, "text": "Cohort attendance records missing or 0%"},
            {"signal": "documents", "label": "Document similarity", "points": 15, "text": "Batch uploads share identical cryptographic watermark hash"},
            {"signal": "shared_bank", "label": "Routing through institution escrow", "points": 20, "text": "Payments channeled through single unregistered account"}
        ]
        
        inst_node_id = f"RED_INST_{cluster_num}"
        nodes.append({"id": inst_node_id, "label": inst_name, "type": "institution", "risk": "high", "is_shared": True})
        
        for i in range(size):
            sid = f"RED-S{random.randint(1000, 9999)}"
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            snode_id = f"STUDENT_{sid}"
            nodes.append({"id": snode_id, "label": name, "type": "student", "risk": "flagged"})
            edges.append({"source": snode_id, "target": inst_node_id, "label": "ENROLLED_AT", "flagged": True})
            
            students.append({
                "id": sid,
                "name": name,
                "institution": inst_name,
                "course": "Vocational Certificate",
                "year": "1st Year",
                "attendance": 0,
                "bank_masked": f"••••{random.randint(1000, 9999)}",
                "mobile_masked": f"98••••{random.randint(1000, 9999)}",
                "amount": 20000,
                "status": "Flagged"
            })

    cluster = {
        "id": cluster_id,
        "title": title,
        "pattern": f"Simulated Red Team attack vector ({pattern}) injected into live Sentinel graph",
        "score": score,
        "band": band,
        "status": "open",
        "is_hero": False,
        "is_redteam": True,
        "created_at": "Just now (Red Team Simulation)",
        "counts": {
            "students": len(students),
            "institutions": 3 if pattern == "shared_bank" else 1,
            "banks": 1 if pattern in ["shared_bank", "ghost_institution"] else len(students),
            "mobiles": 1 if pattern == "mobile_farm" else len(students),
            "addresses": 1 if pattern == "evasive_ring" else len(students),
            "documents": 1
        },
        "reasons": reasons,
        "students": students,
        "timeline": [
            {"time": "Just now", "officer": "Red Team Live Agent", "action": "Adversarial Pattern Injected", "note": f"Injected {len(students)} adversarial nodes to test detection elasticity."}
        ],
        "graph": {
            "nodes": nodes,
            "edges": edges
        }
    }
    
    return cluster
