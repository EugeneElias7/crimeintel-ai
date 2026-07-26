from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None


class SuccessResponse(BaseModel):
    data: Any
    message: str = "ok"


class PaginatedResponse(BaseModel):
    data: List[Any]
    total: int
    page: int
    pages: int
    message: str = "ok"


class AuditLogEntry(BaseModel):
    log_id: str
    action: str
    actor_id: str
    actor_name: str
    resource_type: str
    resource_id: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str
