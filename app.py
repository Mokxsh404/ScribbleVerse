import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

API_KEY = os.environ.get("HACK_CLUB_API_KEY")
API_URL = "https://ai.hackclub.com/proxy/v1/chat/completions"

@app.route("/")
def home():
    return "ScribbleVerse API running"

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    api_key = data.get("custom_api_key") or API_KEY
    if not api_key:
        return jsonify({"error": "No API key"}), 400
    
    response = requests.post(
        API_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json=data["payload"]
    )
    return jsonify(response.json()), response.status_code

if __name__ == '__main__':
    app.run(port=5000, debug=True)
