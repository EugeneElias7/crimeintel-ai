from datetime import datetime, timedelta
from .database import Base
from sqlalchemy import Column, Integer, String, DateTime, Boolean


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="analyst")
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=False)
    district = Column(String, nullable=False)
    locality = Column(String, nullable=True)
    status = Column(String, default="open")
    priority = Column(String, default="medium")
    reported_at = Column(DateTime, nullable=True)
    occurred_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_by_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    evidence_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String, nullable=True)
    storage_path = Column(String, nullable=True)
    uploaded_by_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CaseEvent(Base):
    __tablename__ = "case_events"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, nullable=False, index=True)
    event_type = Column(String, nullable=False)
    description = Column(String, nullable=True)
    occurred_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by_id = Column(Integer, nullable=True)