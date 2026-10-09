"""
Signal Evaluation and Scoring Engine for Scholarship Sentinel.
Section 4.1 & 5.3 of SCHOLARSHIP_SENTINEL_FINAL.md:
Table of 13 signals, additive points, floor 0, cap 100.
Supports counterfactual score recalculations.
"""

from typing import List, Dict, Any, Tuple, Optional

# Full signal points table per SCHOLARSHIP_SENTINEL_FINAL.md Section 4.1
SIGNAL_POINTS = {
    "shared_aadhaar": 30,
    "shared_bank": 25,
    "shared_mobile_bulk": 20,       # 3+ students
    "shared_mobile_pair": 12,       # 2 students
    "cross_institution": 15,
    "attendance": 15,
    "application_surge": 15,
    "documents": 12,
    "shared_address": 10,           # 5+ unrelated students
    "sequential_batch": 20,         # 5+ consecutive account/mobile values
    "near_duplicate": 10,           # Aadhaar or account differs by 1 digit
    "invalid_identifier": 10,       # Aadhaar not 12 digits, fails Verhoeff, or malformed IFSC
    "age_outlier": 5,               # 4+ years above expected age for grade
    "family_shield": -15            # Sharing explained by same parents
}

def evaluate_signals_comprehensive(
    num_students: int,
    num_institutions: int = 1,
    shared_bank_count: int = 0,
    shared_mobile_count: int = 0,
    shared_aadhaar_count: int = 0,
    mean_attendance: float = 78.0,
    has_shared_doc: bool = False,
    max_students_at_address: int = 1,
    is_institution_surge: bool = False,
    is_sequential_batch: bool = False,
    is_near_duplicate: bool = False,
    is_invalid_identifier: bool = False,
    has_age_outlier: bool = False,
    is_family_shielded: bool = False
) -> Tuple[int, str, List[Dict[str, Any]]]:
    """
    Evaluates all anomaly signals, accumulates points, and assigns risk band.
    """
    reasons = []
    total_score = 0

    if shared_aadhaar_count > 0:
        pts = SIGNAL_POINTS["shared_aadhaar"]
        total_score += pts
        reasons.append({
            "signal": "shared_aadhaar",
            "label": "Shared Aadhaar identifier",
            "points": pts,
            "text": f"{num_students} student filings share identical national Aadhaar identity token"
        })

    if shared_bank_count > 0:
        pts = SIGNAL_POINTS["shared_bank"]
        total_score += pts
        reasons.append({
            "signal": "shared_bank",
            "label": "Shared bank account",
            "points": pts,
            "text": f"{num_students} students route disbursements to common account destination"
        })

    if shared_mobile_count > 0:
        pts = SIGNAL_POINTS["shared_mobile_bulk"] if num_students >= 3 else SIGNAL_POINTS["shared_mobile_pair"]
        total_score += pts
        reasons.append({
            "signal": "shared_mobile",
            "label": "Shared mobile contact",
            "points": pts,
            "text": f"{num_students} student filings share primary phone verification number"
        })

    if num_institutions >= 2:
        pts = SIGNAL_POINTS["cross_institution"]
        total_score += pts
        reasons.append({
            "signal": "cross_institution",
            "label": "Cross-institution span",
            "points": pts,
            "text": f"Cluster spans {num_institutions} separate geographical educational institutions"
        })

    if mean_attendance < 30.0:
        pts = SIGNAL_POINTS["attendance"]
        total_score += pts
        reasons.append({
            "signal": "attendance",
            "label": "Attendance anomaly",
            "points": pts,
            "text": f"Cluster mean verified attendance is {mean_attendance:.1f}% (below 30% verification threshold)"
        })

    if has_shared_doc:
        pts = SIGNAL_POINTS["documents"]
        total_score += pts
        reasons.append({
            "signal": "documents",
            "label": "Document similarity",
            "points": pts,
            "text": "Beneficiary certificates share identical verification template or cryptographic hash"
        })

    if is_institution_surge:
        pts = SIGNAL_POINTS["application_surge"]
        total_score += pts
        reasons.append({
            "signal": "application_surge",
            "label": "Application surge anomaly",
            "points": pts,
            "text": "Applications exceed 3x active verified student count"
        })

    if max_students_at_address >= 5:
        pts = SIGNAL_POINTS["shared_address"]
        total_score += pts
        reasons.append({
            "signal": "shared_address",
            "label": "Shared address (non-family)",
            "points": pts,
            "text": f"{max_students_at_address} non-family applicants registered at single residential address"
        })

    if is_sequential_batch:
        pts = SIGNAL_POINTS["sequential_batch"]
        total_score += pts
        reasons.append({
            "signal": "sequential_batch",
            "label": "Sequential-identifier batch",
            "points": pts,
            "text": "Cluster exhibits run of 5+ consecutive account numbers or mobile sequences"
        })

    if is_near_duplicate:
        pts = SIGNAL_POINTS["near_duplicate"]
        total_score += pts
        reasons.append({
            "signal": "near_duplicate",
            "label": "Near-duplicate identifier",
            "points": pts,
            "text": "Identifier digits differ by exactly one digit (Hamming distance 1)"
        })

    if is_invalid_identifier:
        pts = SIGNAL_POINTS["invalid_identifier"]
        total_score += pts
        reasons.append({
            "signal": "invalid_identifier",
            "label": "Invalid identifier",
            "points": pts,
            "text": "Identifier fails Verhoeff checksum or violates 12-digit format / IFSC structure"
        })

    if has_age_outlier:
        pts = SIGNAL_POINTS["age_outlier"]
        total_score += pts
        reasons.append({
            "signal": "age_outlier",
            "label": "Age-for-grade outlier",
            "points": pts,
            "text": "Applicant DOB indicates age is 4+ years above standard grade cohort"
        })

    if is_family_shielded:
        pts = SIGNAL_POINTS["family_shield"]
        total_score += pts
        reasons.append({
            "signal": "family_shield",
            "label": "Family Shield clearance",
            "points": pts,
            "text": "Verified legitimate household (same parents); identifier penalty discounted"
        })

    # Floor at 0, cap at 100
    final_score = max(0, min(total_score, 100))

    if final_score >= 70:
        band = "high"
    elif final_score >= 40:
        band = "review"
    else:
        band = "normal"

    return final_score, band, reasons

# Backward-compatibility alias
def evaluate_signals(
    num_students: int,
    num_institutions: int = 1,
    shared_bank_count: int = 0,
    shared_mobile_count: int = 0,
    mean_attendance: float = 78.0,
    has_shared_doc: bool = False,
    max_students_at_address: int = 1,
    is_institution_surge: bool = False
) -> Tuple[int, str, List[Dict[str, Any]]]:
    return evaluate_signals_comprehensive(
        num_students=num_students,
        num_institutions=num_institutions,
        shared_bank_count=shared_bank_count,
        shared_mobile_count=shared_mobile_count,
        mean_attendance=mean_attendance,
        has_shared_doc=has_shared_doc,
        max_students_at_address=max_students_at_address,
        is_institution_surge=is_institution_surge
    )

def compute_counterfactual(reasons: List[Dict[str, Any]], removed_signals: List[str]) -> Dict[str, Any]:
    """
    Recomputes score and risk band when specified signals are excluded.
    e.g. 'Remove the shared mobile: 87 becomes 67 and the cluster drops to Review.'
    """
    removed_set = set(removed_signals)
    active_reasons = [r for r in reasons if r.get("signal") not in removed_set]
    new_score = sum(r.get("points", 0) for r in active_reasons)
    new_score = max(0, min(new_score, 100))
    
    if new_score >= 70:
        new_band = "high"
    elif new_score >= 40:
        new_band = "review"
    else:
        new_band = "normal"
        
    return {
        "original_score": sum(r.get("points", 0) for r in reasons),
        "new_score": new_score,
        "new_band": new_band,
        "removed_signals": list(removed_set),
        "delta": new_score - sum(r.get("points", 0) for r in reasons),
        "explanation": f"When removing {', '.join(removed_signals) or 'no signals'}, score is {new_score}/100 ({new_band.title()} Risk)."
    }
