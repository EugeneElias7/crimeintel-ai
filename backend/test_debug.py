import asyncio
from adapters.sqlite_db import sqlite_db

async def test():
    all_cases = await sqlite_db.get_all('Cases')
    theft_cases = [c for c in all_cases if c.get('crime_type') == 'theft']
    
    loc = 'bangalore'
    matches = []
    for c in theft_cases:
        loc_str = (c.get('location') or '').lower()
        district = (c.get('district') or '').lower()
        if loc in loc_str or loc in district:
            matches.append(c)
    
    print(f'Theft cases matching bangalore: {len(matches)}')
    for c in matches[:5]:
        print(f'  {c.get("case_id")}: {c.get("location")}, {c.get("district")}')

asyncio.run(test())