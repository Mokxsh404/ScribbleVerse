import os
from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return "ScribbleVerse backend running!"

if __name__ == '__main__':
    app.run(port=5000, debug=True)
