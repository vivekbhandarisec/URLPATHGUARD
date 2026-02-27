import re
from urllib.parse import unquote

SQLI_PATTERN = re.compile(
    r"(\bOR\b|\bAND\b)\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+['\"]?"
    r"|union\s+select|select\s+.+\s+from|sleep\s*\(|benchmark\s*\(|"
    r"information_schema|\bwaitfor\b\s+\bdelay\b|--|/\*",
    re.IGNORECASE,
)

XSS_PATTERN = re.compile(
    r"(<script[^>]*>|</script>|javascript:|on\w+\s*=|<svg|<img|<iframe|"
    r"document\.cookie|alert\s*\(|prompt\s*\(|confirm\s*\()",
    re.IGNORECASE,
)

PATH_TRAVERSAL_PATTERN = re.compile(
    r"(\.\./|\.\.\\|%2e%2e%2f|%2e%2e/|%252e%252e%252f|"
    r"/etc/passwd|\\windows\\win\.ini|\\boot\.ini)",
    re.IGNORECASE,
)

CMD_INJECTION_PATTERN = re.compile(
    r"(;|\|\||&&|`|\$\()\s*(cat|ls|id|whoami|uname|wget|curl|bash|sh|powershell|cmd)\b",
    re.IGNORECASE,
)

LFI_RFI_PATTERN = re.compile(
    r"(php:\/\/input|php:\/\/filter|file:\/\/|expect:\/\/|data:text\/html|"
    r"https?:\/\/[^\s]*\.(php|txt|ini)|\/(?:etc\/passwd|proc\/self\/environ))",
    re.IGNORECASE,
)

ADMIN_PROBING_PATTERN = re.compile(
    r"(^|/)(admin|administrator|wp-admin|phpmyadmin|manager|cpanel|controlpanel)(/|$)",
    re.IGNORECASE,
)

SCANNER_UA_PATTERN = re.compile(
    r"(sqlmap|nikto|nmap|acunetix|nessus|dirbuster|wpscan|burpsuite|masscan|zgrab)",
    re.IGNORECASE,
)

AUTH_PATH_PATTERN = re.compile(
    r"(^|/)(login|signin|auth|oauth|admin/login|session|token)(/|$)",
    re.IGNORECASE,
)

FAILED_AUTH_STATUSES = {401, 403, 429}
BRUTE_FORCE_THRESHOLD = 4


def _to_status_code(status):
    try:
        return int(status)
    except (TypeError, ValueError):
        return None


def _multi_decode(value, max_rounds=2):
    decoded = value
    for _ in range(max_rounds):
        next_decoded = unquote(decoded)
        if next_decoded == decoded:
            break
        decoded = next_decoded
    return decoded


def detect_attack(parsed):
    if not parsed:
        return []

    ip, timestamp, method, path, status, user_agent = parsed
    decoded_path = _multi_decode(path)
    status_code = _to_status_code(status)
    normalized_method = (method or "").upper()
    ua = user_agent or ""

    detections = []

    if SQLI_PATTERN.search(decoded_path):
        detections.append(
            {
                "attack_type": "SQL Injection",
                "severity": "High",
                "ip": ip,
                "url": decoded_path,
                "source": "url",
            }
        )

    if XSS_PATTERN.search(decoded_path):
        detections.append(
            {
                "attack_type": "Cross-Site Scripting",
                "severity": "High",
                "ip": ip,
                "url": decoded_path,
                "source": "url",
            }
        )

    if PATH_TRAVERSAL_PATTERN.search(decoded_path):
        detections.append(
            {
                "attack_type": "Path Traversal",
                "severity": "High",
                "ip": ip,
                "url": decoded_path,
                "source": "url",
            }
        )

    if LFI_RFI_PATTERN.search(decoded_path):
        detections.append(
            {
                "attack_type": "LFI/RFI Attempt",
                "severity": "High",
                "ip": ip,
                "url": decoded_path,
                "source": "url",
            }
        )

    if CMD_INJECTION_PATTERN.search(decoded_path) and normalized_method in {"GET", "POST", "PUT", "PATCH"}:
        detections.append(
            {
                "attack_type": "Command Injection",
                "severity": "High",
                "ip": ip,
                "url": decoded_path,
                "source": "url",
            }
        )

    if ADMIN_PROBING_PATTERN.search(decoded_path):
        detections.append(
            {
                "attack_type": "Admin Probing",
                "severity": "Medium" if status_code in {401, 403, 404} else "Low",
                "ip": ip,
                "url": decoded_path,
                "source": "url",
            }
        )

    if SCANNER_UA_PATTERN.search(ua):
        detections.append(
            {
                "attack_type": "Suspicious Scanner User-Agent",
                "severity": "Medium",
                "ip": ip,
                "url": decoded_path,
                "source": "user_agent",
            }
        )

    return detections


def is_failed_auth_attempt(parsed):
    if not parsed:
        return False

    ip, timestamp, method, path, status, user_agent = parsed
    decoded_path = _multi_decode(path)
    status_code = _to_status_code(status)

    if method.upper() not in {"POST", "PUT", "PATCH"}:
        return False

    if not AUTH_PATH_PATTERN.search(decoded_path):
        return False

    return status_code in FAILED_AUTH_STATUSES


def detect_bruteforce(parsed_records):
    failed_attempts_by_ip = {}

    for parsed in parsed_records:
        if not is_failed_auth_attempt(parsed):
            continue

        ip, timestamp, method, path, status, user_agent = parsed
        failed_attempts_by_ip[ip] = failed_attempts_by_ip.get(ip, 0) + 1

    detections = []
    for ip, attempts in failed_attempts_by_ip.items():
        if attempts >= BRUTE_FORCE_THRESHOLD:
            detections.append(
                {
                    "attack_type": "Brute Force",
                    "severity": "High",
                    "ip": ip,
                    "url": "multiple auth endpoints",
                    "source": "behavior",
                    "attempts": attempts,
                }
            )

    return detections
