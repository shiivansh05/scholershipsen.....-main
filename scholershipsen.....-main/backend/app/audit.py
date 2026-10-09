"""
Tamper-Evident Audit Log Module for Scholarship Sentinel.
Section 5.8 & 8 of SCHOLARSHIP_SENTINEL_FINAL.md:
Append-only log where every entry cryptographically hashes the previous entry.
Provides verify_audit_chain() to prove log integrity or report tampering.
"""

import hashlib
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

# Initial seed audit entries
_AUDIT_LOG: List[Dict[str, Any]] = []

def _compute_hash(prev_hash: str, seq: int, ts: str, actor: str, action: str, target: str, reason: str) -> str:
    content = f"{prev_hash}|{seq}|{ts}|{actor}|{action}|{target}|{reason}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()

def append_audit_entry(actor: str, action: str, target: str, reason: str) -> Dict[str, Any]:
    """Appends a new event to the tamper-evident hash chain."""
    prev_hash = _AUDIT_LOG[-1]["entry_hash"] if _AUDIT_LOG else GENESIS_HASH
    seq = len(_AUDIT_LOG) + 1
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    entry_hash = _compute_hash(prev_hash, seq, ts, actor, action, target, reason)
    entry = {
        "seq": seq,
        "ts": ts,
        "actor": actor,
        "action": action,
        "target": target,
        "reason": reason,
        "prev_hash": prev_hash,
        "entry_hash": entry_hash
    }
    _AUDIT_LOG.append(entry)
    return entry

def verify_audit_chain() -> Dict[str, Any]:
    """
    Recomputes hashes across the entire log chain.
    Returns whether intact, along with detailed status.
    """
    if not _AUDIT_LOG:
        return {"intact": True, "total_entries": 0, "status": "Empty audit chain (Valid)"}
        
    expected_prev = GENESIS_HASH
    for i, entry in enumerate(_AUDIT_LOG):
        # Check previous hash pointer
        if entry["prev_hash"] != expected_prev:
            return {
                "intact": False,
                "broken_at_seq": entry["seq"],
                "error": f"Chain broken at entry #{entry['seq']}: prev_hash mismatch. Expected {expected_prev[:12]}..., got {entry['prev_hash'][:12]}...",
                "status": "TAMPERED - Chain linkage broken"
            }
            
        # Recompute entry hash
        calc_hash = _compute_hash(
            entry["prev_hash"],
            entry["seq"],
            entry["ts"],
            entry["actor"],
            entry["action"],
            entry["target"],
            entry["reason"]
        )
        if calc_hash != entry["entry_hash"]:
            return {
                "intact": False,
                "broken_at_seq": entry["seq"],
                "error": f"Payload tampering detected at entry #{entry['seq']}: hash mismatch. Recorded {entry['entry_hash'][:12]}..., recalculated {calc_hash[:12]}...",
                "status": "TAMPERED - Payload content modified"
            }
        expected_prev = entry["entry_hash"]
        
    return {
        "intact": True,
        "total_entries": len(_AUDIT_LOG),
        "latest_hash": _AUDIT_LOG[-1]["entry_hash"],
        "status": "INTACT - Cryptographic chain fully verified (SHA-256)"
    }

def get_audit_log(limit: int = 50) -> List[Dict[str, Any]]:
    return list(reversed(_AUDIT_LOG[-limit:]))

def tamper_entry_for_demo(seq: int, modified_reason: str) -> bool:
    """Tamper simulation for demo: modifies a past log row to prove chain verification catches it!"""
    for entry in _AUDIT_LOG:
        if entry["seq"] == seq:
            entry["reason"] = modified_reason
            return True
    return False

# Initialize initial entries
if not _AUDIT_LOG:
    append_audit_entry("System Engine", "SYSTEM_START", "NetworkX Cluster Engine", "System initialized with 10,000 synthetic records")
    append_audit_entry("Vikram Sethi (Sr. Zonal Officer)", "ESCALATE", "CL-104", "Forwarded to State Anti-Corruption Bureau with graph topology evidence")
    append_audit_entry("Priya Sharma (Investigator)", "REQUEST_DOCUMENTS", "CL-107", "Issued summons to Principal of Apex Institute for physical register audit")
    append_audit_entry("Amitabh Sen (Nodal Officer)", "ASSIGN_INVESTIGATOR", "CL-111", "Field audit assigned to Rohtak District Inspectorate")
    append_audit_entry("Sunita Patil (Audit Lead)", "VERIFY_RECORDS", "CL-115", "Branch manager confirmed account BA115 opened with single identity")
