import logging
import mimetypes
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse

from middleware.auth_middleware import get_current_user, require_role
from models.common import PaginatedResponse, SuccessResponse
from models.user import UserCreate, UserResponse, UserUpdate
from services.user_service import UserService
from services.audit_service import AuditService
from adapters.db import db, auth

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Administration"])

user_service = UserService(db=db, auth_adapter=auth)
audit_service = AuditService(db=db)

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


@router.get(
    "/users/{user_id}/verification",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Get verification details for a user",
)
async def get_user_verification(
    user_id: str,
    current_user: dict = Depends(_admin_role),
):
    try:
        user = await db.get("Users", user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        # Check id proof storage
        from pathlib import Path
        storage_path = Path(__file__).parent.parent / "storage" / "verification_documents" / str(user_id)
        id_proof_attached = storage_path.exists() and any(storage_path.iterdir()) if storage_path.exists() else False
        file_name = None
        file_path = None
        if id_proof_attached:
            try:
                files = list(storage_path.iterdir())
                if files:
                    file_name = files[0].name
                    file_path = str(files[0])
            except Exception:
                pass
        status_raw = (user.get("status") or "active").lower()
        verification_status = "NOT_SUBMITTED"
        if id_proof_attached:
            if status_raw in ("pending_verification", "pending"):
                verification_status = "PENDING"
            elif status_raw in ("active", "approved"):
                verification_status = "VERIFIED"
            elif status_raw == "rejected":
                verification_status = "REJECTED"
            else:
                verification_status = "PENDING"
        file_type = None
        file_url = None
        if file_name:
            file_type = mimetypes.guess_type(file_name)[0] or "application/octet-stream"
            file_url = f"/api/v1/admin/users/{user_id}/verification/file"
        return SuccessResponse(data={
            "user_id": user_id,
            "verification_status": verification_status,
            "id_proof_attached": id_proof_attached,
            "id_proof_file_name": file_name,
            "id_proof_file_path": file_path,
            "id_proof_file_type": file_type,
            "id_proof_file_url": file_url,
            "account_status": user.get("status"),
        }, message="Verification details retrieved.")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to get verification for %s: %s", user_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve verification.")


@router.get(
    "/users/{user_id}/verification/file",
    summary="Download/view uploaded ID proof file",
)
async def get_user_verification_file(
    user_id: str,
    current_user: dict = Depends(_admin_role),
):
    # Also allow the user themselves to view their own proof
    try:
        user = await db.get("Users", user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        # Check multiple possible storage locations (mirrors get_user_verification)
        candidates = [
            Path(__file__).parent.parent / "storage" / "verification_documents" / str(user_id),
            Path(__file__).parent.parent / "storage" / "verification_documents" / f"user_{user_id}",
        ]
        if isinstance(user_id, str) and user_id.startswith("usr_"):
            try:
                _num = user_id.split("_")[1].lstrip("0") or "0"
                candidates.append(Path(__file__).parent.parent / "storage" / "verification_documents" / f"user_{_num}")
            except Exception:
                pass
        file_path = None
        for cand in candidates:
            if cand.exists() and cand.is_dir():
                try:
                    files = [p for p in cand.iterdir() if p.is_file()]
                    if files:
                        # Prefer most recent
                        files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
                        file_path = files[0]
                        break
                except Exception:
                    continue
        if not file_path or not file_path.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No ID proof found for this user")
        media_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        return FileResponse(path=str(file_path), filename=file_path.name, media_type=media_type)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to serve verification file for %s: %s", user_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve file")


@router.patch(
    "/users/{user_id}/verification",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Approve or reject user verification",
)
async def update_user_verification(
    user_id: str,
    body: dict,
    current_user: dict = Depends(_admin_role),
):
    try:
        status_val = (body.get("status") or body.get("verification_status") or "").upper()
        reason = body.get("reason")
        if status_val not in ("VERIFIED", "APPROVED", "REJECTED", "PENDING"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="status must be VERIFIED, REJECTED or PENDING")
        user = await db.get("Users", user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        # Map verification status to account status
        new_status = "active"
        verification_status = status_val
        if status_val in ("VERIFIED", "APPROVED"):
            new_status = "active"
            verification_status = "VERIFIED"
        elif status_val == "REJECTED":
            new_status = "rejected"
            verification_status = "REJECTED"
        elif status_val == "PENDING":
            new_status = "pending_verification"
        from datetime import datetime
        await db.update("Users", user_id, {"status": new_status, "updated_at": datetime.utcnow().isoformat()})
        await db.insert("Audit_Logs", {
            "user_id": current_user.get("user_id", "admin"),
            "action": "user.verification_updated",
            "module": "admin",
            "details": f"Verification {verification_status} for {user_id} reason: {reason or ''}",
            "created_at": datetime.utcnow().isoformat(),
        })
        updated = await db.get("Users", user_id)
        # Re-check actual ID proof attachment rather than hard-coding True
        from pathlib import Path as _Path
        _check_paths = [
            _Path(__file__).parent.parent / "storage" / "verification_documents" / str(user_id),
            _Path(__file__).parent.parent / "storage" / "verification_documents" / f"user_{user_id}",
        ]
        if isinstance(user_id, str) and user_id.startswith("usr_"):
            try:
                _num = user_id.split("_")[1].lstrip("0") or "0"
                _check_paths.append(_Path(__file__).parent.parent / "storage" / "verification_documents" / f"user_{_num}")
            except Exception:
                pass
        _actually_attached = any(p.exists() and any(p.iterdir()) for p in _check_paths if p.exists())
        _file_name = None
        for p in _check_paths:
            if p.exists() and any(p.iterdir()):
                try:
                    _file_name = list(p.iterdir())[0].name
                    break
                except Exception:
                    pass
        return SuccessResponse(data={**updated, "verification_status": verification_status, "id_proof_attached": _actually_attached, "id_proof_file_name": _file_name}, message=f"Verification {verification_status} successfully.")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update verification for %s: %s", user_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update verification.")


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
    search: Optional[str] = Query(default=None, description="Search across action/module/details"),
    date_from: Optional[str] = Query(default=None, description="Alt from date"),
    date_to: Optional[str] = Query(default=None, description="Alt to date"),
):
    try:
        filters = {}
        if user_id:
            filters["user_id"] = user_id
        if action:
            filters["action"] = action
        if module:
            filters["module"] = module
        # support both alias 'from' and legacy 'date_from'
        effective_from = from_date or date_from
        effective_to = to_date or date_to
        if effective_from:
            filters["date_from"] = effective_from
        if effective_to:
            filters["date_to"] = effective_to
        if search:
            filters["search"] = search

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
        records = await db.get_all("System_Config")
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
            existing = await db.query("System_Config", {"config_key": key})
            if existing:
                rec = existing[0]
                rid = rec.get("ROWID") or rec.get("config_id")
                if rid:
                    await db.update("System_Config", rid, {"config_value": str(value)})
            else:
                from utils.helpers import generate_uuid
                from datetime import datetime
                await db.insert("System_Config", {
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
