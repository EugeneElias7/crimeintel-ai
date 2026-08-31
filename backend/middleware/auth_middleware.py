import logging
from datetime import datetime, timedelta, timezone
from typing import Callable, List, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from config import settings
from utils.constants import ERROR_CODES

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


def create_access_token(
    user_id: str,
    role: str,
    permissions: Optional[List[str]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
    )
    to_encode = {
        "sub": user_id,
        "role": role,
        "permissions": permissions or [],
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if credentials is None:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=ERROR_CODES["INVALID_CREDENTIALS"],
                headers={"WWW-Authenticate": "Bearer"},
            )
        try:
            scheme, token = auth_header.split(" ", 1)
            if scheme.lower() != "bearer":
                raise ValueError
        except (ValueError, IndexError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=ERROR_CODES["TOKEN_INVALID"],
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        token = credentials.credentials

    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        permissions: list = payload.get("permissions", [])

        if user_id is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=ERROR_CODES["TOKEN_INVALID"],
            )

        request.state.user_id = user_id
        request.state.role = role

        return {
            "user_id": user_id,
            "role": role,
            "permissions": permissions,
        }
    except JWTError as e:
        logger.warning("JWT verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ERROR_CODES["TOKEN_EXPIRED"],
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_role(roles: List[str]) -> Callable:
    async def role_dependency(current_user: dict = Depends(get_current_user)) -> dict:
        # Case-insensitive role check - frontend sends SUPER_ADMIN, backend stores super_admin
        user_role = str(current_user.get("role") or "").lower()
        allowed = [str(r).lower() for r in roles]
        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=ERROR_CODES["FORBIDDEN"],
            )
        return current_user

    return role_dependency


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT access token."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.warning("JWT decode failed: %s", e)
        raise ValueError("Invalid or expired token")
