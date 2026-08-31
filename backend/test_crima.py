import requests
import json

url = "http://127.0.0.1:8000/api/v1/crima/query"
data = {"text": "Show me burglary cases in Bengaluru"}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=data, headers=headers)
print(f"Status: {response.status_code}")
print(json.dumps(response.json(), indent=2))