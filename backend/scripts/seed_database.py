"""Seed data runner script for CrimeIntel AI.

Generates synthetic crime data and inserts it into the local SQLite database.
"""

import asyncio
import logging
import os
import sys
import hashlib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from seed_data.generate_cases import generate_cases

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Use simple SHA256 for seeding (bcrypt has issues with passlib version)
DEFAULT_PASSWORD = "Test123"
PASSWORD_HASH = hashlib.sha256(DEFAULT_PASSWORD.encode()).hexdigest()


async def seed_database(count: int = 500) -> None:
    logger.info("Generating %d cases with associated data...", count)
    data = generate_cases(count)

    try:
        from adapters.sqlite_db import sqlite_db

        await sqlite_db._ensure_initialized()
        logger.info("Connected to SQLite database")
    except Exception as e:
        logger.error("Could not connect to SQLite database: %s", e)
        print_summary(data)
        return

    user_ids = {}
    for officer in data["officers"]:
        try:
            officer_data = {
                "ROWID": officer["user_id"],
                "user_id": officer["user_id"],
                "display_name": officer["display_name"],
                "email": officer.get("email", ""),
                "password_hash": PASSWORD_HASH,
                "role": officer.get("role", "officer"),
                "badge_number": officer.get("badge_number", ""),
                "phone": officer.get("phone", ""),
                "status": officer.get("status", "active"),
                "created_at": officer.get("created_at", ""),
                "updated_at": officer.get("updated_at", ""),
            }
            row_id = await sqlite_db.insert("Users", officer_data)
            user_ids[officer["user_id"]] = row_id
            logger.info("Inserted user %s (%s)", officer["display_name"], row_id)
        except Exception as e:
            logger.error("Failed to insert user %s: %s", officer["user_id"], e)

    case_ids = {}
    for case in data["cases"]:
        try:
            case_data = {
                "ROWID": case["case_id"],
                "case_id": case["case_id"],
                "fir_number": case["fir_number"],
                "crime_type": case["crime_type"],
                "status": case["status"],
                "date_filed": case["date_filed"],
                "date_closed": case["date_closed"],
                "location": case["location"],
                "latitude": case["latitude"],
                "longitude": case["longitude"],
                "district": case["district"],
                "description": case["description"],
                "officer_id": case["officer_id"],
                "priority": case["priority"],
                "created_at": case["created_at"],
                "updated_at": case["updated_at"],
            }
            row_id = await sqlite_db.insert("Cases", case_data)
            case_ids[case["case_id"]] = row_id
        except Exception as e:
            logger.error("Failed to insert case %s: %s", case["case_id"], e)
    logger.info("Inserted %d cases", len(case_ids))

    suspect_count = 0
    for suspect in data["suspects"]:
        try:
            suspect_data = {
                "ROWID": suspect["suspect_id"],
                "suspect_id": suspect["suspect_id"],
                "case_id": suspect["case_id"],
                "name": suspect["name"],
                "alias": suspect["alias"],
                "photo_url": suspect["photo_url"] if suspect.get("photo_url") else None,
                "age": suspect["age"],
                "gender": suspect["gender"],
                "address": suspect["address"],
                "identification_marks": suspect["identification_marks"],
                "known_associates": suspect.get("known_associates"),
                "criminal_history": suspect.get("criminal_history"),
                "status": suspect["status"],
                "created_at": suspect.get("created_at", ""),
                "updated_at": suspect.get("updated_at", ""),
            }
            await sqlite_db.insert("Suspects", suspect_data)
            suspect_count += 1
        except Exception as e:
            logger.error("Failed to insert suspect: %s", e)
    logger.info("Inserted %d suspects", suspect_count)

    witness_count = 0
    for witness in data["witnesses"]:
        try:
            witness_data = {
                "ROWID": witness["witness_id"],
                "witness_id": witness["witness_id"],
                "case_id": witness["case_id"],
                "name": witness["name"],
                "contact": witness["contact"],
                "statement_summary": witness["statement_summary"],
                "credibility_score": witness["credibility_score"],
                "status": witness["status"],
                "created_at": witness.get("created_at", ""),
                "updated_at": witness.get("updated_at", ""),
            }
            await sqlite_db.insert("Witnesses", witness_data)
            witness_count += 1
        except Exception as e:
            logger.error("Failed to insert witness: %s", e)
    logger.info("Inserted %d witnesses", witness_count)

    timeline_count = 0
    for event in data["timeline"]:
        try:
            created_at = event.get("created_at") or event["event_date"]
            event_data = {
                "ROWID": event["event_id"],
                "event_id": event["event_id"],
                "case_id": event["case_id"],
                "event_date": event["event_date"],
                "event_type": event["event_type"],
                "description": event["description"],
                "officer_id": event["officer_id"],
                "created_at": created_at,
            }
            await sqlite_db.insert("Timeline", event_data)
            timeline_count += 1
        except Exception as e:
            logger.error("Failed to insert timeline event: %s", e)
    logger.info("Inserted %d timeline events", timeline_count)

    evidence_count = 0
    for ev in data.get("evidence", []):
        try:
            evidence_data = {
                "ROWID": ev["evidence_id"],
                "evidence_id": ev["evidence_id"],
                "case_id": ev["case_id"],
                "file_name": ev["file_name"],
                "file_type": ev["file_type"],
                "file_size": ev["file_size"],
                "file_url": ev["file_url"],
                "description": ev["description"],
                "sensitive": 1 if ev["sensitive"] else 0,
                "uploaded_by": ev["uploaded_by"],
                "uploaded_at": ev["uploaded_at"],
            }
            await sqlite_db.insert("Evidence_Metadata", evidence_data)
            evidence_count += 1
        except Exception as e:
            logger.error("Failed to insert evidence: %s", e)
    logger.info("Inserted %d evidence records", evidence_count)

    print_summary(data, user_ids, case_ids, suspect_count, witness_count, timeline_count, evidence_count)


def print_summary(
    data: dict = None,
    user_ids: dict = None,
    case_ids: dict = None,
    suspect_count: int = 0,
    witness_count: int = 0,
    timeline_count: int = 0,
    evidence_count: int = 0,
) -> None:
    if data is None:
        return
    print()
    print("=" * 50)
    print("SEED DATA SUMMARY")
    print("=" * 50)
    print(f"  Officers generated:  {len(data['officers'])}")
    print(f"  Users inserted:     {len(user_ids or [])}")
    print(f"  Cases generated:    {len(data['cases'])}")
    print(f"  Cases inserted:     {len(case_ids or [])}")
    print(f"  Suspects:           {suspect_count or len(data['suspects'])}")
    print(f"  Witnesses:          {witness_count or len(data['witnesses'])}")
    print(f"  Timeline events:    {timeline_count or len(data['timeline'])}")
    print(f"  Evidence records:   {evidence_count or len(data.get('evidence', []))}")
    print("=" * 50)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed the database with synthetic crime data")
    parser.add_argument(
        "--count",
        type=int,
        default=500,
        help="Number of cases to generate (default: 500)",
    )
    args = parser.parse_args()
    asyncio.run(seed_database(args.count))