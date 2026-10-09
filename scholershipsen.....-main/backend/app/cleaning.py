import re

HONORIFICS = ["mr", "ms", "mrs", "miss", "shri", "smt", "dr", "prof", "km"]

def normalize_name(name: str) -> str:
    if not name or not isinstance(name, str):
        return ""
    name_clean = name.lower().strip()
    words = re.split(r'\s+', name_clean)
    words = [w for w in words if w not in HONORIFICS and len(w) > 0]
    return " ".join(words)

def normalize_mobile(mobile: str) -> str:
    if not mobile:
        return ""
    digits = re.sub(r'\D', '', str(mobile))
    return digits[-10:] if len(digits) >= 10 else digits

def mask_mobile(mobile: str) -> str:
    digits = normalize_mobile(mobile)
    if len(digits) == 10:
        return f"{digits[:2]}••••{digits[-4:]}"
    return digits

def normalize_account(account: str) -> str:
    if not account:
        return ""
    return re.sub(r'\D', '', str(account))

def mask_account(account: str) -> str:
    digits = normalize_account(account)
    if len(digits) >= 4:
        return f"••••{digits[-4:]}"
    return "••••" + digits

def normalize_address(address: str) -> str:
    if not address or not isinstance(address, str):
        return ""
    addr = address.lower().strip()
    addr = re.sub(r'[^\w\s]', ' ', addr)
    addr = re.sub(r'\brd\b', 'road', addr)
    addr = re.sub(r'\bst\b', 'street', addr)
    addr = re.sub(r'\bapt\b', 'apartment', addr)
    addr = re.sub(r'\s+', ' ', addr)
    return addr.strip()
