import logging
from typing import Optional
import hashlib

logger = logging.getLogger(__name__)


class LocalAuthAdapter:
    def __init__(self) -> None:
        self._initialized = False

    async def _ensure_initialized(self) -> None:
        if self._initialized:
            return
        from adapters.sqlite_db import sqlite_db
        await sqlite_db._ensure_initialized()
        self._initialized = True
        logger.info("LocalAuthAdapter initialized successfully")

    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

    def _verify_password(self, password: str, stored_hash: str) -> bool:
        return self._hash_password(password) == stored_hash

    async def login(self, email: str, password: str) -> dict:
        await self._ensure_initialized()
        from adapters.sqlite_db import sqlite_db
        users = await sqlite_db.query("Users", {"email": email})
        if not users:
            raise ValueError("Invalid credentials")

        user = users[0]
        stored_hash = user.get("password_hash", "")
        if not stored_hash or not self._verify_password(password, stored_hash):
            raise ValueError("Invalid credentials")

        return {
            "access_token": "",  # JWT will be created by auth_service
            "user_id": user.get("ROWID") or user.get("user_id"),
        }

    async def logout(self, token: str) -> None:
        # JWT is stateless, no server-side logout needed
        pass

    async def reset_password(self, email: str) -> None:
        await self._ensure_initialized()
        from adapters.sqlite_db import sqlite_db
        users = await sqlite_db.query("Users", {"email": email})
        if users:
            # In a real implementation, send reset email
            logger.debug("Password reset requested for %s", email)

    async def verify_token(self, token: str) -> dict:
        # Token verification is handled by JWT middleware
        return {"valid": True}

    async def get_user_details(self, user_id: str) -> Optional[dict]:
        await self._ensure_initialized()
        from adapters.sqlite_db import sqlite_db
        user = await sqlite_db.get("Users", user_id)
        return user

    async def signup(self, email: str, password: str, display_name: str) -> dict:
        await self._ensure_initialized()
        from adapters.sqlite_db import sqlite_db
        existing = await sqlite_db.query("Users", {"email": email})
        if existing:
            raise ValueError("Email already registered")

        from utils.helpers import generate_uuid
        from datetime import datetime

        user_id = generate_uuid()
        now = datetime.utcnow().isoformat()
        password_hash = self._hash_password(password)

        user_data = {
            "ROWID": user_id,
            "user_id": user_id,
            "display_name": display_name,
            "email": email,
            "password_hash": password_hash,
            "role": "officer",
            "badge_number": "",
            "phone": "",
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }

        await sqlite_db.insert("Users", user_data)
        return {"user_id": user_id, "email": email, "display_name": display_name}


local_auth = LocalAuthAdapter()