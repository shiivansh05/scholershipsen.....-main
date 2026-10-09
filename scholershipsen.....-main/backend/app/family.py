"""
Family Shield Module for Scholarship Sentinel.
Section 4.2 & 5.2 of SCHOLARSHIP_SENTINEL_FINAL.md:
Detects authentic sibling / household relationships by comparing normalized
parent names (Father_Name, Mother_Name).
Mobile or address sharing within a household is legitimate and cleared,
moving to the "Seen but not flagged" explanation panel.
"""

from typing import List, Dict, Any, Tuple
import re

def normalize_parent_name(name: str) -> str:
    """Normalizes parent name: lowercases, removes honorifics (Smt, Shri, Mr, Mrs, Late), removes extra whitespace."""
    if not name or str(name).lower() == "nan":
        return ""
    val = str(name).strip().lower()
    val = re.sub(r"\b(smt|shri|sh|mr|mrs|ms|late|dr)\b\.?", "", val)
    val = re.sub(r"[^\w\s]", "", val)
    val = re.sub(r"\s+", " ", val).strip()
    return val

def detect_households(records: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Groups students into households based on matching normalized Father and Mother names.
    """
    households: Dict[str, List[Dict[str, Any]]] = {}
    
    for r in records:
        f_norm = normalize_parent_name(r.get("Father_Name", r.get("father_name", "")))
        m_norm = normalize_parent_name(r.get("Mother_Name", r.get("mother_name", "")))
        
        # If at least one parent is known and non-trivial
        if f_norm and m_norm:
            hh_key = f"{f_norm}::{m_norm}"
            households.setdefault(hh_key, []).append(r)
        elif f_norm and len(f_norm) > 4:
            hh_key = f"{f_norm}::single"
            households.setdefault(hh_key, []).append(r)
            
    # Filter to households with 2 or more students (siblings)
    return {k: v for k, v in households.items() if len(v) >= 2}

def evaluate_family_shield(
    students: List[Dict[str, Any]],
    shared_mobile: bool = False,
    shared_address: bool = False
) -> Dict[str, Any]:
    """
    Evaluates whether sharing of mobile/address in a group is explained by legitimate family ties.
    Returns:
    - is_cleared: True if all sharing is legitimate family sharing
    - explanation: Human-readable rationale for "Seen but not flagged"
    - discount_points: Points to subtract from fraud score (-15 if genuine family)
    """
    if len(students) < 2:
        return {"is_cleared": False, "discount_points": 0, "explanation": "Single student"}

    # Check parent pairs
    first = students[0]
    f1 = normalize_parent_name(first.get("Father_Name", first.get("father_name", "")))
    m1 = normalize_parent_name(first.get("Mother_Name", first.get("mother_name", "")))

    all_same_parents = True
    for s in students[1:]:
        f2 = normalize_parent_name(s.get("Father_Name", s.get("father_name", "")))
        m2 = normalize_parent_name(s.get("Mother_Name", s.get("mother_name", "")))
        if not (f1 and f2 and f1 == f2 and (not m1 or not m2 or m1 == m2)):
            all_same_parents = False
            break

    if all_same_parents and f1:
        s_names = ", ".join([s.get("Student_Name", s.get("student_name", "Student")) for s in students])
        s_ids = [str(s.get("Student_ID", s.get("id", ""))) for s in students]
        return {
            "is_cleared": True,
            "discount_points": -15,
            "household_father": f1,
            "household_mother": m1,
            "students": s_ids,
            "explanation": f"Family Shield: legitimate sibling household (Parents: {first.get('Father_Name')} & {first.get('Mother_Name')}). Contact/address sharing cleared without penalty."
        }
    else:
        return {
            "is_cleared": False,
            "discount_points": 0,
            "explanation": "Different parents registered; cross-household identifier sharing."
        }

def find_cleared_sibling_groups(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Scans entire dataset to build the 'Seen but not flagged' list for transparency.
    """
    households = detect_households(records)
    cleared = []
    
    for hh_key, members in households.items():
        s_names = [m.get("Student_Name", m.get("student_name", "Student")) for m in members]
        s_ids = [str(m.get("Student_ID", m.get("id", ""))) for m in members]
        father = members[0].get("Father_Name", members[0].get("father_name", ""))
        mother = members[0].get("Mother_Name", members[0].get("mother_name", ""))
        
        cleared.append({
            "id": f"CLEARED-HH-{len(cleared)+1:02d}",
            "students_count": len(members),
            "student_ids": s_ids,
            "student_names": s_names,
            "parents": f"{father} & {mother}",
            "cleared_reason": f"Siblings, same parents ({father} and {mother}) sharing contact or residence. Family Shield verified.",
            "category": members[0].get("Category", members[0].get("category", "Gen")),
            "status": "Cleared by Family Shield",
            "score": 10,
            "band": "normal"
        })
        
    return cleared
