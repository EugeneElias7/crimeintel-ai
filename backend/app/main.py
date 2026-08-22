from fastapi import FastAPI
from .database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CrimeIntel AI API")

from .dashboard import router

app.include_router(router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "CrimeIntel AI API is running"}