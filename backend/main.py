import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

try:
    from .detection import detect_attack, detect_bruteforce
    from .parser import parse_log
except ImportError:
    # Allows running with `uvicorn main:app` from backend directory.
    from detection import detect_attack, detect_bruteforce
    from parser import parse_log

app = FastAPI()

origins_from_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
allowed_origins = [origin.strip() for origin in origins_from_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALERT_STORE = []
LAST_UPDATED_UTC = datetime.now(timezone.utc)


def _multi_decode(value, rounds=2):
    decoded = value or ""
    for _ in range(rounds):
        next_decoded = unquote(decoded)
        if next_decoded == decoded:
            break
        decoded = next_decoded
    return decoded


def _parse_timestamp(raw):
    if not raw:
        return datetime.now(timezone.utc)

    for fmt in ("%d/%b/%Y:%H:%M:%S %z", "%d/%b/%Y:%H:%M:%S"):
        try:
            parsed = datetime.strptime(raw, fmt)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            continue

    return datetime.now(timezone.utc)


def _seed_risk(severity):
    level = (severity or "Low").lower()
    if level == "critical":
        return 95
    if level == "high":
        return 78
    if level == "medium":
        return 52
    return 22


def _severity_from_risk(risk_score):
    if risk_score >= 90:
        return "Critical"
    if risk_score >= 70:
        return "High"
    if risk_score >= 40:
        return "Medium"
    return "Low"


def _shape_alert(event, parsed, index):
    ip, timestamp, method, path, status, user_agent = parsed
    decoded_url = _multi_decode(path)

    risk_score = event.get("risk_score")
    if risk_score is None:
        risk_score = _seed_risk(event.get("severity"))

    severity = event.get("severity") or _severity_from_risk(risk_score)

    return {
        "id": f"{ip}-{index}",
        "timestamp": _parse_timestamp(timestamp).isoformat(),
        "source_ip": ip,
        "country": "Unknown",
        "method": (method or "GET").upper(),
        "url_path": path,
        "decoded_url": decoded_url,
        "attack_type": event.get("attack_type", "Unknown"),
        "severity": severity,
        "status_code": int(status) if str(status).isdigit() else status,
        "risk_score": risk_score,
        "triggered_rule": event.get("attack_type", "Unknown"),
        "raw_payload": decoded_url,
        "full_http_request": f"{method} {path} HTTP/1.1",
        "user_agent": user_agent,
        "source": event.get("source", "url"),
    }


def _analyze_lines(lines):
    parsed_records = []
    attack_events = []

    for line in lines:
        parsed = parse_log(line)
        if not parsed:
            continue

        parsed_records.append(parsed)

        for event in detect_attack(parsed):
            attack_events.append((event, parsed))

    brute_force_events = detect_bruteforce(parsed_records)
    for brute_event in brute_force_events:
        matching = [record for record in parsed_records if record[0] == brute_event.get("ip")]
        parsed_ref = matching[-1] if matching else (brute_event.get("ip", "-"), "", "POST", "/login", 401, "")
        enriched = dict(brute_event)
        attempts = brute_event.get("attempts")
        if isinstance(attempts, int):
            enriched["risk_score"] = min(100, 70 + attempts * 5)
        attack_events.append((enriched, parsed_ref))

    alerts = [_shape_alert(event, parsed, idx) for idx, (event, parsed) in enumerate(attack_events, start=1)]
    return alerts


def _load_seed_logs():
    project_root = Path(__file__).resolve().parent.parent
    candidates = [
        project_root / "access.log",
        Path(__file__).resolve().parent / "http_access.log",
    ]

    for candidate in candidates:
        if not candidate.exists():
            continue

        with candidate.open("r", encoding="utf-8", errors="ignore") as file_handle:
            lines = [line.strip() for line in file_handle if line.strip() and not line.strip().startswith("#")]

        alerts = _analyze_lines(lines)
        if alerts:
            return alerts

    return []


def _compute_stats(alerts):
    total_alerts = len(alerts)
    threshold = datetime.now(timezone.utc).timestamp() - 24 * 60 * 60

    alerts_last_24h = sum(
        1
        for item in alerts
        if datetime.fromisoformat(item["timestamp"]).timestamp() >= threshold
    )

    severity_distribution = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    attack_type_breakdown = {}
    top_ip_counts = {}

    for item in alerts:
        sev = item.get("severity", "Low")
        if sev not in severity_distribution:
            severity_distribution["Low"] += 1
        else:
            severity_distribution[sev] += 1

        attack = item.get("attack_type", "Unknown")
        attack_type_breakdown[attack] = attack_type_breakdown.get(attack, 0) + 1

        source_ip = item.get("source_ip", "-")
        top_ip_counts[source_ip] = top_ip_counts.get(source_ip, 0) + 1

    top_attacking_ips = [
        {"ip": ip, "count": count}
        for ip, count in sorted(top_ip_counts.items(), key=lambda pair: pair[1], reverse=True)[:5]
    ]

    return {
        "total_alerts": total_alerts,
        "alerts_last_24h": alerts_last_24h,
        "attack_type_breakdown": attack_type_breakdown,
        "severity_distribution": severity_distribution,
        "top_attacking_ips": top_attacking_ips,
    }


@app.on_event("startup")
def startup_seed_data():
    global ALERT_STORE, LAST_UPDATED_UTC
    ALERT_STORE = _load_seed_logs()
    LAST_UPDATED_UTC = datetime.now(timezone.utc)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/system-status")
def system_status():
    return {
        "status": "ok",
        "service": "urlpathguard-backend",
        "alerts_loaded": len(ALERT_STORE),
        "last_updated": LAST_UPDATED_UTC.isoformat(),
    }


@app.get("/api/alerts")
def get_alerts():
    return ALERT_STORE


@app.get("/api/alerts/{alert_id}")
def get_alert(alert_id: str):
    alert = next((item for item in ALERT_STORE if str(item.get("id")) == str(alert_id)), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    previous_activity = [
        {
            "id": item["id"],
            "timestamp": item["timestamp"],
            "attack_type": item["attack_type"],
            "url_path": item["url_path"],
            "severity": item["severity"],
            "risk_score": item["risk_score"],
        }
        for item in ALERT_STORE
        if item["source_ip"] == alert["source_ip"] and item["id"] != alert["id"]
    ][:10]

    response = dict(alert)
    response["previous_activity"] = previous_activity
    return response


@app.get("/api/stats")
def get_stats():
    return _compute_stats(ALERT_STORE)


@app.post("/upload-log")
@app.post("/api/upload-log")
async def upload_log(file: UploadFile = File(...)):
    global ALERT_STORE, LAST_UPDATED_UTC

    contents = await file.read()
    lines = [
        line.strip()
        for line in contents.decode("utf-8", errors="ignore").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]

    alerts = _analyze_lines(lines)

    ALERT_STORE = alerts
    LAST_UPDATED_UTC = datetime.now(timezone.utc)

    return {
        "filename": file.filename,
        "total_requests": len(lines),
        "total_attacks": len(alerts),
        "events": alerts,
        "message": "Log analyzed successfully",
    }
