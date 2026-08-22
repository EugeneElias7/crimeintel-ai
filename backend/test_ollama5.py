import ollama
import asyncio

async def test():
    client = ollama.AsyncClient(host='http://127.0.0.1:11435')
    result = await client.generate(
        model='qwen2.5-coder:1.5b',  # Smaller, faster model
        prompt='Say hello briefly',
        options={'num_predict': 30},
        keep_alive=0
    )
    print('Response:', result.get('response', '')[:200])

asyncio.run(test())