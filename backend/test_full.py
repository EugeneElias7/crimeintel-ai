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
    
    queries = [
        'Find theft cases in Bengaluru',
        'Tell me about FIR-2024-000151',
        'How many open cases are there?',
        'Show recent fraud cases',
        'I need information about theft cases about Jalhalli and prime suspects',
    ]
    
    for q in queries:
        print(f'\n=== Query: {q} ===')
        result = await crima.process_query(text=q, context=[])
        print(f'Intent: {result.intent}')
        print(f'Response: {result.response[:400]}')
        print(f'Results: {len(result.results)}')
        for r in result.results[:3]:
            print(f'  - {r.case_id}: {r.crime_type} at {r.location} - {r.status} (conf: {r.confidence})')

asyncio.run(test())