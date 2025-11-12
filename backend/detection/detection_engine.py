from kafka import KafkaConsumer, KafkaProducer
import json
import re
import time
from colorama import Fore, Style, init

# Initialize colored output
init(autoreset=True)

print(Fore.CYAN + "\n🧠 Detection Engine Layer Started...")
print(Fore.YELLOW + "Listening to 'parsed_logs' topic for suspicious activity...\n")

# ---------------- Kafka Setup ----------------
try:
    consumer = KafkaConsumer(
        'parsed_logs',
        bootstrap_servers='localhost:9092',
        auto_offset_reset='earliest',  # read all available messages
        group_id='urlpathguard-detector',
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))
    )

    producer = KafkaProducer(
        bootstrap_servers='localhost:9092',
        value_serializer=lambda x: json.dumps(x).encode('utf-8')
    )
except Exception as e:
    print(Fore.RED + f"❌ Kafka Connection Error: {e}")
    exit(1)

# ---------------- Detection Functions ----------------
def detect_sql_injection(url_or_payload):
    patterns = [
        r"(\bunion\b|\bselect\b|\binsert\b|\bdrop\b|\bdelete\b|\bor\s+1=1)",
        r"(\'\s*or\s*\')", r"(;--)", r"(\bupdate\b.*\bset\b)"
    ]
    return any(re.search(p, url_or_payload, re.I) for p in patterns)


def detect_xss_attack(data):
    xss_patterns = [r"<script>", r"alert\(", r"onerror\s*=", r"onload\s*="]
    return any(re.search(p, data, re.I) for p in xss_patterns)


def detect_suspicious_http(record):
    if record.get("status") == "500":
        return "Server Error (HTTP 500)"
    if record.get("method") == "POST" and "upload" in record.get("url", ""):
        return "Unusual File Upload Activity"
    return None


# ---------------- Main Detection Loop ----------------
for message in consumer:
    record = message.value
    url = record.get("url", "")
    payload = record.get("payload", "")
    src_ip = record.get("src_ip", "Unknown")

    print(Fore.BLUE + f"📥 Incoming Record from Parser → {src_ip}")

    # --- Detection Logic ---
    detected_threats = []

    # 1️⃣ SQL Injection
    if detect_sql_injection(url) or detect_sql_injection(payload):
        detected_threats.append("SQL Injection")

    # 2️⃣ XSS Attack
    if detect_xss_attack(url) or detect_xss_attack(payload):
        detected_threats.append("Cross Site Scripting (XSS)")

    # 3️⃣ Suspicious HTTP behaviors
    suspicious = detect_suspicious_http(record)
    if suspicious:
        detected_threats.append(suspicious)

    # Prepare alert record
    alert = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "src_ip": src_ip,
        "url": url,
        "method": record.get("method", "N/A"),
        "status": record.get("status", "N/A"),
        "detected_threats": detected_threats or ["None"],
        "severity": "High" if detected_threats else "Low"
    }

    # Send to Kafka (alerts topic)
    producer.send('alerts', value=alert)

    # --- Terminal Output ---
    if detected_threats:
        print(Fore.RED + "⚠️  ALERT DETECTED!")
        print(Fore.RED + json.dumps(alert, indent=2))
    else:
        print(Fore.GREEN + "✅ Normal traffic. No threat detected.")
        print(Fore.WHITE + json.dumps(alert, indent=2))

    print(Style.DIM + "--------------------------------------------")

