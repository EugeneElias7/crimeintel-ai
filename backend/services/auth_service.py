import logging
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta

from adapters.catalyst_auth import CatalystAuthAdapter
from adapters.catalyst_db import CatalystDBAdapter
from config import settings
from middleware.auth_middleware import create_access_token, decode_access_token
from utils.constants import AUDIT_USER_LOGIN, AUDIT_USER_LOGOUT

logger = logging.getLogger(__name__)

RESET_TOKEN_EXPIRY_HOURS = 1


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

        # Enforce verification: block login if not yet approved by admin
        # Allow login for active/approved, also for admin/super_admin bypass
        user_status_raw = (user.get("status") or "active").lower()
        # Normalize: pending variants and rejected should block
        blocked_statuses = {"pending", "pending_verification", "pending_document", "rejected", "suspended", "disabled"}
        role_lower = (user.get("role") or "").lower()
        is_privileged = role_lower in ("admin", "super_admin")
        if user_status_raw in blocked_statuses and not is_privileged:
            if user_status_raw == "rejected":
                raise ValueError("Account has been rejected. Contact administrator.")
            elif user_status_raw in ("pending_verification", "pending_document", "pending"):
                raise ValueError("Account pending verification. Admin approval required before login.")
            else:
                raise ValueError(f"Account status '{user.get('status')}' does not allow login. Contact administrator.")

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

    async def update_profile(self, user_id: str, data: dict) -> dict:
        user = await self.db.get("Users", user_id)
        if not user:
            raise ValueError("User not found")
        update_data = {}
        if data.get("display_name") is not None:
            v = str(data.get("display_name")).strip()
            if not v:
                raise ValueError("Display name cannot be empty")
            update_data["display_name"] = v
        if "phone" in data:
            update_data["phone"] = str(data.get("phone") or "").strip()
        if "badge_number" in data:
            update_data["badge_number"] = str(data.get("badge_number") or "").strip()
        if not update_data:
            raise ValueError("No fields to update")
        update_data["updated_at"] = datetime.utcnow().isoformat()
        await self.db.update("Users", user_id, update_data)
        await self.db.insert("Audit_Logs", {
            "user_id": user_id,
            "action": "user.profile_updated",
            "module": "auth",
            "details": f"Profile updated fields {list(update_data.keys())}",
            "created_at": datetime.utcnow().isoformat(),
        })
        updated = await self.db.get("Users", user_id)
        return updated or {**user, **update_data}

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

    async def reset_password(self, email: str) -> dict:
        """Initiate password reset for a user by email.
        Generates a reset token and returns it for demo purposes.
        In production, this would send a reset link via email.
        """
        # FIX: sqlite_db.get() expects ROWID string, not dict.
        # Use query() with filters dict per sqlite_db.py:132 signature query(table, filters: dict) -> List[dict]
        users = await self.db.query("Users", {"email": email})
        user = users[0] if users else None
        user_id = user.get("ROWID") or user.get("user_id") if user else str(uuid.uuid4())
        
        # Always generate a reset token for demo purposes
        # (In production, would only send to existing users via email)
        reset_token = create_access_token(
            user_id=user_id,
            role="password_reset",
            expires_delta=timedelta(hours=RESET_TOKEN_EXPIRY_HOURS),
        )
        
        reset_link = f"http://localhost:5175/reset-password?token={reset_token}"
        
        # Log the password reset request
        await self.db.insert("Audit_Logs", {
            "user_id": user_id,
            "action": "user.password_reset_requested",
            "module": "auth",
            "details": f"Password reset requested for {email}",
            "created_at": datetime.utcnow().isoformat(),
        })
        
        return {
            "success": True,
            "reset_token": reset_token,
            "reset_link": reset_link,
            "message": "If an account exists with this email, a password reset link has been sent."
        }

    async def confirm_reset_password(self, token: str, new_password: str, confirm_password: str) -> dict:
        """Confirm password reset with token and new password."""
        if new_password != confirm_password:
            raise ValueError("Passwords do not match")
        
        if len(new_password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        try:
            payload = decode_access_token(token)
        except Exception:
            raise ValueError("Invalid or expired reset token")
        
        if payload.get("role") != "password_reset":
            raise ValueError("Invalid reset token")
        
        user_id = payload.get("user_id")
        if not user_id:
            raise ValueError("Invalid reset token")
        
        user = await self.db.get("Users", user_id)
        if not user:
            raise ValueError("User not found")
        
        # Hash the new password
        password_hash = hashlib.sha256(new_password.encode()).hexdigest()
        
        # Update user's password
        await self.db.update("Users", user_id, {
            "password_hash": password_hash,
            "updated_at": datetime.utcnow().isoformat()
        })
        
        # Log the password reset completion
        await self.db.insert("Audit_Logs", {
            "user_id": user_id,
            "action": "user.password_reset_completed",
            "module": "auth",
            "details": f"Password reset completed for {user.get('email', 'unknown')}",
            "created_at": datetime.utcnow().isoformat(),
        })
        
        return {
            "success": True,
            "message": "Password has been reset successfully. You can now login with your new password."
        }

    async def direct_reset_password(self, email: str, new_password: str, confirm_password: str) -> dict:
        """Direct password reset for demo purposes.
        Bypasses token verification - resets password for given email.
        In production, this would require proper authentication.
        """
        if new_password != confirm_password:
            raise ValueError("Passwords do not match")
        
        if len(new_password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        print("[DIRECT RESET] email received:", email)
        # FIX: sqlite_db.get() expects ROWID string (sqlite_db.py:47), not dict.
        # Correct signature per sqlite_db.py:132 is query(table: str, filters: dict) -> List[dict]
        users = await self.db.query("Users", {"email": email})
        user = users[0] if users else None
        print("[DIRECT RESET] user lookup result type:", type(user))
        print("[DIRECT RESET] user lookup successful:", bool(user))
        user_id = user.get("ROWID") or user.get("user_id") if user else str(uuid.uuid4())
        
        # Hash the new password
        password_hash = hashlib.sha256(new_password.encode()).hexdigest()
        
        if user:
            # Update existing user's password
            await self.db.update("Users", user_id, {
                "password_hash": password_hash,
                "updated_at": datetime.utcnow().isoformat()
            })
        else:
            # Create new user for demo purposes
            now = datetime.utcnow().isoformat()
            from utils.helpers import generate_uuid
            new_user_id = generate_uuid()
            await self.db.insert("Users", {
                "ROWID": new_user_id,
                "user_id": new_user_id,
                "display_name": email.split("@")[0].title() if "@" in email else "Demo User",
                "email": email,
                "password_hash": password_hash,
                "role": "officer",
                "badge_number": "",
                "phone": "",
                "status": "active",
                "created_at": now,
                "updated_at": now,
            })
            user_id = new_user_id
        
        # Log the password reset
        await self.db.insert("Audit_Logs", {
            "user_id": user_id,
            "action": "user.password_reset_direct",
            "module": "auth",
            "details": f"Direct password reset for {email}",
            "created_at": datetime.utcnow().isoformat(),
        })
        
        return {
            "success": True,
            "message": "Password has been reset successfully. You can now login with your new password."
        }