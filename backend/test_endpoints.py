import sys
sys.path.insert(0, '.')
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Test health
response = client.get('/api/v1/health')
print(f'Health: {response.status_code} - {response.json()}')

# Login
token_resp = client.post('/api/v1/auth/login', json={'email': 'arun.kumar@ksp.gov.in', 'password': 'Test123'}, headers={'Origin': 'http://localhost:5173', 'Referer': 'http://localhost:5173'})
print(f'Login: {token_resp.status_code}')
token = token_resp.json().get('access_token')
headers = {'Authorization': f'Bearer {token}'}

# Test cases
response = client.get('/api/v1/cases', headers={'Authorization': f'Bearer {token}'})
print(f'Cases: {response.status_code} - {response.text[:200]}')

# Test CRIMA
crima_resp = client.post('/api/v1/crima/query', json={'text': 'Find theft cases in Bengaluru'}, headers={'Authorization': f'Bearer {token}'})
print(f'CRIMA: {crima_resp.status_code} - {crima_resp.text[:200]}')