from kafka import KafkaProducer   #connecting producer to kafka...
import time    #for making little delay after every line...

producer = KafkaProducer(bootstrap_servers='localhost:9092')
   #Connecting with kafka on port 9092 
with open("data/access.log","r") as f:
    for line in f:           #Openning the file and reading every line 1 by 1 
        producer.send("raw_logs",value=line.encode('utf-8'))          #Sending data to a topic rawlogs in kafka 
        print("Sent log:", line.strip())
        time.sleep(0.5)        #Putting gaps between each line sending process...
        