import logging
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)


class CatalystAuthAdapter:
    def __init__(self) -> None:
        self._initialized = False
        self._client = None

    async def _ensure_initialized(self) -> None:
        if not self._initialized:
            try:
                from catalyst_sdk import CatalystApp

                self._client = CatalystApp.initialize(
                    {
                        "project_id": settings.CATALYST_PROJECT_ID,
                        "client_id": settings.CATALYST_CLIENT_ID,
                        "client_secret": settings.CATALYST_CLIENT_SECRET,
                    }
                )
                self._initialized = True
                logger.info("CatalystAuthAdapter initialized successfully")
            except Exception as e:
                logger.error("Failed to initialize CatalystAuthAdapter: %s", e)
                raise

    async def login(self, email: str, password: str) -> dict:
        try:
            await self._ensure_initialized()
            auth = self._client.auth()
            result = auth.login(email, password)
            return {
                "access_token": result.get("access_token"),
                "refresh_token": result.get("refresh_token"),
                "expires_in": result.get("expires_in"),
                "user_id": result.get("user_id"),
            }
        except Exception as e:
            logger.error("Catalyst login failed for %s: %s", email, e)
            raise

    async def logout(self, token: str) -> None:
        try:
            await self._ensure_initialized()
            auth = self._client.auth()
            auth.revoke_token(token)
            logger.debug("User logged out successfully")
        except Exception as e:
            logger.error("Catalyst logout failed: %s", e)
            raise

    async def reset_password(self, email: str) -> None:
        try:
            await self._ensure_initialized()
            auth = self._client.auth()
            auth.send_password_reset_email(email)
            logger.debug("Password reset email sent to %s", email)
        except Exception as e:
            logger.error("Catalyst password reset failed for %s: %s", email, e)
            raise

    async def verify_token(self, token: str) -> dict:
        try:
            await self._ensure_initialized()
            auth = self._client.auth()
            result = auth.verify_token(token)
            return {
                "valid": True,
                "user_id": result.get("user_id"),
                "role": result.get("role"),
            }
        except Exception as e:
            logger.error("Catalyst token verification failed: %s", e)
            return {"valid": False, "error": str(e)}

    async def get_user_details(self, user_id: str) -> Optional[dict]:
        try:
            await self._ensure_initialized()
            auth = self._client.auth()
            result = auth.get_user_details(user_id)
            return result
        except Exception as e:
            logger.error("Catalyst get_user_details failed for %s: %s", user_id, e)
            return None

    async def signup(self, email: str, password: str, display_name: str) -> dict:
        try:
            await self._ensure_initialized()
            auth = self._client.auth()
            result = auth.signup(email, password, display_name)
            return {
                "user_id": result.get("user_id"),
                "email": result.get("email"),
                "display_name": result.get("display_name"),
            }
        except Exception as e:
            logger.error("Catalyst signup failed for %s: %s", email, e)
            raise


catalyst_auth = CatalystAuthAdapter()
