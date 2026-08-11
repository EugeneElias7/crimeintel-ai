"""Seed pipeline integration tests — JSON -> SQLite + storage files (integration)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from backend.app.models import (
    AuditLog,
    Case,
    CaseEvent,
    CasePerson,
    CrimaConversation,
    Evidence,
    Report,
    User,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
SEED_SCRIPT = REPO_ROOT / "scripts" / "seed_database.py"
GENERATOR = REPO_ROOT / "scripts" / "generate_synthetic_data.py"


@pytest.fixture()
def seeded_env(tmp_path):
    seed_dir = tmp_path / "seed"
    subprocess.run(
        [sys.executable, str(GENERATOR), "--cases", "305", "--seed", "42", "--out", str(seed_dir)],
        check=True, capture_output=True, text=True, cwd=REPO_ROOT,
    )
    db_path = tmp_path / "crimeintel.db"
    storage = tmp_path / "storage"
    env = os.environ.copy()
    env["DATABASE__URL"] = f"sqlite:///{db_path}"
    env["STORAGE__ROOT"] = str(storage)
    result = subprocess.run(
        [sys.executable, str(SEED_SCRIPT), "--reset"],
        check=False, capture_output=True, text=True, cwd=REPO_ROOT, env=env,
    )
    assert result.returncode == 0, result.stderr
    return db_path, storage


def test_seed_populates_all_tables(seeded_env):
    db_path, storage = seeded_env
    engine = create_engine(f"sqlite:///{db_path}")
    with Session(engine) as session:
        assert session.scalars(select(User)).all()
        cases = session.scalars(select(Case)).all()
        assert len(cases) >= 300
        assert session.scalars(select(CasePerson)).all()
        assert session.scalars(select(CaseEvent)).all()
        assert session.scalars(select(Evidence)).all()
        assert session.scalars(select(AuditLog)).all()
        assert session.scalars(select(Report)).all()
        assert session.scalars(select(CrimaConversation)).all()

        numbers = [c.case_number for c in cases]
        assert len(set(numbers)) == len(numbers)

        # evidence storage_path points at real files
        for ev in session.scalars(select(Evidence)):
            assert Path(ev.storage_path).exists()
            assert Path(ev.storage_path).is_relative_to(storage.resolve())


def test_seed_hashes_passwords(seeded_env):
    db_path, _ = seeded_env
    engine = create_engine(f"sqlite:///{db_path}")
    with Session(engine) as session:
        users = session.scalars(select(User)).all()
        assert len(users) == 6
        for u in users:
            assert u.password_hash.startswith("$2"), "passwords must be bcrypt hashed"
            assert "pass1234" not in u.password_hash
        roles = {u.role for u in users}
        assert roles == {"admin", "investigator", "analyst", "viewer"}
