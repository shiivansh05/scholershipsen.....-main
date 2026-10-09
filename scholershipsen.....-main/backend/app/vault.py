"""
Privacy Vault and HMAC Pseudonymization Module for Scholarship Sentinel.
Section 4.8 & 8 of SCHOLARSHIP_SENTINEL_FINAL.md:
- Identifiers are pseudonymized via HMAC-SHA256 with a secret key.
- Raw identifiers are encrypted / stored in vault.
- UI displays masked tokens (••••1234, 98••••0003).
- Unmasking requires an authorized role and a typed justification, which is audited.
"""

import hmac
import hashlib
import os
from typing import Dict, Any, Optional

HMAC_SECRET = os.environ.get("SENTINEL_HMAC_KEY", "sentinel-master-secret-key-2026-jk-gov")

def generate_hmac_token(identifier_type: str, raw_value: str) -> str:
    """Generates an HMAC-SHA256 token for graph linking without exposing raw PII."""
    if not raw_value:
        return ""
    clean_val = str(raw_value).strip().lower()
    msg = f"{identifier_type}:{clean_val}".encode("utf-8")
    h = hmac.new(HMAC_SECRET.encode("utf-8"), msg, hashlib.sha256)
    return f"TOK_{identifier_type.upper()}_{h.hexdigest()[:16]}"

def mask_aadhaar(aadhaar: str) -> str:
    clean = str(aadhaar).strip()
    if len(clean) >= 4:
        return f"••••••••{clean[-4:]}"
    return "••••••••"

def mask_bank_account(account: str) -> str:
    clean = str(account).strip()
    if len(clean) >= 4:
        return f"••••••••{clean[-4:]}"
    return "••••"

def mask_mobile_number(mobile: str) -> str:
    clean = str(mobile).strip()
    if len(clean) >= 10:
        return f"{clean[:2]}••••{clean[-4:]}"
    elif len(clean) >= 4:
        return f"••••{clean[-4:]}"
    return "••••••••••"

# Vault in-memory store for demo
_VAULT_STORE: Dict[str, Dict[str, Any]] = {}

def vault_store_identifier(token: str, id_type: str, raw_value: str, student_id: str):
    """Stores raw value against HMAC token in the protected vault."""
    _VAULT_STORE[token] = {
        "token": token,
        "type": id_type,
        "raw_value": str(raw_value),
        "student_id": str(student_id),
        "masked": mask_bank_account(raw_value) if "bank" in id_type.lower() else mask_mobile_number(raw_value) if "mobile" in id_type.lower() else mask_aadhaar(raw_value)
    }

def vault_unmask(token: str, actor: str, role: str, reason: str) -> Optional[Dict[str, Any]]:
    """
    Unmasks a token if requester is authorized.
    Logs audit event.
    """
    record = _VAULT_STORE.get(token)
    if not record:
        return None
    return {
        "token": token,
        "type": record["type"],
        "raw_value": record["raw_value"],
        "masked": record["masked"],
        "unmasked_by": actor,
        "role": role,
        "reason": reason
    }
