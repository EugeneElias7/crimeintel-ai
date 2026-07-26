import logging
from datetime import datetime
from typing import Any, Dict, Optional

from adapters.catalyst_db import CatalystDBAdapter
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)


class AuditService:
    def __init__(self, db: CatalystDBAdapter) -> None:
        self.db = db

    async def log(
        self,
        user_id: str,
        action: str,
        module: str,
        details: Optional[Any] = None,
        ip_address: Optional[str] = None,
    ) -> None:
        now = datetime.utcnow().isoformat()
        log_id = generate_uuid()

        await self.db.insert("Audit_Logs", {
            "ROWID": log_id,
            "log_id": log_id,
            "user_id": user_id,
            "action": action,
            "module": module,
            "details": str(details) if details is not None else None,
            "ip_address": ip_address or "",
            "timestamp": now,
            "created_at": now,
        })

    async def get_logs(
        self,
        page: int = 1,
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None,
    ) -> dict:
        all_logs = await self.db.get_all("Audit_Logs")
        if not all_logs:
            return {"data": [], "total": 0, "page": page, "pages": 0}

        filters = filters or {}
        filtered = []
        for log_entry in all_logs:
            action = filters.get("action")
            if action and log_entry.get("action") != action:
                continue

            module = filters.get("module")
            if module and log_entry.get("module") != module:
                continue

            user_id = filters.get("user_id")
            if user_id and log_entry.get("user_id") != user_id:
                continue

            date_from = filters.get("date_from")
            if date_from:
                ts = log_entry.get("timestamp", "")
                if ts < date_from:
                    continue

            date_to = filters.get("date_to")
            if date_to:
                ts = log_entry.get("timestamp", "")
                if ts > date_to:
                    continue

            filtered.append(log_entry)

        filtered.sort(key=lambda l: l.get("timestamp", ""), reverse=True)

        total = len(filtered)
        pages = max(1, (total + limit - 1) // limit)
        start = (page - 1) * limit
        end = start + limit
        page_items = filtered[start:end]

        enriched = []
        for entry in page_items:
            uid = entry.get("user_id", "")
            actor_name = uid
            if uid:
                try:
                    user = await self.db.get("Users", uid)
                    if user:
                        actor_name = user.get("display_name", uid)
                except Exception:
                    pass

            enriched.append({
                "log_id": entry.get("log_id") or entry.get("ROWID"),
                "action": entry.get("action"),
                "actor_id": uid,
                "actor_name": actor_name,
                "resource_type": entry.get("module", ""),
                "resource_id": "",
                "details": entry.get("details"),
                "timestamp": entry.get("timestamp", ""),
            })

        return {"data": enriched, "total": total, "page": page, "pages": pages}
