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
            "user_id": user_id,
            "action": action,
            "module": module,
            "details": str(details) if details is not None else None,
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
        search = (filters.get("search") or "").lower() if filters.get("search") else None
        # Pre-fetch user map for search on actor_name
        user_map = {}
        if search:
            try:
                all_users = await self.db.get_all("Users")
                for u in all_users or []:
                    uid = u.get("ROWID") or u.get("user_id") or u.get("id")
                    if uid:
                        user_map[uid] = (u.get("display_name") or "").lower()
            except:
                pass

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
                # also allow display_name match via search logic
                # if user_id is display_name, check via user_map
                uid = log_entry.get("user_id","")
                disp = user_map.get(uid, "") if user_map else ""
                if user_id.lower() not in disp and user_id != uid:
                    continue

            ts_raw = log_entry.get("timestamp") or log_entry.get("created_at") or ""
            date_from = filters.get("date_from")
            if date_from and ts_raw and ts_raw < date_from:
                continue

            date_to = filters.get("date_to")
            if date_to and ts_raw and ts_raw > date_to:
                continue

            if search:
                uid = log_entry.get("user_id","")
                disp = user_map.get(uid, "") if user_map else ""
                hay = f"{log_entry.get('action','')} {log_entry.get('module','')} {log_entry.get('details','')} {uid} {disp}".lower()
                if search not in hay:
                    continue

            filtered.append(log_entry)

        filtered.sort(key=lambda l: (l.get("timestamp") or l.get("created_at") or ""), reverse=True)

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
            ts_val = entry.get("timestamp") or entry.get("created_at") or ""
            row_id = entry.get("ROWID") or entry.get("log_id") or ts_val or str(id(entry))
            details_raw = entry.get("details")
            details_str = details_raw if isinstance(details_raw, str) else str(details_raw) if details_raw else ""

            enriched.append({
                "log_id": row_id,
                "action": entry.get("action"),
                "actor_id": uid,
                "actor_name": actor_name,
                "resource_type": entry.get("module", ""),
                "resource_id": "",
                "details": details_str,
                "timestamp": ts_val,
                "user": {"user_id": uid, "display_name": actor_name},
                "module": entry.get("module", ""),
                "ip_address": entry.get("ip_address", "") or "—",
                "created_at": ts_val,
            })

        return {"data": enriched, "total": total, "page": page, "pages": pages}
