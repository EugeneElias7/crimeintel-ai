"""CSRF protection middleware for CrimeIntel AI backend."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from config import settings


class CSRFMiddleware(BaseHTTPMiddleware):
    """Validates Origin header on state-changing requests."""

    ALLOWED_ORIGINS = settings.ALLOWED_ORIGINS if settings.ALLOWED_ORIGINS else []

    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            origin = request.headers.get("origin")
            referer = request.headers.get("referer")

            if origin:
                if origin not in self.ALLOWED_ORIGINS:
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Origin not allowed", "code": "CSRF_ORIGIN_DENIED"}
                    )
            elif referer:
                allowed = False
                for allowed_origin in self.ALLOWED_ORIGINS:
                    if referer.startswith(allowed_origin):
                        allowed = True
                        break
                if not allowed:
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Referer not allowed", "code": "CSRF_REFERER_DENIED"}
                    )

        response = await call_next(request)
        return response
