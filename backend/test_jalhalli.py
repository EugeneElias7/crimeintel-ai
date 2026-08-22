import asyncio
from adapters.sqlite_db import sqlite_db

async def test():
    all_cases = await sqlite_db.get_all('Cases')
    if not all_cases:
        print('No cases')
        return
    
    theft_jalhalli = []
    for case in all_cases:
        if case.get('crime_type') == 'theft':
            loc = (case.get('location') or '').lower()
            district = (case.get('district') or '').lower()
            if 'jalhalli' in loc or 'jalhalli' in district:
                theft_jalhalli.append(case)
    
    print('Total cases:', len(all_cases))
    print('Theft cases in Jalhalli:', len(theft_jalhalli))
    for c in theft_jalhalli[:5]:
        print(f'  {c.get("case_id")}: {c.get("location")}, {c.get("district")}')

asyncio.run(test())