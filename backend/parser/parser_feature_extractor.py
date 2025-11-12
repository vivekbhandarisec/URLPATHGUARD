from kafka import KafkaConsumer, KafkaProducer
import json
import re
import ast
import time
from colorama import Fore, Style, init

init(autoreset=True)  # Color reset after each print

# ---------------- Kafka Setup ----------------
consumer = KafkaConsumer(
    'clean_logs',
    bootstrap_servers='localhost:9092',
    auto_offset_reset='earliest',
    group_id='urlpathguard-parser',
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda x: json.dumps(x).encode('utf-8')
)

print(Fore.CYAN + "\n🧩 Parser & Feature Extraction Layer Started...")
print(Fore.YELLOW + "Listening to 'clean_logs' topic...\n")

# ---------------- Feature Extraction Functions ----------------
def extract_url_features(url):
    # Extract path, query params, and suspicious patterns
    features = {}
    if not url or url == "N/A":
        return features

    # Path extraction
    path_match = re.match(r"^(?:https?://)?[^/]+(/.*)?$", url)
    features["path"] = path_match.group(1) if path_match and path_match.group(1) else "/"

    # Query params
    query = re.findall(r"[?&](\w+)=([^&]+)", url)
    if query:
        features["query_params"] = dict(query)

    # Suspicious payload patterns
    if re.search(r"(?:union|select|alert|script|drop|insert|or\s+1=1)", url, re.I):
        features["possible_attack"] = True
    else:
        features["possible_attack"] = False

    return features


def extract_payload_features(payload):
    # Extract keywords or JSON fields from payload
    features = {}
    if payload and payload != "N/A":
        try:
            data = ast.literal_eval(payload)
            if isinstance(data, dict):
                features["payload_keys"] = list(data.keys())
        except Exception:
            # Look for typical POST data fields
            features["payload_fields"] = re.findall(r"(\w+)=([^&]+)", payload)
    return features


def extract_header_features(user_agent):
    headers = {}

    # ✅ Ensure not None or empty
    if not user_agent or user_agent == "N/A":
        headers["client_type"] = "Unknown"
        return headers

    ua = str(user_agent)  # Convert just in case

    if "Mozilla" in ua:
        headers["client_type"] = "Browser"
    elif "curl" in ua.lower():
        headers["client_type"] = "CLI tool"
    else:
        headers["client_type"] = "Unknown"

    return headers


# ---------------- Main Consumer Loop ----------------
try:
    for message in consumer:
        record = message.value

        # Extract features
        url_features = extract_url_features(record.get("url"))
        payload_features = extract_payload_features(record.get("payload"))
        header_features = extract_header_features(record.get("protocol"))

        parsed_record = {
            **record,
            **url_features,
            **payload_features,
            **header_features,
            "extracted_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        # Send parsed output to Kafka
        producer.send('parsed_logs', value=parsed_record)

        # ------------ Pretty Terminal Output ------------
        print(Fore.GREEN + "\n✅ Parsed & Forwarded Record → 'parsed_logs'")
        print(Fore.CYAN + json.dumps(parsed_record, indent=2))
        print(Style.DIM + "--------------------------------------------")

except KeyboardInterrupt:
    print(Fore.RED + "\n🛑 Parser stopped by user. Exiting gracefully...")
