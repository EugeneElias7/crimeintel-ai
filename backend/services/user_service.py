import logging
from typing import Optional

from adapters.catalyst_auth import CatalystAuthAdapter
from adapters.catalyst_db import CatalystDBAdapter
from models.user import UserCreate, UserUpdate
from utils.constants import AUDIT_USER_CREATED, AUDIT_USER_DELETED, AUDIT_USER_UPDATED
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)


class UserService:
    def __init__(
        self, db: CatalystDBAdapter, auth_adapter: Optional[CatalystAuthAdapter] = None
    ) -> None:
        self.db = db
        self.auth = auth_adapter

    async def list_users(
        self,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None,
    ) -> dict:
        all_users = await self.db.get_all("Users")
        if not all_users:
            return {"data": [], "total": 0, "page": page, "pages": 0}

        filtered = []
        for user in all_users:
            if search:
                search_lower = search.lower()
                name = (user.get("display_name") or "").lower()
                email = (user.get("email") or "").lower()
                badge = (user.get("badge_number") or "").lower()
                if search_lower not in name and search_lower not in email and search_lower not in badge:
                    continue
            if role and user.get("role") != role:
                continue
            if status and user.get("status") != status:
                continue
            filtered.append(user)

        total = len(filtered)
        pages = max(1, (total + limit - 1) // limit)
        start = (page - 1) * limit
        end = start + limit
        page_items = filtered[start:end]

        return {"data": page_items, "total": total, "page": page, "pages": pages}

    async def create_user(self, data: UserCreate) -> dict:
        existing = await self.db.query("Users", {"email": data.email})
        if existing:
            raise ValueError(f"User with email {data.email} already exists")

        auth_user_id = None
        if self.auth:
            try:
                signup_result = await self.auth.signup(
                    email=data.email,
                    password=data.password,
                    display_name=data.display_name,
                )
                auth_user_id = signup_result.get("user_id")
            except Exception as e:
                logger.error("Failed to create CatalystAuth user: %s", e)
                raise ValueError("Failed to create authentication user") from e

        user_id = auth_user_id or generate_uuid()

        row_data = {
            "ROWID": user_id,
            "user_id": user_id,
            "display_name": data.display_name,
            "email": data.email,
            "role": data.role,
            "badge_number": data.badge_number,
            "phone": data.phone,
            "status": data.status or "active",
        }

        inserted_id = await self.db.insert("Users", row_data)

        await self.db.insert("Audit_Logs", {
            "user_id": user_id,
            "action": AUDIT_USER_CREATED,
            "module": "users",
            "details": f"Created user {data.email} with role {data.role}",
            "created_at": datetime.utcnow().isoformat(),
        })

        return {**row_data, "ROWID": inserted_id}

    async def update_user(self, user_id: str, data: UserUpdate) -> dict:
        existing = await self.db.get("Users", user_id)
        if not existing:
            raise ValueError("User not found")

        update_data = data.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return existing

        if "password" in update_data:
            del update_data["password"]

        await self.db.update("Users", user_id, update_data)

        await self.db.insert("Audit_Logs", {
            "user_id": user_id,
            "action": AUDIT_USER_UPDATED,
            "module": "users",
            "details": f"Updated user {user_id} with fields {list(update_data.keys())}",
            "created_at": datetime.utcnow().isoformat(),
        })

        updated = await self.db.get("Users", user_id)
        return updated or existing

    async def disable_user(self, user_id: str) -> None:
        existing = await self.db.get("Users", user_id)
        if not existing:
            raise ValueError("User not found")

        await self.db.update("Users", user_id, {"status": "disabled"})

        await self.db.insert("Audit_Logs", {
            "user_id": user_id,
            "action": AUDIT_USER_DELETED,
            "module": "users",
            "details": f"Disabled user {user_id}",
            "created_at": datetime.utcnow().isoformat(),
        })
