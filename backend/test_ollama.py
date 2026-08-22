import requests
import json

url = "http://127.0.0.1:11435/api/generate"
data = {
    "model": "qwen3.5:9b",
    "prompt": "test",
    "stream": False
}

response = requests.post(url, json=data)
print(f"Status: {response.status_code}")
result = response.json()
resp = result.get('response', '')
# Write to file to avoid encoding issues
with open('ollama_response.txt', 'w', encoding='utf-8') as f:
    f.write(resp[:500])
print(f"Response length: {len(resp)}")
print(f"First 100 chars (safe): {resp[:100].encode('ascii', 'ignore').decode()}")