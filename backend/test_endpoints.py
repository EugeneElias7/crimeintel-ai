import httpx
import asyncio
from main import app

async def test():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url='http://test') as client:
        # Login
        r = await client.post('/api/v1/auth/login', json={'email': 'arun.kumar@ksp.gov.in', 'password': 'Test123'})
        print(f'Login: {r.status_code}')
        print(f'Login body: {r.text}')
        token = r.json()['access_token']
        
        # Test cases
        headers = {'Authorization': f'Bearer {token}'}
        r = await client.get('/api/v1/cases', headers=headers)
        print(f'Cases: {r.status_code}')
        print(f'Cases body: {r.text[:500]}')
        
        # Test analytics
        r = await client.get('/api/v1/analytics/overview', headers=headers)
        print(f'Analytics: {r.status_code}')
        print(f'Analytics body: {r.text[:500]}')
        
        # Test CRIMA
        r = await client.post('/api/v1/crima/query', headers=headers, json={'text': 'Find vehicle theft cases in Bengaluru'})
        print(f'CRIMA: {r.status_code}')
        print(f'CRIMA body: {r.text[:500]}')

asyncio.run(test())