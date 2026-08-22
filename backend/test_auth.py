import asyncio
from adapters.local_auth import local_auth

async def test():
    result = await local_auth.login('arun.kumar@ksp.gov.in', 'Test123')
    print('Login result:', result)

asyncio.run(test())