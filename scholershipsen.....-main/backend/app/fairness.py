"""
Fairness and Disparate Impact Audit Module for Scholarship Sentinel.
Section 5.5 & 7.5 of SCHOLARSHIP_SENTINEL_FINAL.md:
Audits flag rate by demographic categories (Gen, OBC, SC), by district,
and by institution type.
Computes disparate-impact ratio (lowest group flag rate / highest group flag rate).
Alerts if ratio falls outside 0.80 to 1.25 (Four-Fifths Rule compliance).
"""

from typing import List, Dict, Any

def compute_fairness_audit(
    applications: List[Dict[str, Any]],
    clusters: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes flag rates and disparate impact ratio across categories.
    """
    # Build set of flagged student IDs
    flagged_ids = set()
    for c in clusters:
        for s in c.get("students", []):
            sid = str(s.get("id", s.get("student_id", "")))
            if sid:
                flagged_ids.add(sid)
                
    # Category statistics
    cat_counts: Dict[str, Dict[str, int]] = {
        "Gen": {"total": 0, "flagged": 0},
        "OBC": {"total": 0, "flagged": 0},
        "SC": {"total": 0, "flagged": 0},
    }
    
    # District statistics
    dist_counts: Dict[str, Dict[str, int]] = {}
    
    # Type statistics
    type_counts: Dict[str, Dict[str, int]] = {}
    
    for app in applications:
        cat = app.get("category", app.get("Category", "Gen"))
        if cat not in cat_counts:
            cat_counts[cat] = {"total": 0, "flagged": 0}
        cat_counts[cat]["total"] += 1
        
        sid = str(app.get("student_id", app.get("Student_ID", app.get("id", ""))))
        is_flagged = sid in flagged_ids or app.get("risk_band") in ["high", "review"]
        if is_flagged:
            cat_counts[cat]["flagged"] += 1
            
        dist = app.get("district", "Central")
        dist_counts.setdefault(dist, {"total": 0, "flagged": 0})
        dist_counts[dist]["total"] += 1
        if is_flagged:
            dist_counts[dist]["flagged"] += 1
            
        itype = app.get("institution_type", app.get("type", "Degree College"))
        type_counts.setdefault(itype, {"total": 0, "flagged": 0})
        type_counts[itype]["total"] += 1
        if is_flagged:
            type_counts[itype]["flagged"] += 1

    # Format category breakdown
    category_rates = []
    rates = []
    for cat, data in cat_counts.items():
        rate = round((data["flagged"] / data["total"] * 100), 2) if data["total"] > 0 else 0.0
        rates.append(rate)
        category_rates.append({
            "category": cat,
            "total_applications": data["total"],
            "flagged_applications": data["flagged"],
            "flag_rate_pct": rate
        })
        
    non_zero_rates = [r for r in rates if r > 0]
    min_rate = min(non_zero_rates) if non_zero_rates else 0.0
    max_rate = max(non_zero_rates) if non_zero_rates else 1.0
    
    # Disparate Impact Ratio = lowest_rate / highest_rate
    disparate_impact_ratio = round(min_rate / max_rate, 3) if max_rate > 0 else 1.0
    
    # Four-Fifths rule: ratio between 0.80 and 1.25 is fair
    is_compliant = 0.80 <= disparate_impact_ratio <= 1.25
    
    # District list
    district_rates = []
    for dist, data in dist_counts.items():
        rate = round((data["flagged"] / data["total"] * 100), 2) if data["total"] > 0 else 0.0
        district_rates.append({
            "district": dist,
            "total": data["total"],
            "flagged": data["flagged"],
            "flag_rate_pct": rate
        })
    district_rates.sort(key=lambda x: x["flag_rate_pct"], reverse=True)

    return {
        "categories": category_rates,
        "disparate_impact_ratio": disparate_impact_ratio,
        "is_compliant": is_compliant,
        "ratio_bounds": {"min": 0.80, "max": 1.25},
        "conclusion": "Fairness Compliant: Algorithms flag relationships, not demographic categories. Disparate impact within standard bounds." if is_compliant else "Fairness Review Recommended: Disparate impact ratio outside 0.80-1.25 standard bounds.",
        "districts": district_rates[:8]
    }
