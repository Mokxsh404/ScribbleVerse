import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__, static_folder='docs', static_url_path='', template_folder='docs')
CORS(app)

API_KEY = os.environ.get("HACK_CLUB_API_KEY")
API_URL = "https://ai.hackclub.com/proxy/v1/chat/completions"

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    custom_key = data.get("custom_api_key")
    
    api_key = custom_key if (custom_key and custom_key.strip()) else API_KEY

    if not api_key:
        return jsonify({
            "error": {
                "message": "API key is not configured on the server. Please add your key in settings or set HACK_CLUB_API_KEY."
            }
        }), 500

    response = requests.post(
        API_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json=data["payload"],
        timeout=60
    )

    return jsonify(response.json()), response.status_code

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)