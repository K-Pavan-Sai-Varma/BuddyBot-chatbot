import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import requests

load_dotenv()
app = Flask(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    prompt = data.get("prompt", "")
    realtime = data.get("realtime", False)

    if realtime:
        return jsonify({"reply": get_realtime_data(prompt)})
    else:
        return jsonify({"reply": get_groq_response(prompt)})

def get_groq_response(prompt):
    try:
        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama3-70b-8192",
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=30
        )
        return res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Groq error: {e}"

def get_realtime_data(prompt):
    try:
        res = requests.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"},
            json={"q": prompt}
        )
        data = res.json()
        if data.get("answerBox"):
            return data["answerBox"].get("answer", "No answer found.")
        elif data.get("organic"):
            return data["organic"][0].get("snippet", "No snippet found.")
        else:
            return "No relevant result found."
    except Exception as e:
        return f"Serper error: {e}"

if __name__ == "__main__":
    app.run()