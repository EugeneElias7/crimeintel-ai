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
    
    # First check what intent and entities are extracted
    intent, entities = await IntentService().classify('Find theft cases in Bengaluru')
    print(f'Intent: {intent}')
    print(f'Entities: {entities}')
    
    # Now test structured retrieval directly with those entities
    result = await crima._structured_retrieval(
        crime_type=entities.get('crime_type'),
        locations=entities.get('locations', []),
        persons=entities.get('persons', []),
        date_ref=entities.get('date_ref'),
        k=10
    )
    print(f'Structured results: {len(result)}')
    for case, score in result[:5]:
        print(f'  - {case.get("case_id")}: {case.get("crime_type")} at {case.get("location")}, {case.get("district")} - {case.get("status")} (score: {score})')

asyncio.run(test())