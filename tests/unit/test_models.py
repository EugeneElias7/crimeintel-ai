"""SQLAlchemy model tests — docs/DATABASE_SCHEMA.md (unit)."""

from __future__ import annotations

import sqlite3

import pytest
from sqlalchemy import create_engine, event, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.models import (
    Base,
    Case,
    CaseEmbedding,
    CaseEvent,
    CasePerson,
    CrimaConversation,
    CrimaMessage,
    Evidence,
    User,
)


@pytest.fixture()
def engine(tmp_path):
    path = tmp_path / "test.db"
    engine = create_engine(f"sqlite:///{path}")

    @event.listens_for(engine, "connect")
    def _fk_on(dbapi_conn, _):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    return engine


def make_user(session: Session, username: str = "u1") -> User:
    u = User(username=username, full_name="Test User", email=f"{username}@t.test",
             password_hash="x", role="investigator")
    session.add(u)
    session.flush()
    return u


def test_full_case_relationship_roundtrip(engine):
    with Session(engine) as session:
        u = make_user(session)
        c = Case(case_number="CASE-9001", title="Test theft", description="desc",
                 category="theft", district="Mysuru", status="open", priority="medium",
                 reported_at="2026-01-01T00:00:00+00:00", occurred_at="2025-12-31T00:00:00+00:00",
                 created_by=u.id, assigned_to=u.id)
        session.add(c)
        session.flush()
        session.add(CasePerson(case_id=c.id, role="suspect", full_name="Fake Person", status="arrested"))
        session.add(Evidence(case_id=c.id, name="CCTV frame", evidence_type="image",
                             storage_path="/tmp/x.png", file_size=10, mime_type="image/png", uploaded_by=u.id))
        session.add(CaseEvent(case_id=c.id, user_id=u.id, event_type="case_created",
                              description="registered", occurred_at="2026-01-01T00:00:00+00:00"))
        session.add(CaseEmbedding(case_id=c.id, embedding_model="test"))
        session.commit()

    with Session(engine) as session:
        c = session.scalar(select(Case).where(Case.case_number == "CASE-9001"))
        assert c is not None
        assert len(c.persons) == 1
        assert c.persons[0].role == "suspect"
        assert len(c.evidence) == 1
        assert c.evidence[0].evidence_type == "image"
        assert len(c.events) == 1
        assert c.events[0].event_type == "case_created"
        assert c.embedding is not None
        assert c.embedding.embedding_model == "test"


def test_case_number_unique(engine):
    with Session(engine) as session:
        u = make_user(session)
        for _ in range(2):
            session.add(Case(case_number="CASE-9002", title="t", description="d",
                             category="theft", district="Udupi", status="open",
                             reported_at="2026-01-01T00:00:00+00:00",
                             occurred_at="2026-01-01T00:00:00+00:00", created_by=u.id))
        with pytest.raises(IntegrityError):
            session.commit()


def test_cascade_delete_case(engine):
    with Session(engine) as session:
        u = make_user(session)
        c = Case(case_number="CASE-9003", title="t", description="d", category="fraud",
                 district="Hassan", status="open", reported_at="2026-01-01T00:00:00+00:00",
                 occurred_at="2026-01-01T00:00:00+00:00", created_by=u.id)
        session.add(c)
        session.flush()
        session.add(CasePerson(case_id=c.id, role="victim", full_name="P2"))
        session.add(Evidence(case_id=c.id, name="e", evidence_type="document",
                             storage_path="/tmp/e.txt", uploaded_by=u.id))
        session.commit()
        cid = c.id

    with Session(engine) as session:
        session.get(Case, cid)
        c = session.get(Case, cid)
        session.delete(c)
        session.commit()

    with Session(engine) as session:
        assert session.get(Case, cid) is None
        assert session.scalar(select(CasePerson).where(CasePerson.case_id == cid)) is None
        assert session.scalar(select(Evidence).where(Evidence.case_id == cid)) is None


def test_conversation_cascade(engine):
    with Session(engine) as session:
        u = make_user(session)
        conv = CrimaConversation(user_id=u.id, title="demo")
        session.add(conv)
        session.flush()
        session.add(CrimaMessage(conversation_id=conv.id, role="user", content="hello"))
        session.commit()
        cid = conv.id

    with Session(engine) as session:
        session.delete(session.get(CrimaConversation, cid))
        session.commit()
        assert session.scalar(select(CrimaMessage).where(CrimaMessage.conversation_id == cid)) is None


def test_foreign_key_enforced(engine):
    with Session(engine) as session:
        session.add(CasePerson(case_id=99999, role="witness", full_name="Ghost"))
        with pytest.raises(IntegrityError):
            session.commit()
