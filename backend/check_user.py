import asyncio
from adapters.sqlite_db import sqlite_db

async def test():
    await sqlite_db._ensure_initialized()
    users = await sqlite_db.query('Users', {'email': 'arun.kumar@ksp.gov.in'})
    print(f'Users found: {len(users)}')
    for u in users:
        print(f'  User: {u.get("email")}')
        print(f'  Hash: {u.get("password_hash", "")[:40]}...')
        print(f'  Status: {u.get("status")}')
        print(f'  Role: {u.get("role")}')

asyncio.run(test())