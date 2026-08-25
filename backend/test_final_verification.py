from services.intent_service import IntentService
import asyncio

svc = IntentService()

async def test():
    test_queries = [
        'Crime in hebal',
        'Thft in Hebbal',
        'Hebbal cases',
        'Murder in hebal',
        'Murder in habala',
        'Theft cases in kurumangala',
        'Kurmnagala cases',
        'Crime in hubli',
        'Murder',
        'Vijanagar',
        'Crime in hubli',
        'Crime in hubly',
        'Crime in vijanagar',
        'Crime in vijaynagar',
        'Crime in kurumangala',
        'Crime in kurmnagala',
        'thft in Hebbal',
        'murdar in Hebbal',
        'robry in Hebbal',
    ]
    
    for q in test_queries:
        intent, entities = await svc.classify(q)
        print(f'Query: "{q}"')
        print(f'  Intent: {intent}, Entities: {entities}')
        print()

asyncio.run(test())