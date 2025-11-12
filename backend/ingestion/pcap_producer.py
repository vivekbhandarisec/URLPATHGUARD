from kafka import KafkaProducer
from scapy.all import rdpcap   #rdpcap used to read and load .pcap files
import json, time     #json is here for converting on data into json 

producer = KafkaProducer(bootstrap_servers='localhost:9092')
 #making a connection with kafka on port 9092

packets = rdpcap("data/traffic.pcap")  

for pkt in packets:
    info = {
        "src": pkt[0][1].src if pkt.haslayer(1) else None,
        "dst": pkt[0][1].dst if pkt.haslayer(1) else None,
        "proto": pkt[0][1].name if pkt.haslayer(1) else None,
        "len": len(pkt)
    }
    producer.send("raw_logs", value=json.dumps(info).encode('utf-8'))
    print("Sent packet:", info)
    time.sleep(0.5)

