# backend/preprocess/preprocess_consumer.py
from kafka import KafkaConsumer
import json, signal, sys

# ---------------- Kafka Consumer Setup ----------------
consumer = KafkaConsumer(
    'clean_logs',
    bootstrap_servers='localhost:9092',
    auto_offset_reset='earliest',
    group_id='urlpathguard-cleanlog-viewer',
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

def shutdown(sig=None, frame=None):
    print("\n🛑 Graceful shutdown initiated...")
    try:
        consumer.close()
        print("✅ Consumer closed properly.")
    except Exception as e:
        print(f"⚠️ Error while closing consumer: {e}")
    finally:
        sys.exit(0)

signal.signal(signal.SIGINT, shutdown)
signal.signal(signal.SIGTERM, shutdown)

print("📡 Listening to 'clean_logs' topic...\n")

try:
    for message in consumer:
        data = message.value
        print("✅ Clean Log Received:")
        print(json.dumps(data, indent=2))
except KeyboardInterrupt:
    shutdown()
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    shutdown()
