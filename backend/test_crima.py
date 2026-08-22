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
    result = await crima.process_query(text="vehicle theft Bengaluru", context=[])
    print(f'Intent: {result.intent}')
    print(f'Response: {result.response[:200]}')
    print(f'Results: {len(result.results)}')
    print(f'Confidence: {result.confidence_avg}')

asyncio.run(test())