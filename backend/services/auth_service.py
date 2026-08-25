import logging
from datetime import datetime, timedelta

from adapters.catalyst_auth import CatalystAuthAdapter
from adapters.catalyst_db import CatalystDBAdapter
from config import settings
from middleware.auth_middleware import create_access_token
from utils.constants import AUDIT_USER_LOGIN, AUDIT_USER_LOGOUT

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(
        self, db: CatalystDBAdapter, auth_adapter: CatalystAuthAdapter
    ) -> None:
        self.db = db
        self.auth = auth_adapter

    async def login(self, email: str, password: str) -> dict:
        auth_result = await self.auth.login(email, password)
        user_id = auth_result.get("user_id")
        if not user_id:
            raise ValueError("Authentication failed: no user_id returned")

        user = await self.db.get("Users", user_id)
        if not user:
            raise ValueError("User not found in database")

        role = user.get("role", "officer")

        token = create_access_token(
            user_id=user_id,
            role=role,
            expires_delta=timedelta(minutes=settings.JWT_EXPIRY_MINUTES),
        )

        await self.db.insert("Audit_Logs", {
            "user_id": user_id,
            "action": AUDIT_USER_LOGIN,
            "module": "auth",
            "details": f"User {email} logged in",
            "created_at": datetime.utcnow().isoformat(),
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRY_MINUTES * 60,
            "user": {
                "user_id": user.get("ROWID", user_id),
                "display_name": user.get("display_name", ""),
                "email": user.get("email", email),
                "role": role,
                "badge_number": user.get("badge_number"),
                "phone": user.get("phone"),
                "status": user.get("status", "active"),
                "created_at": user.get("created_at", ""),
                "updated_at": user.get("updated_at", ""),
            },
        }

    async def logout(self, token: str) -> None:
        await self.auth.logout(token)

    async def get_current_user(self, user_id: str) -> dict:
        user = await self.db.get("Users", user_id)
        if not user:
            raise ValueError("User not found")
        return user

    async def change_password(
        self, user_id: str, current_password: str, new_password: str
    ) -> None:
        user = await self.db.get("Users", user_id)
        if not user:
            raise ValueError("User not found")

        try:
            await self.auth.login(user.get("email", ""), current_password)
        except Exception as e:
            raise ValueError("Current password is incorrect") from e

        auth_user = await self.auth.get_user_details(user_id)
        if auth_user:
            from catalyst_sdk.exceptions import CatalystError
            try:
                auth_client = auth_user
                auth_obj = getattr(auth_client, "_auth", None) or auth_client
                auth_obj.update_user(user_id, {"password": new_password})
            except CatalystError as e:
                logger.error("Failed to update Catalyst password: %s", e)
                raise ValueError("Failed to update password in authentication system") from e

        await self.db.insert("Audit_Logs", {
            "user_id": user_id,
            "action": "user.password_changed",
            "module": "auth",
            "details": "Password changed",
        })

    async def reset_password(self, email: str) -> None:
        await self.auth.reset_password(email)
