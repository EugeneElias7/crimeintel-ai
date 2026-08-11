"""Seed SQLite database from data/seed/*.json — docs/DATABASE_SCHEMA.md §6.

Creates data/crimeintel.db (drops existing content), writes evidence files into
storage/<case_id>/ and records CaseEmbedding rows (index built separately).

Usage:
    python scripts/seed_database.py            # default DB from .env
    python scripts/seed_database.py --reset    # same as default (destructive)
"""

from __future__ import annotations

import argparse
import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SEED_DIR = REPO_ROOT / "data" / "seed"

EVIDENCE_EXT = {
    "document": "txt",
    "image": "png",
    "audio": "txt",
    "video": "txt",
    "object": "txt",
    "other": "txt",
}
EVIDENCE_MIME = {
    "document": "text/plain",
    "image": "image/png",
    "audio": "text/plain",
    "video": "text/plain",
    "object": "text/plain",
    "other": "text/plain",
}
# 1x1 transparent PNG (valid placeholder image)
PNG_BYTES = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000d49444154789c6360000002000100014ba2c82f0000000049454e44ae426082"
)


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def load(name: str) -> list[dict]:
    path = SEED_DIR / name
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed CrimeIntel AI SQLite database from data/seed JSON.")
    parser.add_argument("--reset", action="store_true", help="recreate the database (default behavior)")
    args = parser.parse_args()

    sys.path.insert(0, str(REPO_ROOT))
    from sqlalchemy import create_engine, event
    from sqlalchemy.orm import Session

    from backend.app.config import settings
    from backend.app.models import (
        Base,
        AuditLog,
        Case,
        CaseEvent,
        CasePerson,
        CrimaConversation,
        CrimaMessage,
        Evidence,
        Notification,
        Report,
        User,
    )

    engine = create_engine(settings.database_url)
    if settings.database_url.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def _fk_on(dbapi_conn, _):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.close()

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    from passlib.context import CryptContext

    crypt = CryptContext(schemes=["bcrypt"], deprecated="auto")
    DEMO_PASSWORD = "pass1234"

    users = load("users.json")
    cases = load("cases.json")
    persons = load("case_persons.json")
    evidence = load("evidence.json")
    events = load("case_events.json")
    conversations = load("crima_conversations.json")
    messages = load("crima_messages.json")
    audit = load("audit_logs.json")
    notifications = load("notifications.json")
    reports = load("reports.json")

    now = iso_now()
    with Session(engine) as session:
        for u in users:
            session.add(User(
                username=u["username"], full_name=u["full_name"], email=u["email"],
                role=u["role"], password_hash=crypt.hash(DEMO_PASSWORD),
                is_active=1, last_login_at=now, created_at=now, updated_at=now,
            ))
        session.flush()

        storage_root = Path(settings.storage_root)
        for c in cases:
            session.add(Case(
                case_number=c["case_number"], title=c["title"], description=c["description"],
                category=c["category"], district=c["district"], locality=c["locality"],
                status=c["status"], priority=c["priority"],
                reported_at=c["reported_at"], occurred_at=c["occurred_at"],
                resolved_at=c["resolved_at"], created_by=c["created_by"],
                assigned_to=c.get("assigned_to"),
                created_at=now, updated_at=now,
            ))
        session.flush()
        case_ids_by_number = {c.case_number: c.id for c in session.query(Case)}

        for p in persons:
            session.add(CasePerson(case_id=p["case_id"], role=p["role"], full_name=p["full_name"],
                                   alias=p["alias"], age=p["age"], gender=p["gender"],
                                   contact=p["contact"], address=p["address"],
                                   statement=p["statement"], notes=p["notes"], status=p["status"],
                                   created_at=now, updated_at=now))

        ev_file_count = 0
        for ev in evidence:
            ext = EVIDENCE_EXT[ev["evidence_type"]]
            mime = EVIDENCE_MIME[ev["evidence_type"]]
            fname = f"{uuid.uuid4().hex[:12]}_{ev['name'].replace(' ', '_')}.{ext}"
            case_dir = storage_root / str(ev["case_id"])
            case_dir.mkdir(parents=True, exist_ok=True)
            fpath = case_dir / fname
            if ev["evidence_type"] == "image":
                fpath.write_bytes(PNG_BYTES)
            else:
                fpath.write_text(f"CrimeIntel AI demo evidence placeholder ({ev['name']}).\n", encoding="utf-8")
            session.add(Evidence(
                case_id=ev["case_id"], name=ev["name"], description=ev["description"],
                evidence_type=ev["evidence_type"],
                storage_path=str(fpath.resolve()), file_size=fpath.stat().st_size,
                mime_type=mime, uploaded_by=ev["uploaded_by"], created_at=now, updated_at=now,
            ))
            ev_file_count += 1

        for e in events:
            session.add(CaseEvent(case_id=e["case_id"], user_id=e["user_id"],
                                  event_type=e["event_type"], description=e["description"],
                                  occurred_at=e["occurred_at"], created_at=now))

        for conv in conversations:
            session.add(CrimaConversation(id=conv["id"], user_id=conv["user_id"], title=conv["title"],
                                          created_at=conv["created_at"], updated_at=conv["updated_at"]))
        for m in messages:
            session.add(CrimaMessage(id=m["id"], conversation_id=m["conversation_id"], role=m["role"],
                                     content=m["content"], intent=m.get("intent"),
                                     confidence=m.get("confidence"), sources=m.get("sources"),
                                     feedback=m.get("feedback"), created_at=m["created_at"]))

        for a in audit:
            session.add(AuditLog(user_id=a["user_id"], action=a["action"], entity_type=a["entity_type"],
                                 entity_id=a["entity_id"], details=a["details"],
                                 ip_address=a["ip_address"], created_at=a["created_at"]))

        for n in notifications:
            session.add(Notification(user_id=n["user_id"], title=n["title"], message=n["message"],
                                     notification_type=n["notification_type"], is_read=n["is_read"],
                                     created_at=n["created_at"]))

        for r in reports:
            session.add(Report(title=r["title"], report_type=r["report_type"], params=r["params"],
                               file_path=r.get("file_path"), created_by=r["created_by"],
                               status=r["status"], created_at=r["created_at"],
                               completed_at=r.get("completed_at")))

        session.commit()
        print(f"Seeded {len(users)} users, {len(cases)} cases, {len(persons)} persons, "
              f"{ev_file_count} evidence files, {len(events)} events, {len(messages)} crima messages.")
        print(f"Database: {settings.database_url}")
        print(f"Storage:  {storage_root}")
        print(f"Demo users (password: {DEMO_PASSWORD}): {', '.join(u['username'] for u in users)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
