from kafka import KafkaProducer
import pandas as pd  #pandas is for reading and loading csv file
import json , time

producer = KafkaProducer(bootstrap_servers='localhost:9092')

df = pd.read_csv("data/ipdr.csv")

for _, row in df.iterrows():  #this loop will go through from all the details in a row
    record = row.to_dict()    #it will convert all the table rows in dictionary form
    producer.send("raw_logs", value=json.dumps(record).encode('utf-8'))
    print("Sent IPDR:", record)
    time.sleep(0.5)