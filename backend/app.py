# from flask import Flask, jsonify
# import psycopg2

# app = Flask(__name__)

# @app.route('/alerts')
# def get_alerts():
#     conn = psycopg2.connect("dbname=sih user=postgres password=admin")
#     cur = conn.cursor()
#     cur.execute("SELECT * FROM alerts;")
#     rows = cur.fetchall()
#     return jsonify(rows)