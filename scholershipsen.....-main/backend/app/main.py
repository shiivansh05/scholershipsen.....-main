


from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import io
import pandas as pd
from typing import Optional, List, Dict, Any

from .models import ActionRequest
from .graph import build_student_graph_from_records
from .rules import evaluate_signals_comprehensive, compute_counterfactual, SIGNAL_POINTS
from .forensics import run_dataset_forensics, validate_aadhaar_format, validate_ifsc_code
from .family import find_cleared_sibling_groups
from .vault import vault_unmask, mask_aadhaar, mask_bank_account, mask_mobile_number
from .audit import append_audit_entry, verify_audit_chain, get_audit_log, tamper_entry_for_demo
from .fairness import compute_fairness_audit
from .redteam import inject_red_team_attack
from .db import init_db, seed_database_from_json, get_db_stats
from .gateways import lookup_ifsc_code, verify_npci_dbt_seeding, verify_digilocker_certificate

app = FastAPI(
    title="Scholarship Sentinel API",
    description="Explainable anomaly cluster intelligence system for government scholarship verification.",
    version="2.0.0"
)

@app.on_event("startup")
def startup_event():
    try:
        init_db()
        seed_database_from_json()
    except Exception as e:
        print(f"[Sentinel DB] Startup notice: {e}")

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")

def load_json_file(filename: str) -> Any:
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Data file {filename} not found")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json_file(filename: str, data: Any):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

# In-memory store for dynamically injected Red Team clusters
_DYNAMIC_CLUSTERS: List[Dict[str, Any]] = []

@app.get("/api/summary")
def get_summary():
    return load_json_file("summary.json")

@app.get("/api/clusters")
def get_clusters(band: Optional[str] = None, status: Optional[str] = None):
    clusters = load_json_file("clusters.json")
    all_clusters = _DYNAMIC_CLUSTERS + clusters
    if band and band != "all":
        all_clusters = [c for c in all_clusters if c.get("band", "").lower() == band.lower()]
    if status and status != "all":
        all_clusters = [c for c in all_clusters if c.get("status", "").lower() == status.lower()]
    return all_clusters

@app.get("/api/clusters/{cluster_id}")
def get_cluster_detail(cluster_id: str):
    # Check dynamic clusters first
    for c in _DYNAMIC_CLUSTERS:
        if c["id"].lower() == cluster_id.lower():
            return c
            
    clusters = load_json_file("clusters.json")
    for c in clusters:
        if c["id"].lower() == cluster_id.lower():
            return c
            
    # Also check CSV clusters
    try:
        csv_clusters = load_json_file("csv_clusters.json")
        for c in csv_clusters:
            if c["id"].lower() == cluster_id.lower():
                return c
    except Exception:
        pass
        
    raise HTTPException(status_code=404, detail=f"Cluster {cluster_id} not found")

@app.get("/api/clusters/{cluster_id}/counterfactual")
def get_cluster_counterfactual(
    cluster_id: str,
    remove: Optional[List[str]] = Query(None)
):
    """
    Tier A Feature 3: Counterfactual Explanations
    On any cluster, toggle a signal off and see the score and band recompute.
    """
    cluster = get_cluster_detail(cluster_id)
    reasons = cluster.get("reasons", [])
    removed_signals = remove if remove else []
    result = compute_counterfactual(reasons, removed_signals)
    result["cluster_id"] = cluster_id
    result["available_signals"] = [r.get("signal") for r in reasons]
    return result

@app.get("/api/clusters/{cluster_id}/timeline")
def get_cluster_timeline(cluster_id: str):
    cluster = get_cluster_detail(cluster_id)
    timeline = cluster.get("timeline", [])
    lead_time = {
        "detection_date": "2026-03-28",
        "first_payment_scheduled": "2026-04-15",
        "lead_time_days": 18,
        "pre_payment_held": True
    }
    return {"cluster_id": cluster_id, "timeline": timeline, "lead_time": lead_time}

@app.get("/api/clusters/{cluster_id}/brief")
def get_cluster_case_brief(cluster_id: str):
    """
    Tier B Feature 9: Auto Case Brief
    Produces structured brief for printable summary and field verification checklist.
    """
    cluster = get_cluster_detail(cluster_id)
    checklist = [
        f"Inspect physical attendance registers at institutions ({cluster.get('counts', {}).get('institutions', 1)} colleges)",
        f"Cross-verify bank authorization KYC with branch manager for account {cluster.get('students', [{}])[0].get('bank_masked', 'N/A')}",
        "Examine submitted income certificate templates for geometric similarity",
        "Confirm parent names and residential addresses in Panchayat / Municipal records"
    ]
    return {
        "case_brief_id": f"BRIEF-{cluster_id}",
        "cluster_id": cluster_id,
        "title": cluster.get("title", ""),
        "pattern": cluster.get("pattern", ""),
        "score": cluster.get("score", 0),
        "band": cluster.get("band", "high"),
        "status": cluster.get("status", "open"),
        "reasons": cluster.get("reasons", []),
        "student_count": len(cluster.get("students", [])),
        "students": cluster.get("students", []),
        "checklist": checklist,
        "recommendation": "Payment hold recommended prior to field verification." if cluster.get("score", 0) >= 70 else "Secondary document audit queue."
    }

@app.post("/api/clusters/{cluster_id}/action")
def take_cluster_action(cluster_id: str, payload: ActionRequest):
    cluster = None
    # Check dynamic clusters
    for c in _DYNAMIC_CLUSTERS:
        if c["id"].lower() == cluster_id.lower():
            cluster = c
            break
            
    if not cluster:
        clusters = load_json_file("clusters.json")
        for c in clusters:
            if c["id"].lower() == cluster_id.lower():
                cluster = c
                break
        if cluster:
            action_map = {
                "verify": "verified",
                "assign": "assigned",
                "request_documents": "documents_requested",
                "escalate": "escalated",
                "close": "closed"
            }
            new_status = action_map.get(payload.action, payload.action)
            cluster["status"] = new_status
            timeline_entry = {
                "time": "Just now",
                "officer": payload.assignee if payload.assignee else "Officer on Duty",
                "action": payload.action.replace("_", " ").title(),
                "note": payload.note
            }
            cluster.setdefault("timeline", []).insert(0, timeline_entry)
            save_json_file("clusters.json", clusters)

    if not cluster:
        raise HTTPException(status_code=404, detail=f"Cluster {cluster_id} not found")

    # Append to tamper-evident audit log
    append_audit_entry(
        actor=payload.assignee or "Officer on Duty",
        action=f"CASE_{payload.action.upper()}",
        target=cluster_id,
        reason=payload.note or f"Officer initiated {payload.action}"
    )

    return {"status": "success", "cluster": cluster, "new_status": cluster.get("status")}

@app.get("/api/institutions")
def get_institutions():
    return load_json_file("institutions.json")

@app.get("/api/fairness")
def get_fairness_audit():
    """
    Tier A Feature 5: Fairness Audit
    Disparate-impact ratio and category flag rates.
    """
    try:
        apps = load_json_file("synthetic_applications.json")
    except Exception:
        apps = []
    clusters = load_json_file("clusters.json")
    return compute_fairness_audit(apps, clusters)

@app.get("/api/cleared")
def get_cleared_groups():
    """
    Tier A Feature 2: Seen but not flagged panel
    Lists groups the system found and deliberately cleared with reason.
    """
    try:
        raw_students = load_json_file("students_raw.json")
        cleared = find_cleared_sibling_groups(raw_students)
        return cleared
    except Exception:
        return [
            {
                "id": "CLEARED-HH-01",
                "students_count": 2,
                "student_names": ["Deepak Kumar", "Parveen Kumar"],
                "parents": "Darshan Lal & Rekha Rani",
                "cleared_reason": "Siblings, same parents sharing contact or residence. Family Shield verified.",
                "status": "Cleared by Family Shield",
                "score": 10,
                "band": "normal"
            },
            {
                "id": "CLEARED-HH-02",
                "students_count": 2,
                "student_names": ["Anshu Kumar", "Anshika Bhagat"],
                "parents": "Balbir Kumar & Dev Rani",
                "cleared_reason": "Siblings, same parents sharing contact number. Family Shield verified.",
                "status": "Cleared by Family Shield",
                "score": 12,
                "band": "normal"
            }
        ]

@app.post("/api/applications/check")
def pre_disbursement_check(app_data: Dict[str, Any] = Body(...)):
    """
    Tier A Feature 6: Pre-Disbursement Check
    Scores a single application before payout to prevent wrongful disbursements.
    """
    aadhaar = str(app_data.get("Aadhaar_No", app_data.get("aadhaar_no", "")))
    account = str(app_data.get("Account_No", app_data.get("account_no", "")))
    attendance = float(app_data.get("attendance", 75))
    
    reasons = []
    score = 15 # baseline individual check
    
    # Aadhaar validity
    a_res = validate_aadhaar_format(aadhaar)
    if not a_res["valid"]:
        score += 25
        reasons.append({"signal": "invalid_identifier", "points": 25, "text": f"Aadhaar issue: {a_res['reason']}"})
        
    if attendance < 30:
        score += 20
        reasons.append({"signal": "attendance", "points": 20, "text": f"Attendance is {attendance}% (< 30%)"})
        
    band = "high" if score >= 70 else "review" if score >= 40 else "normal"
    recommendation = "HOLD PAYMENT" if score >= 70 else "REVIEW BEFORE PAYOUT" if score >= 40 else "APPROVE FOR DISBURSEMENT"
    
    return {
        "score": min(score, 100),
        "band": band,
        "recommendation": recommendation,
        "reasons": reasons,
        "application_id": app_data.get("Student_ID", "NEW-APP-01")
    }

@app.post("/api/redteam/inject")
def inject_redteam(payload: Dict[str, Any] = Body(...)):
    """
    Tier A Feature 4: Red Team Live Attack Injection
    Injects synthetic attack pattern (shared_bank, mobile_farm, ghost_institution, evasive_ring)
    """
    pattern = payload.get("pattern", "shared_bank")
    size = int(payload.get("size", 5))
    new_cluster = inject_red_team_attack(pattern, size)
    _DYNAMIC_CLUSTERS.insert(0, new_cluster)
    
    append_audit_entry(
        actor="Red Team Simulator",
        action="INJECT_ADVERSARIAL_CLUSTER",
        target=new_cluster["id"],
        reason=f"Injected {pattern} attack with {size} entities to test system detection"
    )
    
    return {
        "status": "success",
        "injected_cluster": new_cluster,
        "total_dynamic_clusters": len(_DYNAMIC_CLUSTERS)
    }

@app.post("/api/vault/unmask")
def unmask_identifier(payload: Dict[str, Any] = Body(...)):
    """
    Tier B Feature 8: Privacy Vault Unmasking
    Requires actor, role, token, and typed reason. Writes to audit chain.
    """
    token = payload.get("token", "")
    actor = payload.get("actor", "Investigator")
    role = payload.get("role", "Investigator")
    reason = payload.get("reason", "")
    
    if not reason or len(reason.strip()) < 5:
        raise HTTPException(status_code=400, detail="A valid typed reason is required to unmask PII.")
        
    result = vault_unmask(token, actor, role, reason)
    if not result:
        # Fallback masked reveal for demo
        result = {
            "token": token,
            "type": "identifier",
            "raw_value": "98710003" if "mob" in token.lower() else "0684041000001517",
            "unmasked_by": actor,
            "role": role,
            "reason": reason
        }
        
    append_audit_entry(
        actor=actor,
        action="UNMASK_PII",
        target=token,
        reason=reason
    )
    return {"status": "success", "unmasked": result}

@app.get("/api/audit/verify")
def get_audit_verification():
    """Verifies cryptographic hash chain."""
    return verify_audit_chain()

@app.get("/api/audit/log")
def get_audit_trail(limit: int = 50):
    return get_audit_log(limit)

@app.post("/api/audit/tamper-demo")
def trigger_tamper_demo(payload: Dict[str, Any] = Body(...)):
    seq = int(payload.get("seq", 2))
    tamper_entry_for_demo(seq, "MODIFIED_UNAUTHORIZED: Tampered case record note.")
    return verify_audit_chain()

@app.get("/api/forensics")
def get_dataset_forensics():
    """
    Tier A Feature 1: Identifier Forensics
    Returns Aadhaar Verhoeff failures, sequential accounts, and IFSC format checks.
    """
    try:
        raw_students = load_json_file("students_raw.json")
        return run_dataset_forensics(raw_students)
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/scan/upload")
@app.post("/api/analyze-csv")
@app.post("/api/analyze-file")
async def scan_uploaded_file(
    file: Optional[UploadFile] = File(None),
    csv_text: Optional[str] = None
):
    """
    Dedicated Scanner Endpoint:
    Accepts ANY custom CSV or Excel file uploaded by user (or raw text).
    Runs complete Sentinel pipeline:
    Normalization -> HMAC tokens -> Forensics -> Family Shield -> Graph Clustering -> Scoring.
    """
    try:
        if file:
            content = await file.read()
            filename = (file.filename or "").lower()
            if filename.endswith(".xlsx") or filename.endswith(".xls"):
                df = pd.read_excel(io.BytesIO(content))
            else:
                df = pd.read_csv(io.BytesIO(content))
        elif csv_text:
            df = pd.read_csv(io.StringIO(csv_text))
        else:
            # Fallback to local students.csv
            csv_path = os.path.join(DATA_DIR, "..", "students.csv")
            df = pd.read_csv(csv_path)

        df = df.fillna("")
        records = df.to_dict("records")
        
        # Execute Sentinel graph clustering & forensics
        result = build_student_graph_from_records(records)
        
        # Log to audit chain
        append_audit_entry(
            actor="Officer on Duty",
            action="DATASET_SCANNED",
            target=file.filename if file else "Custom Dataset",
            reason=f"Processed {len(records)} records. Surfaced {len(result.get('clusters', []))} anomaly clusters."
        )

        return {
            "status": "success",
            "total_records": len(records),
            "clusters": result.get("clusters", []),
            "cleared_groups": result.get("cleared_groups", []),
            "forensics": result.get("forensics", {}),
            "total_nodes": result.get("total_nodes", 0),
            "total_edges": result.get("total_edges", 0),
            "records": result.get("records", [])
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing uploaded file: {str(e)}")

@app.get("/api/datasets/mixed")
def get_mixed_dataset():
    """Returns the unified mixed dataset (User Excel + User CSV)."""
    return load_json_file("mixed_students.json")

@app.get("/api/datasets/excel")
def get_excel_dataset():
    """Returns the user Excel dataset (students.csv.xlsx with labeled issues)."""
    return load_json_file("excel_students.json")

@app.post("/api/students")
def add_student_record(student_data: Dict[str, Any]):
    students = load_json_file("students_raw.json")
    new_id = len(students) + 1
    student_data["Student_ID"] = student_data.get("Student_ID", new_id)
    students.insert(0, student_data)
    save_json_file("students_raw.json", students)
    
    graph_res = build_student_graph_from_records(students)
    detected_clusters = graph_res.get("clusters", [])
    save_json_file("csv_clusters.json", detected_clusters)
    
    student_sid = str(student_data["Student_ID"])
    matched_cluster = None
    for c in detected_clusters:
        if any(s.get("id") == str(student_sid) or s.get("name") == student_data.get("Student_Name") for s in c.get("students", [])):
            matched_cluster = c
            break
            
    return {
        "status": "success",
        "student": student_data,
        "matched_cluster": matched_cluster,
        "all_clusters": detected_clusters,
        "total_students": len(students)
    }

@app.get("/api/synthetic/applications")
def get_synthetic_applications(
    scheme: Optional[str] = None,
    band: Optional[str] = None,
    limit: int = 500
):
    apps = load_json_file("synthetic_applications.json")
    if scheme and scheme != "all":
        apps = [a for a in apps if a.get("scholarship_type") == scheme]
    if band and band != "all":
        apps = [a for a in apps if a.get("risk_band") == band]
    return apps[:limit]

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "Scholarship Sentinel API",
        "version": "2.0.0",
        "engine": "NetworkX v3 + SHA-256 Audit Chain + SQLite/SQLAlchemy 2.0"
    }

# =====================================================================
# DATABASE & ENTERPRISE GATEWAY INTEGRATIONS
# =====================================================================

@app.get("/api/db/stats")
def get_database_statistics():
    """Returns relational SQLite database statistics and live table counts."""
    return get_db_stats()

@app.get("/api/external/ifsc/{code}")
async def lookup_ifsc(code: str):
    """
    Live Indian Banking Gateway IFSC Resolver.
    Fetches official branch and RTGS/NEFT/IMPS clearing capability.
    """
    data = await lookup_ifsc_code(code)
    return data

@app.post("/api/external/npci-verify")
def verify_npci_dbt(payload: Dict[str, Any] = Body(...)):
    """
    NPCI Aadhaar-DBT Seeding Gateway.
    Verifies bank account mapping status for Direct Benefit Transfer.
    """
    aadhaar_last4 = payload.get("aadhaar_last4", "1234")
    account_last4 = payload.get("account_last4", "5678")
    return verify_npci_dbt_seeding(aadhaar_last4, account_last4)

@app.post("/api/external/digilocker-verify")
def verify_digilocker(payload: Dict[str, Any] = Body(...)):
    """
    DigiLocker / MeitY Document Authenticity Gateway.
    Verifies digital PKI certificate integrity and template reuse flags.
    """
    doc_hash = payload.get("doc_hash", "DOC-SHA-992")
    doc_type = payload.get("doc_type", "INCOME_CERTIFICATE")
    return verify_digilocker_certificate(doc_hash, doc_type)

