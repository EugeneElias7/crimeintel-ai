import logging
from typing import Union

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from utils.constants import ERROR_CODES, HTTPStatusMessages

logger = logging.getLogger(__name__)


def _build_error_response(
    status_code: int,
    detail: str,
    code: str = None,
    fields: dict = None,
) -> JSONResponse:
    body = {"detail": detail}
    if code:
        body["code"] = code
    if fields:
        body["fields"] = fields
    return JSONResponse(status_code=status_code, content=body)


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    detail = exc.detail or HTTPStatusMessages.get(exc.status_code, "An error occurred")
    code = None
    for key, msg in ERROR_CODES.items():
        if msg == detail or detail.endswith(msg.rstrip(".")):
            code = key
            break
    return _build_error_response(
        status_code=exc.status_code, detail=str(detail), code=code
    )


async def validation_exception_handler(
    request: Request, exc: Union[RequestValidationError, ValidationError]
) -> JSONResponse:
    errors = {}
    if isinstance(exc, RequestValidationError):
        for err in exc.errors():
            loc = ".".join(str(x) for x in err.get("loc", []))
            msg = err.get("msg", "Invalid value")
            if loc:
                errors[loc] = msg
            else:
                errors["_error"] = msg
        detail = "Request validation failed"
    else:
        if hasattr(exc, "errors"):
            for err in exc.errors():
                loc = ".".join(str(x) for x in err.get("loc", []))
                msg = err.get("msg", "Invalid value")
                if loc:
                    errors[loc] = msg
                else:
                    errors["_error"] = msg
        detail = "Data validation failed"

    return _build_error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=detail,
        code="VALIDATION_ERROR",
        fields=errors,
    )


async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    logger.exception("Unhandled exception for %s %s: %s", request.method, request.url, exc)
    return _build_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=ERROR_CODES["INTERNAL_ERROR"],
        code="INTERNAL_ERROR",
    )


def add_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
