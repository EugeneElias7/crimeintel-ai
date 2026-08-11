"""FAISS retrieval verification — docs/AI_SPECIFICATION.md §5, §13 (AI marker).

Requires the local embedding model (downloaded on first run, ~90 MB).
Run:  pytest tests/ai -m ai
"""

from __future__ import annotations

from pathlib import Path

import pytest

pytestmark = pytest.mark.ai

from ai.embedding.embedding_service import unload
from ai.retrieval.faiss_service import build_index, CaseVectorIndex

DOCS = [
    ("Two-wheeler stolen near market, Bengaluru Urban. Vehicle theft.", 1),
    ("House break-in, jewellery taken, Mysuru. Burglary.", 2),
    ("Laptop stolen from office cabin, Bengaluru Urban. Theft.", 3),
    ("Online banking fraud via fake link, Mangaluru. Cybercrime.", 4),
    ("Missing person reported, elderly, Shivamogga. Missing person.", 5),
    ("Scooter missing from apartment parking, Bengaluru Rural. Vehicle theft.", 6),
    ("Mobile phone snatched at bus stop, Hubballi-Dharwad. Robbery.", 7),
    ("Ganja seizure at bus stand, Kalaburagi. Drug related.", 8),
    ("Armed robbery at petrol bunk, Davanagere. Robbery.", 9),
    ("Golf club theft from clubhouse, Mysuru. Theft.", 10),
]


@pytest.fixture()
def index(tmp_path):
    texts = [t for t, _ in DOCS]
    ids = [i for _, i in DOCS]
    idx = build_index(texts, ids, tmp_path / "tiny.index")
    yield idx
    unload()


def test_build_and_reload(index: CaseVectorIndex, tmp_path):
    assert index.is_ready
    assert index.count == len(DOCS)
    reloaded = CaseVectorIndex(tmp_path / "tiny.index")
    assert reloaded.is_ready
    assert reloaded.count == len(DOCS)


def test_semantic_search_finds_vehicle_theft(index: CaseVectorIndex):
    hits = index.search("stolen bike in Bangalore", top_k=3)
    assert hits
    assert hits[0].case_id in (1, 6), "expected a vehicle theft case on top"
    assert hits[0].score > 0.5


def test_ranked_results_and_exclusion(index: CaseVectorIndex):
    hits = index.search("cyber fraud online payment", top_k=2)
    assert hits[0].case_id == 4
    assert len(hits) == 2
