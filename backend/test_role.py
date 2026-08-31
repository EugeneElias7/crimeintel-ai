import requests
import json

url = 'http://127.0.0.1:8000/api/v1/auth/login'
data = {'email': 'admin@ksp.gov.in', 'password': 'AdminPass123'}
headers = {'Content-Type': 'application/json'}

response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
print(f'Status: {response.status_code}')
data = response.json()
print('Token:', data.get('access_token', '')[:50])
print('User:', data.get('user', {}).get('role'))
print('Full user:', data.get('user'))