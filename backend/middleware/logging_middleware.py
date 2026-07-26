import json
import logging
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from config import settings

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.perf_counter()

        response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000

        user_id = getattr(request.state, "user_id", None)

        log_data = {
            "method": request.method,
            "path": request.url.path,
            "query_string": str(request.url.query) if request.url.query else None,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "user_id": user_id,
            "client_host": request.client.host if request.client else None,
        }

        log_level = logging.INFO if response.status_code < 500 else logging.ERROR
        logger.log(log_level, json.dumps(log_data))

        return response


def setup_logging() -> None:
    log_level = getattr(logging, settings.LOG_LEVEL, logging.INFO)

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.setLevel(log_level)
    uvicorn_access = logging.getLogger("uvicorn.access")
    uvicorn_access.setLevel(log_level)
