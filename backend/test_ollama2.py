import ollama
import asyncio

async def test():
    client = ollama.AsyncClient(host='http://127.0.0.1:11435')
    result = await client.generate(model='qwen3.5:9b', prompt='test', options={'num_predict': 50})
    resp = result.get('response', '')
    print('Response:', resp[:200])

asyncio.run(test())