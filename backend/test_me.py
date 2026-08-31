import requests
import json

# Login first
url = 'http://127.0.0.1:8000/api/v1/auth/login'
data = {'email': 'admin@ksp.gov.in', 'password': 'AdminPass123'}
headers = {'Content-Type': 'application/json'}

response = requests.post('http://127.0.0.1:8000/api/v1/auth/login', json=data, headers={'Content-Type': 'application/json'})
print(f'Login Status: {response.status_code}')
data = response.json()
token = data.get('access_token')
print('Token:', data.get('access_token', '')[:50])

# Now test /auth/me
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
r = requests.get('http://127.0.0.1:8000/api/v1/auth/me', headers=headers)
print('Status:', r.status_code)
print('User:', r.json().get('role'))
print('Full user:', json.dumps(r.json(), indent=2))