import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from middleware.auth_middleware import get_current_user, require_role
from models.common import PaginatedResponse, SuccessResponse
from models.user import UserCreate, UserResponse, UserUpdate
from services.user_service import UserService
from services.audit_service import AuditService
from adapters.catalyst_db import catalyst_db
from adapters.catalyst_auth import catalyst_auth

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Administration"])

user_service = UserService(db=catalyst_db, auth_adapter=catalyst_auth)
audit_service = AuditService(db=catalyst_db)

_admin_role = require_role(["admin", "super_admin"])
_super_admin_role = require_role(["super_admin"])


@router.get(
    "/users",
    response_model=PaginatedResponse,
    status_code=status.HTTP_200_OK,
    summary="List all users with optional filters",
)
async def list_users(
    current_user: dict = Depends(_admin_role),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(default=None, description="Search by name, email, or badge"),
    role: Optional[str] = Query(default=None, description="Filter by role"),
    status: Optional[str] = Query(default=None, description="Filter by status"),
):
    try:
        result = await user_service.list_users(
            page=page, limit=limit, search=search, role=role, status=status
        )
        return PaginatedResponse(
            data=result["data"],
            total=result["total"],
            page=result["page"],
            pages=result["pages"],
        )
    except Exception as e:
        logger.exception("Failed to list users: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list users.",
        )


@router.post(
    "/users",
    response_model=SuccessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user",
)
async def create_user(
    body: UserCreate,
    current_user: dict = Depends(_admin_role),
):
    try:
        result = await user_service.create_user(body)
        return SuccessResponse(data=result, message="User created successfully.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to create user: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user.",
        )


@router.put(
    "/users/{user_id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a user",
)
async def update_user(
    user_id: str,
    body: UserUpdate,
    current_user: dict = Depends(_admin_role),
):
    try:
        result = await user_service.update_user(user_id, body)
        return SuccessResponse(data=result, message="User updated successfully.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to update user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user.",
        )


@router.delete(
    "/users/{user_id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Disable a user (super admin only)",
)
async def disable_user(
    user_id: str,
    current_user: dict = Depends(_super_admin_role),
):
    try:
        await user_service.disable_user(user_id)
        return SuccessResponse(data=None, message="User disabled successfully.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to disable user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disable user.",
        )


@router.get(
    "/audit-logs",
    response_model=PaginatedResponse,
    status_code=status.HTTP_200_OK,
    summary="Get audit logs with optional filters",
)
async def get_audit_logs(
    current_user: dict = Depends(_admin_role),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    user_id: Optional[str] = Query(default=None, description="Filter by actor user ID"),
    action: Optional[str] = Query(default=None, description="Filter by action type"),
    module: Optional[str] = Query(default=None, description="Filter by module"),
    from_date: Optional[str] = Query(default=None, alias="from", description="Filter from date (ISO format)"),
    to_date: Optional[str] = Query(default=None, alias="to", description="Filter to date (ISO format)"),
):
    try:
        filters = {}
        if user_id:
            filters["user_id"] = user_id
        if action:
            filters["action"] = action
        if module:
            filters["module"] = module
        if from_date:
            filters["date_from"] = from_date
        if to_date:
            filters["date_to"] = to_date

        result = await audit_service.get_logs(page=page, limit=limit, filters=filters)
        return PaginatedResponse(
            data=result["data"],
            total=result["total"],
            page=result["page"],
            pages=result["pages"],
        )
    except Exception as e:
        logger.exception("Failed to get audit logs: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve audit logs.",
        )


@router.get(
    "/settings",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Get system configuration",
)
async def get_system_settings(
    current_user: dict = Depends(_admin_role),
):
    try:
        records = await catalyst_db.get_all("System_Config")
        config = {}
        for rec in records or []:
            key = rec.get("config_key", "")
            value = rec.get("config_value", "")
            if key:
                config[key] = value

        if not config:
            config = {
                "session_timeout_minutes": "60",
                "password_min_length": "8",
                "max_upload_size_mb": "25",
            }

        return SuccessResponse(data=config, message="System settings retrieved.")
    except Exception as e:
        logger.exception("Failed to get system settings: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve system settings.",
        )


@router.put(
    "/settings",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Update system configuration",
)
async def update_system_settings(
    body: dict,
    current_user: dict = Depends(_admin_role),
):
    allowed_keys = {
        "session_timeout_minutes",
        "password_min_length",
        "max_upload_size_mb",
    }

    try:
        for key, value in body.items():
            if key not in allowed_keys:
                continue
            existing = await catalyst_db.query("System_Config", {"config_key": key})
            if existing:
                rec = existing[0]
                rid = rec.get("ROWID") or rec.get("config_id")
                if rid:
                    await catalyst_db.update("System_Config", rid, {"config_value": str(value)})
            else:
                from utils.helpers import generate_uuid
                from datetime import datetime
                await catalyst_db.insert("System_Config", {
                    "ROWID": generate_uuid(),
                    "config_key": key,
                    "config_value": str(value),
                    "updated_by": current_user["user_id"],
                    "updated_at": datetime.utcnow().isoformat(),
                })

        return SuccessResponse(data=body, message="System settings updated successfully.")
    except Exception as e:
        logger.exception("Failed to update system settings: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update system settings.",
        )
