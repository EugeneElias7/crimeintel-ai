import logging
import mimetypes
import os
from datetime import datetime
from pathlib import Path
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

        # Enrich with verification / id_proof metadata to avoid N+1 frontend calls
        enriched = []
        for u in page_items:
            uid = u.get("user_id") or u.get("ROWID") or u.get("id")
            status_raw = (u.get("status") or "active").lower()
            # Map account_status for UI
            status_map = {
                "active": "ACTIVE",
                "approved": "ACTIVE",
                "pending_document": "PENDING",
                "pending_verification": "PENDING",
                "pending": "PENDING",
                "rejected": "REJECTED",
                "suspended": "SUSPENDED",
                "disabled": "DISABLED",
            }
            account_status = status_map.get(status_raw, status_raw.upper())
            # Check id proof storage
            id_proof_attached = False
            id_proof_file_name = None
            id_proof_file_type = None
            id_proof_file_url = None
            verification_status = "NOT_SUBMITTED"
            if uid:
                # New SQLite storage
                storage_path = Path(__file__).parent.parent / "storage" / "verification_documents" / str(uid)
                # Legacy storage with user_ prefix
                alt_path = Path(__file__).parent.parent / "storage" / "verification_documents" / f"user_{uid}"
                check_paths = [storage_path, alt_path]
                # Also try numeric extraction for usr_001 -> 1
                if isinstance(uid, str) and uid.startswith("usr_"):
                    try:
                        num = uid.split("_")[1].lstrip("0") or "0"
                        check_paths.append(Path(__file__).parent.parent / "storage" / "verification_documents" / f"user_{num}")
                    except Exception:
                        pass
                for p in check_paths:
                    if p.exists() and any(p.iterdir()):
                        id_proof_attached = True
                        try:
                            files = [ff for ff in p.iterdir() if ff.is_file()]
                            if files:
                                files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
                                id_proof_file_name = files[0].name
                                id_proof_file_type = mimetypes.guess_type(files[0].name)[0] or "application/octet-stream"
                                id_proof_file_url = f"/api/v1/admin/users/{uid}/verification/file"
                        except Exception:
                            pass
                        break
                if id_proof_attached:
                    if status_raw in ("pending_verification", "pending"):
                        verification_status = "PENDING"
                    elif status_raw in ("active", "approved"):
                        verification_status = "VERIFIED"
                    elif status_raw == "rejected":
                        verification_status = "REJECTED"
                    else:
                        verification_status = "PENDING"
                else:
                    verification_status = "NOT_SUBMITTED" if status_raw in ("pending_document", "active") else "NOT_SUBMITTED"
            enriched.append({
                **u,
                "id": uid,
                "user_id": uid,
                "full_name": u.get("display_name") or u.get("full_name") or u.get("email", "").split("@")[0],
                "username": u.get("username") or u.get("display_name", "").lower().replace(" ", "_") or u.get("email", "").split("@")[0],
                "employee_id": u.get("badge_number") or u.get("employee_id") or "",
                "department": u.get("department") or "Karnataka State Police",
                "designation": u.get("designation") or u.get("role") or "Officer",
                "account_status": account_status,
                "verification_status": verification_status,
                "id_proof_attached": id_proof_attached,
                "id_proof_file_name": id_proof_file_name,
                "id_proof_file_type": id_proof_file_type,
                "id_proof_file_url": id_proof_file_url,
                "is_active": u.get("status") not in ("disabled", "suspended", "rejected"),
                # Keep original for compatibility
                "status": account_status,
            })
        return {"data": enriched, "total": total, "page": page, "pages": pages}

    async def create_user(self, data: UserCreate) -> dict:
        # Manual check to avoid Catalyst query edge cases (case sensitivity, missing index)
        all_users = await self.db.get_all("Users") or []
        for u in all_users:
            if str(u.get("email", "")).strip().lower() == str(data.email).strip().lower():
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

        # Hard delete so user disappears from list and does not reappear on refresh
        try:
            await self.db.delete("Users", user_id)
        except Exception:
            # Fallback to status update if hard delete not supported
            await self.db.update("Users", user_id, {"status": "disabled", "updated_at": datetime.utcnow().isoformat()})

        # Also clean up verification documents if any
        try:
            from pathlib import Path as _P
            for p in [
                _P(__file__).parent.parent / "storage" / "verification_documents" / str(user_id),
                _P(__file__).parent.parent / "storage" / "verification_documents" / f"user_{user_id}",
            ]:
                if p.exists():
                    import shutil
                    shutil.rmtree(str(p), ignore_errors=True)
        except Exception:
            pass

        await self.db.insert("Audit_Logs", {
            "user_id": user_id,
            "action": AUDIT_USER_DELETED,
            "module": "users",
            "details": f"Disabled/deleted user {user_id}",
            "created_at": datetime.utcnow().isoformat(),
        })
