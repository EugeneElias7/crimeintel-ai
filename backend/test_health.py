from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from middleware.csrf_middleware import CSRFMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
app.add_middleware(CSRFMiddleware)

@app.get('/api/v1/health')
async def health():
    return {'status': 'ok'}

if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8001, log_level='info')