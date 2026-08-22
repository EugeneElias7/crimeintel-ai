import asyncio
from adapters.sqlite_db import sqlite_db

async def test():
    await sqlite_db._ensure_initialized()
    users = await sqlite_db.query('Users', {'email': 'arun.kumar@ksp.gov.in'})
    print(f'Users found: {len(users)}')
    for u in users:
        print(f'  User: {u.get("email")}, hash: {u.get("password_hash", "")[:20]}...')

asyncio.run(test())