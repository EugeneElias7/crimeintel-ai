import asyncio
from services.case_service import CaseService
from adapters.sqlite_db import sqlite_db

async def test():
    service = CaseService(db=sqlite_db)
    result = await service.get_case('FIR-2024-000151')
    print('Case found:', result.get("case_id"))

asyncio.run(test())