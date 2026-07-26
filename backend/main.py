import logging
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from middleware.error_handler import add_exception_handlers
from middleware.csrf_middleware import CSRFMiddleware
from routers import router as api_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="CrimeIntel AI API",
    description="AI-powered crime intelligence platform backend for case management, "
    "evidence tracking, and intelligent querying using CRIMA AI.",
    version="1.0.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(CSRFMiddleware)

app.include_router(api_router, prefix="/api/v1")


@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


add_exception_handlers(app)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "code": "INTERNAL_ERROR"},
    )


@app.on_event("startup")
async def startup_event() -> None:
    logger.info("CrimeIntel AI API started")
    logging.getLogger().info("CrimeIntel AI API started")
