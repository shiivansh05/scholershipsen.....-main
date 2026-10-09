"""
Identifier Forensics Module for Scholarship Sentinel.
Implements:
1. Verhoeff checksum validation for Aadhaar numbers.
2. Length and character format validation for Aadhaar (12 digits).
3. IFSC code structure validation (4 letters, '0', 6 alphanumeric).
4. Sequential identifier run detection (consecutive accounts or mobile numbers).
5. Near-duplicate identifier detection (differing by exactly one digit).
"""

from typing import List, Dict, Any, Tuple
import re

# Verhoeff algorithm lookup tables
_VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]

_VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]

_VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

def validate_verhoeff(num_str: str) -> bool:
    """Validates a numeric string using the Verhoeff checksum algorithm."""
    clean = re.sub(r"\D", "", str(num_str).strip())
    if not clean:
        return False
    c = 0
    for i, digit_char in enumerate(reversed(clean)):
        c = _VERHOEFF_D[c][_VERHOEFF_P[i % 8][int(digit_char)]]
    return c == 0

def compute_verhoeff_checksum(num_str: str) -> int:
    """Computes the Verhoeff check digit for a numeric string."""
    clean = re.sub(r"\D", "", str(num_str).strip())
    c = 0
    for i, digit_char in enumerate(reversed(clean)):
        c = _VERHOEFF_D[c][_VERHOEFF_P[(i + 1) % 8][int(digit_char)]]
    return _VERHOEFF_INV[c]

def validate_aadhaar_format(aadhaar: str) -> Dict[str, Any]:
    """
    Checks if Aadhaar is a 12-digit number and passes Verhoeff checksum.
    Returns status and description.
    """
    clean = re.sub(r"\D", "", str(aadhaar).strip())
    if not clean or clean.lower() == "nan":
        return {"valid": False, "reason": "Missing Aadhaar number"}
    
    if len(clean) != 12:
        return {
            "valid": False,
            "reason": f"Invalid length ({len(clean)} digits, expected 12 digits)",
            "length": len(clean)
        }
    
    is_checksum_valid = validate_verhoeff(clean)
    if not is_checksum_valid:
        return {
            "valid": False,
            "reason": "Failed Verhoeff checksum verification",
            "length": 12
        }
    
    return {"valid": True, "reason": "Valid 12-digit Verhoeff-verified Aadhaar"}

def validate_ifsc_code(ifsc: str) -> Dict[str, Any]:
    """
    Validates IFSC format: 4 letters + '0' + 6 alphanumeric characters.
    e.g. JAKA0KALBAR
    """
    val = str(ifsc).strip().upper()
    pattern = r"^[A-Z]{4}0[A-Z0-9]{6}$"
    if re.match(pattern, val):
        return {"valid": True, "reason": "Valid IFSC format"}
    return {"valid": False, "reason": f"Malformed IFSC code: {val}"}

def detect_sequential_runs(items: List[Dict[str, Any]], field: str, min_run: int = 5) -> List[Dict[str, Any]]:
    """
    Detects runs of consecutive numeric values (e.g., account numbers or phone numbers).
    A hallmark of fabricated/synthetic batches.
    """
    valid_entries = []
    for it in items:
        val_str = re.sub(r"\D", "", str(it.get(field, "")))
        if val_str and len(val_str) >= 6:
            try:
                num = int(val_str)
                valid_entries.append((num, it))
            except ValueError:
                pass
    
    if not valid_entries:
        return []
    
    valid_entries.sort(key=lambda x: x[0])
    runs = []
    current_run = [valid_entries[0]]
    
    for i in range(1, len(valid_entries)):
        prev_num = current_run[-1][0]
        curr_num = valid_entries[i][0]
        
        if curr_num == prev_num + 1:
            current_run.append(valid_entries[i])
        elif curr_num == prev_num:
            # Duplicate, continue
            current_run.append(valid_entries[i])
        else:
            if len(current_run) >= min_run:
                runs.append(current_run)
            current_run = [valid_entries[i]]
            
    if len(current_run) >= min_run:
        runs.append(current_run)
        
    formatted_runs = []
    for r in runs:
        formatted_runs.append({
            "field": field,
            "count": len(r),
            "start": str(r[0][0]),
            "end": str(r[-1][0]),
            "students": [it[1].get("Student_ID", it[1].get("id", "Unknown")) for it in r],
            "description": f"Fabricated sequence run: {len(r)} consecutive {field} values ({r[0][0]} to {r[-1][0]})"
        })
    return formatted_runs

def detect_near_duplicates(items: List[Dict[str, Any]], field: str) -> List[Dict[str, Any]]:
    """
    Detects pairs of identifiers differing by only one digit (Hamming distance 1).
    """
    near_dups = []
    seen = []
    for it in items:
        val_str = re.sub(r"\D", "", str(it.get(field, "")))
        if len(val_str) >= 10:
            seen.append((val_str, it))
            
    for i in range(len(seen)):
        for j in range(i + 1, min(i + 50, len(seen))):
            s1, it1 = seen[i]
            s2, it2 = seen[j]
            if len(s1) == len(s2) and s1 != s2:
                diffs = sum(1 for a, b in zip(s1, s2) if a != b)
                if diffs == 1:
                    near_dups.append({
                        "field": field,
                        "value1": s1,
                        "value2": s2,
                        "student1": it1.get("Student_ID", it1.get("id")),
                        "student2": it2.get("Student_ID", it2.get("id")),
                        "description": f"Near-duplicate {field}: differs by exactly 1 digit"
                    })
    return near_dups

def run_dataset_forensics(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Runs complete forensics suite on a dataset."""
    invalid_aadhaar = []
    invalid_ifsc = []
    
    for r in records:
        sid = r.get("Student_ID", r.get("id", "N/A"))
        sname = r.get("Student_Name", r.get("student_name", "Student"))
        
        # Aadhaar check
        aadhaar = str(r.get("Aadhaar_No", r.get("aadhaar_no", "")))
        if aadhaar and aadhaar.lower() != "nan":
            a_res = validate_aadhaar_format(aadhaar)
            if not a_res["valid"]:
                invalid_aadhaar.append({
                    "student_id": sid,
                    "student_name": sname,
                    "value": aadhaar,
                    "reason": a_res["reason"]
                })
                
        # IFSC check
        ifsc = str(r.get("IFSC_Code", r.get("ifsc", "")))
        if ifsc and ifsc.lower() != "nan":
            i_res = validate_ifsc_code(ifsc)
            if not i_res["valid"]:
                invalid_ifsc.append({
                    "student_id": sid,
                    "student_name": sname,
                    "value": ifsc,
                    "reason": i_res["reason"]
                })
                
    account_runs = detect_sequential_runs(records, "Account_No") or detect_sequential_runs(records, "account_no")
    mobile_runs = detect_sequential_runs(records, "Contact_No") or detect_sequential_runs(records, "phone_no")
    near_dup_accounts = detect_near_duplicates(records, "Account_No") or detect_near_duplicates(records, "account_no")
    
    return {
        "invalid_aadhaar": invalid_aadhaar,
        "invalid_aadhaar_count": len(invalid_aadhaar),
        "invalid_ifsc": invalid_ifsc,
        "invalid_ifsc_count": len(invalid_ifsc),
        "account_sequence_runs": account_runs,
        "mobile_sequence_runs": mobile_runs,
        "near_duplicate_accounts": near_dup_accounts[:10],
        "total_forensics_flags": len(invalid_aadhaar) + len(invalid_ifsc) + len(account_runs) + len(mobile_runs)
    }
