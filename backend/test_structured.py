import asyncio
from services.crima_service import CRIMAService
from services.intent_service import IntentService
from services.embedding_service import EmbeddingService
from services.faiss_service import FAISSService
from services.context_service import ContextService
from services.case_service import CaseService
from adapters.sqlite_db import sqlite_db

async def test():
    crima = CRIMAService(
        intent_service=IntentService(),
        embedding_service=EmbeddingService(),
        faiss_service=FAISSService(),
        context_service=ContextService(),
        case_service=CaseService(db=sqlite_db),
    )
    result = await crima._structured_retrieval(
        crime_type='theft',
        locations=['Bengaluru'],
        persons=[],
        date_ref=None,
        k=10
    )
    print('Structured results:', len(result))
    for case, score in result[:5]:
        print(f'  - {case.get("case_id")}: {case.get("crime_type")} at {case.get("location")}, {case.get("district")} - {case.get("status")} (score: {score})')

asyncio.run(test())