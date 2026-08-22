import ollama
import asyncio

async def test():
    client = ollama.AsyncClient(host='http://127.0.0.1:11435')
    result = await client.generate(model='qwen3.5:9b', prompt='test', options={'num_predict': 100}, keep_alive=0)
    print('Done:', result)
    resp = result.get('response', '')
    print('Response:', resp[:200])

asyncio.run(test())