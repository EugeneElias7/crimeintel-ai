import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status

from middleware.auth_middleware import get_current_user, require_role
from middleware.rate_limiter import rate_limiter
from models.common import SuccessResponse
from models.user import LoginRequest, LoginResponse, UserProfileResponse
from services.auth_service import AuthService
from adapters.db import db, auth

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

auth_service = AuthService(db=db, auth_adapter=auth)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register new officer account (public)",
)
async def register(body: dict):
    # Frontend sends: full_name, email, employee_id, department, designation, password, confirm_password
    from datetime import datetime as _dt
    import hashlib as _hashlib
    from utils.helpers import generate_uuid as _gen

    full_name = (body.get("full_name") or body.get("display_name") or "").strip()
    email = (body.get("email") or "").strip()
    employee_id = (body.get("employee_id") or body.get("badge_number") or "").strip()
    department = (body.get("department") or "Karnataka State Police").strip()
    designation = (body.get("designation") or "Officer").strip()
    password = body.get("password") or ""
    confirm = body.get("confirm_password") or body.get("confirmPassword") or ""

    if not full_name or not email or not employee_id or not department or not designation:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All fields are required")
    if not password or password != confirm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")
    if len(password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")

    try:
        # Use get_all + manual filter to avoid Catalyst query edge cases
        all_users = await db.get_all("Users") or []
        # Debug: log check
        print(f"[REGISTER] Checking email={email} badge={employee_id} against {len(all_users)} existing users")
        for u in all_users:
            em = str(u.get("email", "")).strip().lower()
            if em == email.lower():
                print(f"[REGISTER] Found duplicate email {em} == {email.lower()}")
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists. Please sign in.")
            bm = str(u.get("badge_number", "")).strip().lower()
            if employee_id and bm == employee_id.lower():
                print(f"[REGISTER] Found duplicate badge {bm} == {employee_id.lower()}")
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee ID already registered. Please sign in.")

        auth_user_id = None
        try:
            if auth and hasattr(auth, "signup"):
                res = await auth.signup(email=email, password=password, display_name=full_name)
                auth_user_id = res.get("user_id") if isinstance(res, dict) else None
        except Exception:
            auth_user_id = None

        user_id = auth_user_id or _gen()
        now = _dt.utcnow().isoformat()
        pwd_hash = _hashlib.sha256(password.encode()).hexdigest()
        # Users table schema uses badge_number for employee_id; department/designation stored in display_name suffix or ignored to avoid missing column error
        row = {
            "ROWID": user_id,
            "user_id": user_id,
            "display_name": full_name,
            "email": email,
            "badge_number": employee_id,
            "role": "officer",
            "phone": body.get("phone") or "",
            "status": "pending_document",
            "password_hash": pwd_hash,
            "created_at": now,
            "updated_at": now,
        }
        # Store department/designation as extra audit detail since ci_Users has no such columns
        await db.insert("Users", row)
        await db.insert("Audit_Logs", {
            "user_id": user_id,
            "action": "user.registered",
            "module": "auth",
            "details": f"New registration {email} ({employee_id})",
            "created_at": now,
        })
        return {"user_id": user_id, "redirect_url": "/verify-identity", "message": "Registration successful. Please proceed to identity verification."}
    except HTTPException:
        raise
    except Exception as e:
        err_str = str(e)
        if "UNIQUE constraint" in err_str or "already exists" in err_str.lower() or "duplicate" in err_str.lower():
            # Handle race where Catalyst remote already has the email but local query didn't find it
            if "email" in err_str.lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists. Please sign in.")
            if "badge" in err_str.lower() or "employee" in err_str.lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee ID already registered. Please sign in.")
        logger.exception("Registration failed: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Registration failed: {err_str}")


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and return JWT token",
)
async def login(request: Request, body: LoginRequest):
    client_ip = _get_client_ip(request)
    if not rate_limiter.check(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
        )
    try:
        result = await auth_service.login(body.email, body.password)
        return LoginResponse(
            access_token=result["access_token"],
            token_type=result["token_type"],
            expires_in=result["expires_in"],
            user=UserProfileResponse(**result["user"]),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Login failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service unavailable.",
        )


@router.post(
    "/logout",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout current user",
)
async def logout(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    try:
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "") if auth_header else ""
        await auth_service.logout(token)
        return SuccessResponse(data=None, message="Logged out successfully.")
    except Exception as e:
        logger.exception("Logout failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed.",
        )


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
)
async def get_me(current_user: dict = Depends(get_current_user)):
    try:
        user = await auth_service.get_current_user(current_user["user_id"])
        return UserProfileResponse(
            user_id=user.get("ROWID", current_user["user_id"]),
            display_name=user.get("display_name", ""),
            email=user.get("email", ""),
            role=user.get("role", ""),
            badge_number=user.get("badge_number"),
            phone=user.get("phone"),
            status=user.get("status", "active"),
            created_at=user.get("created_at", ""),
            updated_at=user.get("updated_at", ""),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to fetch current user: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user profile.",
        )


@router.put(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current user profile (display name, phone, badge)",
)
async def update_me(body: dict, current_user: dict = Depends(get_current_user)):
    try:
        updated = await auth_service.update_profile(current_user["user_id"], body)
        return UserProfileResponse(
            user_id=updated.get("ROWID", current_user["user_id"]),
            display_name=updated.get("display_name", ""),
            email=updated.get("email", ""),
            role=updated.get("role", ""),
            badge_number=updated.get("badge_number"),
            phone=updated.get("phone"),
            status=updated.get("status", "active"),
            created_at=updated.get("created_at", ""),
            updated_at=updated.get("updated_at", ""),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.exception("Failed to update profile: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update profile.")


@router.put(
    "/change-password",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Change password for current user",
)
async def change_password(
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    current_password = body.get("current_password")
    new_password = body.get("new_password")
    confirm_password = body.get("confirm_password")

    if not current_password or not new_password or not confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="current_password, new_password, and confirm_password are required.",
        )
    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="new_password and confirm_password do not match.",
        )
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )

    try:
        await auth_service.change_password(
            current_user["user_id"], current_password, new_password
        )
        return SuccessResponse(data=None, message="Password changed successfully.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Change password failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password.",
        )


@router.post(
    "/reset-password",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Request password reset email",
)
async def reset_password(body: dict):
    email = body.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email is required.",
        )
    try:
        result = await auth_service.reset_password(email)
        return SuccessResponse(
            data={"reset_link": result.get("reset_link"), "reset_token": result.get("reset_token")},
            message=result.get("message", "If the email exists, a password reset link has been sent."),
        )
    except Exception as e:
        logger.exception("Reset password failed: %s", e)
        return SuccessResponse(
            data=None,
            message="If the email exists, a password reset link has been sent.",
        )


@router.post(
    "/reset-password/confirm",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Confirm password reset with token and new password",
)
async def confirm_reset_password(body: dict):
    token = body.get("token")
    new_password = body.get("new_password")
    confirm_password = body.get("confirm_password")
    
    if not token or not new_password or not confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="token, new_password, and confirm_password are required.",
        )
    
    try:
        result = await auth_service.confirm_reset_password(token, new_password, confirm_password)
        return SuccessResponse(data=None, message=result.get("message", "Password reset successful."))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Confirm reset password failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password.",
        )


@router.post(
    "/reset-password/direct",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Direct password reset for demo (no token required)",
)
async def direct_reset_password(body: dict):
    email = body.get("email")
    new_password = body.get("new_password")
    confirm_password = body.get("confirm_password")
    
    if not email or not new_password or not confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email, new_password, and confirm_password are required.",
        )
    
    try:
        result = await auth_service.direct_reset_password(email, new_password, confirm_password)
        return SuccessResponse(data=None, message=result.get("message", "Password reset successful."))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Direct reset password failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password.",
        )
