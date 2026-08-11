"""Build the FAISS case index — docs/AI_SPECIFICATION.md §5, ROADMAP Phase 1.

Embeds every case (title + category + district + locality + description + persons)
and writes data/indexes/cases.index + cases.json (vector-id -> case-id map).

Requires an existing seeded database (scripts/seed_database.py) and internet on
first run (model download, cached afterwards).

Usage:
    python scripts/build_faiss_index.py
"""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    sys.path.insert(0, str(REPO_ROOT))
    from sqlalchemy import create_engine, event, select
    from sqlalchemy.orm import Session

    from backend.app.config import settings
    from backend.app.models import Base, Case, CaseEmbedding, CasePerson
    from ai.retrieval.faiss_service import build_index

    engine = create_engine(settings.database_url)
    if settings.database_url.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def _fk_on(dbapi_conn, _):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    with Session(engine) as session:
        cases = session.scalars(select(Case).order_by(Case.id)).all()
        if not cases:
            print("No cases found — run scripts/seed_database.py first.", file=sys.stderr)
            return 1

        persons_by_case: dict[int, list[str]] = {}
        for p in session.scalars(select(CasePerson)):
            persons_by_case.setdefault(p.case_id, []).append(p.full_name)

        docs: list[str] = []
        for c in cases:
            names = ", ".join(persons_by_case.get(c.id, []))
            docs.append(
                f"{c.title}. {c.category}. {c.district}. {c.locality or ''}. "
                f"{c.description} Persons: {names}. Status: {c.status}."
            )

        print(f"Building index for {len(cases)} cases...")
        index = build_index(docs, [c.id for c in cases])

        # record embedding rows (vector id == CaseEmbedding.id)
        Base.metadata.create_all(engine)
        session.query(CaseEmbedding).delete()
        session.flush()
        for case_id in [c.id for c in cases]:
            session.add(CaseEmbedding(case_id=case_id, embedding_model=settings.ai_embedding_model))
        session.commit()

        print(f"Index ready: {settings.ai_faiss_index} ({index.count} vectors)")
        print("Model:", settings.ai_embedding_model)
    return 0


if __name__ == "__main__":
    sys.exit(main())
