import ollama
import asyncio

async def test():
    client = ollama.AsyncClient(host='http://127.0.0.1:11435')
    # Try without thinking mode
    result = await client.generate(
        model='qwen3.5:9b', 
        prompt='test', 
        options={'num_predict': 100, 'think': False},
        keep_alive=0
    )
    print('Done:', result.get('done'))
    resp = result.get('response', '')
    thinking = result.get('thinking', '')
    print('Response:', resp[:200] if resp else 'EMPTY')
    print('Thinking length:', len(thinking) if thinking else 0)

asyncio.run(test())