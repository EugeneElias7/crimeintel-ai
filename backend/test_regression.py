from services.intent_service import IntentService
import asyncio

svc = IntentService()

async def test():
    test_queries = [
        ('hi', 'greeting'),
        ('hello', 'greeting'),
        ('theft cases in Jalahalli', 'case_search'),
        ('teft cases in jalhalli', 'case_search'),
        ('how many theft cases in Jalahalli?', 'statistics'),
        ('how many open theft cases in Bangalore?', 'statistics'),
        ('show cases in KR Puram', 'location_query'),
        ('tell me about FIR-2026-000097', 'case_detail'),
        ('what evidence is associated with FIR-2026-000097?', 'evidence_search'),
        ('who are the suspects?', 'suspect_search'),
        ('find similar cases', 'cross_reference'),
        ('how many cases in MG Road?', 'statistics'),
        ('show theft cases near MG Road', 'case_search'),
        ('which district has the highest theft cases?', 'statistics'),
        ('there are no cases in Mars', 'empty_query'),
    ]
    
    all_pass = True
    for q, expected_intent in test_queries:
        intent, entities = await svc.classify(q)
        status = 'PASS' if intent == expected_intent else 'FAIL'
        if status == 'FAIL':
            all_pass = False
        print(f'{status}: "{q}"')
        print(f'  Expected intent: {expected_intent}, Got: {intent}')
        print()
    
    print('=' * 50)
    if all_pass:
        print('ALL 15 TESTS PASSED')
    else:
        print('SOME TESTS FAILED')
    print('=' * 50)

asyncio.run(test())