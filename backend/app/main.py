from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .models import User, Case, Evidence, CaseEvent, VerificationDocument

app = FastAPI(title="CrimeIntel AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .analytics import router as analytics_router
from .cases import router as cases_router
from .crima import router as crima_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(cases_router, prefix="/api/v1")
app.include_router(crima_router, prefix="/api/v1")


@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
async def root():
    return {"message": "CrimeIntel AI API is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}