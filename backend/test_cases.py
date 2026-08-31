import requests
import json

# Login
login_url = "http://127.0.0.1:8000/api/v1/auth/login"
data = {"email": "admin@ksp.gov.in", "password": "AdminPass123"}
headers = {"Content-Type": "application/json"}

login_response = requests.post(login_url, json=data, headers=headers)
token = login_response.json()["access_token"]

# Test cases endpoint with token
auth_headers = {"Authorization": f"Bearer {token}"}
response = requests.get("http://127.0.0.1:8000/api/v1/cases?page=1&limit=5", headers=auth_headers)
print(f"Cases Status: {response.status_code}")
print(response.json())