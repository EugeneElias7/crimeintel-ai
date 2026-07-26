import logging
from datetime import datetime
from typing import Optional

from adapters.catalyst_db import CatalystDBAdapter
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: CatalystDBAdapter) -> None:
        self.db = db

    async def get_notifications(
        self, user_id: str, unread_only: bool = False
    ) -> dict:
        all_notifs = await self.db.query("Notifications", {"user_id": user_id})

        if not all_notifs:
            return {"data": [], "unread_count": 0, "total": 0}

        all_notifs.sort(key=lambda n: n.get("created_at", ""), reverse=True)

        if unread_only:
            all_notifs = [n for n in all_notifs if not n.get("is_read", False)]

        unread_count = sum(
            1 for n in all_notifs if not n.get("is_read", False)
        )

        processed = [
            {
                "notification_id": n.get("notification_id") or n.get("ROWID"),
                "user_id": n.get("user_id"),
                "type": n.get("type"),
                "message": n.get("message"),
                "link": n.get("link"),
                "is_read": n.get("is_read", False),
                "created_at": n.get("created_at", ""),
            }
            for n in all_notifs
        ]

        return {
            "data": processed,
            "unread_count": unread_count,
            "total": len(all_notifs),
        }

    async def mark_read(self, notification_id: str, user_id: str) -> None:
        notif = await self.db.get("Notifications", notification_id)
        if not notif:
            raise ValueError("Notification not found")

        if notif.get("user_id") != user_id:
            raise ValueError("Notification does not belong to this user")

        await self.db.update("Notifications", notification_id, {"is_read": True})

    async def mark_all_read(self, user_id: str) -> None:
        all_notifs = await self.db.query("Notifications", {"user_id": user_id})
        if not all_notifs:
            return

        for notif in all_notifs:
            nid = notif.get("ROWID") or notif.get("notification_id")
            if nid and not notif.get("is_read", False):
                await self.db.update("Notifications", nid, {"is_read": True})

    async def create_notification(
        self,
        user_id: str,
        notification_type: str,
        message: str,
        link: Optional[str] = None,
    ) -> None:
        notif_id = generate_uuid()
        now = datetime.utcnow().isoformat()

        await self.db.insert("Notifications", {
            "ROWID": notif_id,
            "notification_id": notif_id,
            "user_id": user_id,
            "type": notification_type,
            "message": message,
            "link": link or "",
            "is_read": False,
            "created_at": now,
        })
