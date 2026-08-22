import asyncio
from adapters.sqlite_db import sqlite_db

async def test():
    all_cases = await sqlite_db.get_all("Cases")
    if not all_cases:
        print('No cases')
        return
    
    theft_bengaluru = []
    for case in all_cases:
        if case.get("crime_type") != "theft":
            continue
        loc = (case.get("location") or "").lower()
        district = (case.get("district") or "").lower()
        if "bengaluru" in loc or "bengaluru" in district:
            theft_bengaluru.append(case)
    
    print(f'Total cases: {len(all_cases)}')
    print(f'Theft cases in Bengaluru: {len(theft_bengaluru)}')
    for c in theft_bengaluru[:5]:
        print(f'  {c.get("case_id")}: {c.get("location")}, {c.get("district")}')

asyncio.run(test())