"""Insert placeholder admin account into local SQLite DB (idempotent)."""
import asyncio
import hashlib
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from adapters.sqlite_db import sqlite_db

ADMIN_EMAIL = "admin@cromaAI.in"
ADMIN_PASSWORD = "admin1234"


async def main() -> None:
    await sqlite_db._ensure_initialized()
    existing = await sqlite_db.query("Users", {"email": ADMIN_EMAIL})
    if existing:
        print("Admin already exists:", existing[0].get("ROWID"))
        return

    from utils.helpers import generate_uuid
    from datetime import datetime

    now = datetime.utcnow().isoformat()
    user_id = generate_uuid()
    await sqlite_db.insert("Users", {
        "ROWID": user_id,
        "user_id": user_id,
        "display_name": "System Administrator",
        "email": ADMIN_EMAIL,
        "password_hash": hashlib.sha256(ADMIN_PASSWORD.encode()).hexdigest(),
        "role": "super_admin",
        "badge_number": "",
        "phone": "",
        "status": "active",
        "created_at": now,
        "updated_at": now,
    })
    print("Admin inserted:", user_id)


asyncio.run(main())
