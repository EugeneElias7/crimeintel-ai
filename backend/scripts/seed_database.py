"""Seed data runner script for CrimeIntel AI.

Generates synthetic crime data and inserts it into the Catalyst Data Store.
"""

import asyncio
import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from seed_data.generate_cases import generate_cases

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


async def seed_database(count: int = 500) -> None:
    logger.info("Generating %d cases with associated data...", count)
    data = generate_cases(count)

    try:
        from adapters.catalyst_db import catalyst_db

        await catalyst_db._ensure_initialized()
        logger.info("Connected to Catalyst Data Store")
    except Exception as e:
        logger.warning("Could not connect to Catalyst Data Store: %s", e)
        logger.info(
            "To seed manually, set CATALYST_PROJECT_ID, CATALYST_CLIENT_ID, "
            "and CATALYST_CLIENT_SECRET in your .env file."
        )
        print_summary(data)
        return

    user_ids = {}
    for officer in data["officers"]:
        try:
            row_id = await catalyst_db.insert("users", officer)
            user_ids[officer["user_id"]] = row_id
            logger.info("Inserted user %s (%s)", officer["display_name"], row_id)
        except Exception as e:
            logger.error("Failed to insert user %s: %s", officer["user_id"], e)

    case_ids = {}
    for case in data["cases"]:
        try:
            row_id = await catalyst_db.insert("cases", case)
            case_ids[case["case_id"]] = row_id
        except Exception as e:
            logger.error("Failed to insert case %s: %s", case["case_id"], e)
    logger.info("Inserted %d cases", len(case_ids))

    suspect_count = 0
    for suspect in data["suspects"]:
        try:
            await catalyst_db.insert("suspects", suspect)
            suspect_count += 1
        except Exception as e:
            logger.error("Failed to insert suspect: %s", e)
    logger.info("Inserted %d suspects", suspect_count)

    witness_count = 0
    for witness in data["witnesses"]:
        try:
            await catalyst_db.insert("witnesses", witness)
            witness_count += 1
        except Exception as e:
            logger.error("Failed to insert witness: %s", e)
    logger.info("Inserted %d witnesses", witness_count)

    timeline_count = 0
    for event in data["timeline"]:
        try:
            await catalyst_db.insert("timeline_events", event)
            timeline_count += 1
        except Exception as e:
            logger.error("Failed to insert timeline event: %s", e)
    logger.info("Inserted %d timeline events", timeline_count)

    print_summary(data, user_ids, case_ids, suspect_count, witness_count, timeline_count)


def print_summary(
    data: dict = None,
    user_ids: dict = None,
    case_ids: dict = None,
    suspect_count: int = 0,
    witness_count: int = 0,
    timeline_count: int = 0,
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
