import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status

from middleware.auth_middleware import get_current_user, require_role
from middleware.rate_limiter import rate_limiter
from models.common import SuccessResponse
from models.user import LoginRequest, LoginResponse, UserProfileResponse
from services.auth_service import AuthService
from adapters.catalyst_db import catalyst_db
from adapters.catalyst_auth import catalyst_auth

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

auth_service = AuthService(db=catalyst_db, auth_adapter=catalyst_auth)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


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
        await auth_service.reset_password(email)
        return SuccessResponse(
            data=None,
            message="If the email exists, a password reset link has been sent.",
        )
    except Exception as e:
        logger.exception("Reset password failed: %s", e)
        return SuccessResponse(
            data=None,
            message="If the email exists, a password reset link has been sent.",
        )
