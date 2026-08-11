"""Synthetic generator tests — determinism + dataset invariants (unit)."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
GENERATOR = REPO_ROOT / "scripts" / "generate_synthetic_data.py"

DISTRICTS = {
    "Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Hubballi-Dharwad", "Mangaluru",
    "Belagavi", "Kalaburagi", "Davanagere", "Tumakuru", "Shivamogga", "Udupi", "Hassan",
}
CATEGORIES = {
    "theft", "burglary", "robbery", "vehicle_theft", "assault", "cybercrime",
    "fraud", "missing_person", "drug_related", "murder", "other",
}
STATUSES = {"open", "under_investigation", "closed", "archived"}
PRIORITIES = {"low", "medium", "high", "critical"}
ROLES = {"suspect", "victim", "witness"}


def run_generator(out_dir: Path, cases: int = 305, seed: int = 42) -> None:
    result = subprocess.run(
        [sys.executable, str(GENERATOR), "--cases", str(cases), "--seed", str(seed), "--out", str(out_dir)],
        capture_output=True, text=True, cwd=REPO_ROOT,
    )
    assert result.returncode == 0, result.stderr
    return result


def test_generator_produces_required_files(tmp_path):
    run_generator(tmp_path)
    expected = ["users.json", "cases.json", "case_persons.json", "evidence.json",
                "case_events.json", "crima_conversations.json", "crima_messages.json",
                "audit_logs.json", "notifications.json", "reports.json", "meta.json"]
    for name in expected:
        assert (tmp_path / name).exists(), name


def test_dataset_invariants(tmp_path):
    run_generator(tmp_path)
    cases = json.loads((tmp_path / "cases.json").read_text(encoding="utf-8"))
    persons = json.loads((tmp_path / "case_persons.json").read_text(encoding="utf-8"))
    evidence = json.loads((tmp_path / "evidence.json").read_text(encoding="utf-8"))
    events = json.loads((tmp_path / "case_events.json").read_text(encoding="utf-8"))

    assert len(cases) >= 300  # MVP requirement: >= 300 synthetic cases
    case_numbers = [c["case_number"] for c in cases]
    assert len(set(case_numbers)) == len(case_numbers), "case numbers must be unique"

    for c in cases:
        assert c["district"] in DISTRICTS
        assert c["category"] in CATEGORIES
        assert c["status"] in STATUSES
        assert c["priority"] in PRIORITIES
        assert c["occurred_at"] <= c["reported_at"]
        if c["status"] in ("closed", "archived"):
            assert c["resolved_at"], "closed/archived cases must have resolved_at"

    case_ids = {c["id"] for c in cases}
    assert all(p["case_id"] in case_ids for p in persons)
    assert all(p["role"] in ROLES for p in persons)
    assert all(e["case_id"] in case_ids for e in evidence)
    assert all(ev["case_id"] in case_ids for ev in events)

    # every district/category appears (analytics demo needs all slices)
    assert {c["district"] for c in cases} == DISTRICTS
    assert {c["category"] for c in cases} == CATEGORIES


def _strip_dates(cases: list[dict]) -> list[dict]:
    out = []
    for c in cases:
        c = dict(c)
        for key in ("reported_at", "occurred_at", "resolved_at"):
            c.pop(key, None)
        out.append(c)
    return out


def test_generator_deterministic(tmp_path):
    run_generator(tmp_path / "a")
    run_generator(tmp_path / "b")
    a = json.loads((tmp_path / "a" / "cases.json").read_text(encoding="utf-8"))
    b = json.loads((tmp_path / "b" / "cases.json").read_text(encoding="utf-8"))
    assert [c["case_number"] for c in a] == [c["case_number"] for c in b]
    # timestamps are relative to run-time "now" (keeps demo data fresh); everything
    # else must be identical between runs
    assert _strip_dates(a) == _strip_dates(b)
