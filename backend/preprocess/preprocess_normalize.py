# backend/preprocess/preprocess_normalize.py
from kafka import KafkaConsumer, KafkaProducer
import json, time, re, signal, sys

# ---------------- Kafka Setup ----------------
consumer = KafkaConsumer(
    'raw_logs',
    bootstrap_servers='localhost:9092',
    auto_offset_reset='earliest',
    group_id='urlpathguard-preprocess',
    value_deserializer=lambda x: x.decode('utf-8')
)

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda x: json.dumps(x).encode('utf-8')
)

seen = set()
processed_count = 0

# ---------------- Apache Log Regex ----------------
log_pattern = re.compile(
    r'(?P<src>\S+) - - \[(?P<timestamp>[^\]]+)\] '
    r'"(?P<method>\S+) (?P<url>\S+) \S+" '
    r'(?P<status_code>\d+) (?P<size>\d+) '
    r'"(?P<referrer>[^"]*)" "(?P<user_agent>[^"]*)"'
)

# ---------------- Graceful Shutdown ----------------
def shutdown(sig=None, frame=None):
    global consumer, producer
    print("\n🛑 Graceful shutdown initiated...")
    try:
        consumer.close()
        producer.close()
        print(f"✅ Total processed messages: {processed_count}")
    except Exception as e:
        print(f"⚠️ Error while closing: {e}")
    finally:
        sys.exit(0)

# Capture Ctrl+C and system kill signals
signal.signal(signal.SIGINT, shutdown)
signal.signal(signal.SIGTERM, shutdown)

# ---------------- Main Processing Loop ----------------
print("🚀 Listening for messages on topic: 'raw_logs' ...\n")

try:
    for msg in consumer:
        raw_line = msg.value.strip()
        if not raw_line or raw_line in ['{}', '']:
            continue

        data = None
        try:
            data = json.loads(raw_line)
        except json.JSONDecodeError:
            match = log_pattern.match(raw_line)
            if match:
                data = match.groupdict()

        if not data:
            print(f"⚠️ Skipping invalid message: {raw_line}")
            continue

        normalized = {
            "timestamp": data.get("timestamp", time.strftime("%Y-%m-%d %H:%M:%S")),
            "src_ip": data.get("src", data.get("src_ip", "N/A")),
            "dst_ip": data.get("dst", data.get("dst_ip", "N/A")),
            "protocol": data.get("proto", data.get("protocol", "HTTP")),
            "method": data.get("method", "N/A"),
            "url": data.get("url", "N/A"),
            "payload": data.get("payload", "N/A"),
            "status": data.get("status", data.get("status_code", "N/A")),
        }

        record_key = json.dumps(normalized, sort_keys=True)
        if record_key not in seen:
            seen.add(record_key)
            producer.send('clean_logs', value=normalized)
            producer.flush()
            processed_count += 1
            print(f"✅ Cleaned & Sent → clean_logs ({processed_count})")
        else:
            print("⏩ Duplicate skipped")

except KeyboardInterrupt:
    shutdown()
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    shutdown()
