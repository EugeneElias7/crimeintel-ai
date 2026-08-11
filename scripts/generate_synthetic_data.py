"""Synthetic crime dataset generator — docs/DATABASE_SCHEMA.md §5.

Deterministic (fixed RNG seed). Writes JSON seed files to data/seed/ which are
the committed source of truth; scripts/seed_database.py loads them into SQLite.

All data is FICTIONAL. No real personal information, no real case numbers,
no real contact details.
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SEED_DIR = REPO_ROOT / "data" / "seed"

CASE_COUNT = 320
RNG_SEED = 42

DISTRICTS = (
    "Bengaluru Urban",
    "Bengaluru Rural",
    "Mysuru",
    "Hubballi-Dharwad",
    "Mangaluru",
    "Belagavi",
    "Kalaburagi",
    "Davanagere",
    "Tumakuru",
    "Shivamogga",
    "Udupi",
    "Hassan",
)

CATEGORIES = (
    "theft",
    "burglary",
    "robbery",
    "vehicle_theft",
    "assault",
    "cybercrime",
    "fraud",
    "missing_person",
    "drug_related",
    "murder",
    "other",
)

STATUSES = ("open", "under_investigation", "closed", "archived")
PRIORITIES = ("low", "medium", "high", "critical")
PERSON_ROLES = ("suspect", "victim", "witness")
EVIDENCE_TYPES = ("document", "image", "audio", "video", "object", "other")
EVENT_TYPES = (
    "case_created",
    "note_added",
    "person_added",
    "evidence_added",
    "status_changed",
    "case_closed",
)

DISTRICT_WEIGHTS = (0.26, 0.07, 0.10, 0.09, 0.08, 0.08, 0.06, 0.06, 0.06, 0.06, 0.04, 0.04)
CATEGORY_WEIGHTS = (0.18, 0.12, 0.07, 0.16, 0.10, 0.09, 0.12, 0.06, 0.05, 0.03, 0.02)
STATUS_WEIGHTS = (0.35, 0.20, 0.35, 0.10)
PRIORITY_WEIGHTS = (0.15, 0.40, 0.30, 0.15)
EVIDENCE_TYPE_WEIGHTS = (0.40, 0.35, 0.10, 0.05, 0.05, 0.05)

USERS = [
    {"username": "admin", "full_name": "A. Prakash", "email": "admin@crimeintel.demo", "role": "admin"},
    {"username": "kavya", "full_name": "Kavya Rao", "email": "kavya@crimeintel.demo", "role": "investigator"},
    {"username": "ravi", "full_name": "Ravi Hegde", "email": "ravi@crimeintel.demo", "role": "investigator"},
    {"username": "arjun", "full_name": "Arjun Nair", "email": "arjun@crimeintel.demo", "role": "analyst"},
    {"username": "meera", "full_name": "Meera Iyer", "email": "meera@crimeintel.demo", "role": "viewer"},
    {"username": "sanjay", "full_name": "Sanjay Patil", "email": "sanjay@crimeintel.demo", "role": "admin"},
]

CANONICAL_QUERIES = [
    "Find vehicle theft cases in Bengaluru.",
    "Summarize CASE-1024.",
    "What evidence is associated with CASE-1024?",
    "Find cases similar to CASE-1024.",
    "Which district has the highest number of theft cases?",
]

# --- fictional name/location pools (clearly synthetic) ---
FIRST_NAMES = (
    "Raghavendra", "Shwetha", "Manjunath", "Priya", "Girish", "Nandini", "Prakash", "Sushma",
    "Vikram", "Anitha", "Kiran", "Deepa", "Harish", "Lakshmi", "Mohan", "Rekha", "Naveen",
    "Sneha", "Arvind", "Bhavana", "Chandan", "Divya", "Eshwar", "Fathima", "Ganesh", "Hema",
    "Imran", "Jyothi", "Karthik", "Lavanya", "Mahesh", "Nazia", "Omkar", "Pooja", "Qasim",
    "Rakesh", "Sunitha", "Tejas", "Uma", "Vijay", "Waseem", "Yash", "Zoya",
)
LAST_NAMES = (
    "Kumar", "Naik", "Gowda", "Reddy", "Shetty", "Hegde", "Patil", "Kulkarni", "Desai",
    "Nair", "Menon", "Iyer", "Rao", "Acharya", "Bhat", "Kamat", "Prabhu", "Kini", "Salian",
    "Fernandes", "D'Souza", "Shaikh", "Ansari", "Begum", "Sharma", "Verma", "Singh",
)
LOCALITIES = (
    "Kempanna Layout", "Mallikarjuna Nagar", "Vidyapeeta Circle", "Gopala Road",
    "Srinivasappa Colony", "Basavanagudi Extension", "Raghavendra Block", "Nandini Layout",
    "Bharathi Nagar", "Krishnaraja Extension", "Ashoka Road", "Vijaya Nagar",
    "Siddartha Layout", "Mallige Street", "Sharada Colony", "Lotus Cross",
)
STREETS = ("3rd Main", "4th Cross", "MG Circle", "Railway Station Road", "Market Lane", "Temple Street", "Ring Road")

CATEGORY_DETAILS = {
    "theft": "Complainant reported missing valuables from the premises during the night.",
    "burglary": "House was forcibly entered; cash and jewellery were taken from the bedroom.",
    "robbery": "Two masked persons waylaid the complainant and snatched the valuables at knifepoint.",
    "vehicle_theft": "Two-wheeler parked near the market was reported missing in the evening.",
    "assault": "Victim was attacked by an acquaintance following a dispute; injuries reported.",
    "cybercrime": "Victim was duped through a fake call/social engineering into transferring funds.",
    "fraud": "Fraudulent documents were used to obtain money from the complainant.",
    "missing_person": "Family members reported the person missing from residence.",
    "drug_related": "Contraband substance was seized during a routine patrol check.",
    "murder": "Deceased found at the scene; investigation initiated for homicide.",
    "other": "Miscellaneous incident reported and registered as per procedure.",
}
TITLE_POOL = {
    "theft": ("gold chain snatched at bus stop", "laptop stolen from office cabin", "cycle stolen from school premises"),
    "burglary": ("house break-in at residential layout", "godown burglary at market road"),
    "robbery": ("snatching near railway station", "armed robbery at petrol bunk"),
    "vehicle_theft": ("scooter stolen near market", "motorcycle missing from apartment parking", "car stolen from mall parking"),
    "assault": ("assault during property dispute", "physical attack on market street"),
    "cybercrime": ("online banking fraud via fake link", "KYC update scam on mobile"),
    "fraud": ("investment fraud scheme", "fake insurance agent fraud"),
    "missing_person": ("elderly person missing from home", "teenager missing after tuition"),
    "drug_related": ("ganja seizure at bus stand", "tablet seizure during raid"),
    "murder": ("homicide found near canal", "fatal assault at construction site"),
    "other": ("public nuisance complaint", "fire incident damage report"),
}
EVIDENCE_NAMES = {
    "document": ("FIR copy", "complainant statement", "spot sketch", "seizure memo"),
    "image": ("CCTV frame", "scene photo", "suspect photo", "vehicle photo"),
    "audio": ("call recording", "interrogation audio"),
    "video": ("CCTV footage", "bodycam clip"),
    "object": ("mobile phone", "weapon recovered", "pouch with substance", "laptop"),
    "other": ("clothing sample", "footprint cast"),
}
EVENT_NOTES = (
    "Primary inquiry recorded.",
    "Team visited the scene.",
    "Complainant statement updated.",
    "Follow-up scheduled.",
    "Review of CCTV requested.",
    "Patrol briefing updated.",
)


def iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).astimezone(timezone.utc).isoformat()


def _weighted(rng: random.Random, choices: tuple, weights: tuple):
    return rng.choices(choices, weights=weights, k=1)[0]


def _person(rng: random.Random, role: str) -> dict:
    status = None
    if role == "suspect":
        status = rng.choices(("arrested", "wanted", "detained", "released", None), weights=(0.4, 0.2, 0.2, 0.1, 0.1))[0]
    return {
        "role": role,
        "full_name": f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}",
        "alias": f"{rng.choice(FIRST_NAMES)}" if rng.random() < 0.15 else None,
        "age": rng.randint(18, 65) if rng.random() < 0.9 else None,
        "gender": rng.choices(("M", "F"), weights=(0.6, 0.4))[0],
        "contact": f"98{rng.randint(20000000, 99999999)}" if rng.random() < 0.7 else None,
        "address": f"{rng.randint(1, 420)}, {rng.choice(LOCALITIES)}, {rng.choice(STREETS)}",
        "statement": f"Statement recorded for {role}." if rng.random() < 0.6 else None,
        "notes": None,
        "status": status,
    }


def generate_cases(rng: random.Random, users: list[dict]) -> tuple[list, list, list, list]:
    user_ids = list(range(1, len(users) + 1))
    investigators = [u["username"] for u in users if u["role"] == "investigator"]
    inv_ids = [i + 1 for i, u in enumerate(users) if u["role"] == "investigator"]

    cases, persons, evidence, events = [], [], [], []
    end = datetime.now(timezone.utc)

    for n in range(1, CASE_COUNT + 1):
        case_id = n
        category = _weighted(rng, CATEGORIES, CATEGORY_WEIGHTS)
        district = _weighted(rng, DISTRICTS, DISTRICT_WEIGHTS)
        status = _weighted(rng, STATUSES, STATUS_WEIGHTS)
        priority = _weighted(rng, PRIORITIES, PRIORITY_WEIGHTS)
        occurred_at = end - timedelta(days=rng.randint(0, 720), hours=rng.randint(0, 23))
        reported_at = occurred_at + timedelta(hours=rng.randint(1, 72))
        resolved_at = iso(occurred_at + timedelta(days=rng.randint(5, 90))) if status in ("closed", "archived") else None

        cases.append({
            "id": case_id,
            "case_number": f"CASE-{1000 + n}",
            "title": f"{rng.choice(TITLE_POOL[category])} ({district.split()[0]})" if rng.random() < 0.5 else rng.choice(TITLE_POOL[category]),
            "description": f"{CATEGORY_DETAILS[category]} Location: {rng.choice(LOCALITIES)}, {district}. "
                           f"Primary inquiry report number {rng.randint(1000, 9999)}/2026.",
            "category": category,
            "district": district,
            "locality": rng.choice(LOCALITIES),
            "status": status,
            "priority": priority,
            "reported_at": iso(reported_at),
            "occurred_at": iso(occurred_at),
            "resolved_at": resolved_at,
            "created_by": rng.choice(inv_ids),
            "assigned_to": rng.choice(inv_ids) if rng.random() < 0.7 else None,
        })

        # persons: 0-3 suspects, 0-2 victims, 0-2 witnesses
        for role, lo, hi in (("suspect", 1, 3), ("victim", 1, 2), ("witness", 0, 2)):
            for _ in range(rng.randint(lo, hi)):
                if rng.random() < 0.92:
                    persons.append({"case_id": case_id, **_person(rng, role)})

        # evidence: 1-6 items
        for _ in range(rng.randint(1, 6)):
            etype = _weighted(rng, EVIDENCE_TYPES, EVIDENCE_TYPE_WEIGHTS)
            evidence.append({
                "case_id": case_id,
                "name": rng.choice(EVIDENCE_NAMES[etype]),
                "description": f"Collected during investigation of CASE-{1000 + n}." if rng.random() < 0.6 else None,
                "evidence_type": etype,
                "uploaded_by": rng.choice(user_ids),
            })

        # timeline events: 3-8
        ev_count = rng.randint(3, 8)
        base_time = reported_at
        first = True
        for j in range(ev_count):
            stamp = base_time + timedelta(days=j * rng.randint(1, 7))
            if first:
                etype, desc = "case_created", "Case registered and investigation assigned."
                first = False
            elif status in ("closed", "archived") and j == ev_count - 1:
                etype, desc = "case_closed", "Investigation concluded; case marked closed."
            elif rng.random() < 0.5:
                etype, desc = "note_added", rng.choice(EVENT_NOTES)
            elif rng.random() < 0.3:
                etype, desc = "evidence_added", "Evidence item added to case file."
            else:
                etype, desc = "person_added", "Person of interest added to case."
            events.append({
                "case_id": case_id,
                "user_id": rng.choice(inv_ids),
                "event_type": etype,
                "description": desc,
                "occurred_at": iso(stamp),
            })

    return cases, persons, evidence, events


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate synthetic CrimeIntel AI seed data (JSON).")
    parser.add_argument("--cases", type=int, default=CASE_COUNT, help="number of cases to generate")
    parser.add_argument("--seed", type=int, default=RNG_SEED, help="RNG seed for determinism")
    parser.add_argument("--out", type=Path, default=SEED_DIR, help="output directory")
    args = parser.parse_args()

    rng = random.Random(args.seed)
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)

    users = [dict(u, id=i + 1) for i, u in enumerate(USERS)]
    cases, persons, evidence, events = generate_cases(rng, users)

    conversations = [{
        "id": 1,
        "user_id": 2,  # kavya
        "title": "Vehicle theft Bengaluru",
        "created_at": iso(datetime.now(timezone.utc) - timedelta(days=2)),
        "updated_at": iso(datetime.now(timezone.utc) - timedelta(days=1)),
    }]
    messages = [
        {"id": i, "conversation_id": 1, "role": "user", "content": q, "intent": None, "confidence": None, "sources": None, "feedback": None,
         "created_at": iso(datetime.now(timezone.utc) - timedelta(days=2, hours=(10 - i)))}
        for i, q in enumerate(CANONICAL_QUERIES, start=1)
    ]
    audit = [{
        "id": i, "user_id": u["id"], "action": "login", "entity_type": "user", "entity_id": u["id"],
        "details": json.dumps({"provider": "local"}), "ip_address": "127.0.0.1",
        "created_at": iso(datetime.now(timezone.utc) - timedelta(days=i)),
    } for i, u in enumerate(users, start=1)]
    notifications = [{
        "id": 1, "user_id": 2, "title": "Case assigned", "message": "CASE-1005 has been assigned to you.",
        "notification_type": "case_assignment", "is_read": 0,
        "created_at": iso(datetime.now(timezone.utc) - timedelta(days=1)),
    }]
    reports = [{
        "id": 1, "title": "Analytics snapshot — July 2026", "report_type": "analytics_snapshot",
        "params": json.dumps({"month": "2026-07"}), "file_path": None, "created_by": 4,
        "status": "ready", "created_at": iso(datetime.now(timezone.utc) - timedelta(days=3)),
        "completed_at": iso(datetime.now(timezone.utc) - timedelta(days=3)),
    }]

    payloads = {
        "users.json": users,
        "cases.json": cases,
        "case_persons.json": persons,
        "evidence.json": evidence,
        "case_events.json": events,
        "crima_conversations.json": conversations,
        "crima_messages.json": messages,
        "audit_logs.json": audit,
        "notifications.json": notifications,
        "reports.json": reports,
        "meta.json": {
            "generated_at": iso(datetime.now(timezone.utc)),
            "case_count": len(cases),
            "rng_seed": args.seed,
            "note": "Synthetic demo data only — no real personal information.",
        },
    }
    for name, data in payloads.items():
        (out / name).write_text(json.dumps(data, indent=2), encoding="utf-8")

    print(f"Generated {len(cases)} cases -> {out}")
    for name in payloads:
        print(f"  wrote {name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
