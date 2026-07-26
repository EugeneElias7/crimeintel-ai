"""Shared test fixtures for CrimeIntel AI backend tests."""

import pytest
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.get = AsyncMock()
    db.insert = AsyncMock(return_value="row_id_123")
    db.update = AsyncMock()
    db.delete = AsyncMock()
    db.get_all = AsyncMock(return_value=[])
    db.query = AsyncMock(return_value=[])
    return db


@pytest.fixture
def mock_fs():
    fs = MagicMock()
    fs.upload_file = AsyncMock(return_value="https://filestore.catalyst/evidence/test.pdf")
    fs.delete_file = AsyncMock()
    fs.get_file_url = AsyncMock(return_value="https://filestore.catalyst/evidence/test.pdf")
    return fs


@pytest.fixture
def mock_auth_adapter():
    auth = MagicMock()
    auth.login = AsyncMock(return_value={"access_token": "mock_token", "user": {"id": "usr_001"}})
    auth.logout = AsyncMock()
    auth.reset_password = AsyncMock()
    auth.verify_token = AsyncMock(return_value={"user_id": "usr_001", "email": "test@ksp.gov.in"})
    return auth


@pytest.fixture
def sample_case_data():
    return {
        "case_id": "FIR-2026-000001",
        "fir_number": "KSP-BLR-2026-0789",
        "crime_type": "theft",
        "status": "under_investigation",
        "date_filed": "2026-07-15",
        "location": "Majestic, Bangalore",
        "latitude": 12.9767,
        "longitude": 77.5713,
        "district": "Bangalore Urban",
        "description": "Theft reported at Majestic bus stand.",
        "officer_id": "usr_001",
        "priority": "high",
        "created_at": "2026-07-15T09:30:00Z",
        "updated_at": "2026-07-20T14:00:00Z"
    }


@pytest.fixture
def sample_user_data():
    return {
        "user_id": "usr_001",
        "display_name": "SI Arun Kumar",
        "email": "arun.kumar@ksp.gov.in",
        "role": "officer",
        "badge_number": "KSP-2024-0789",
        "phone": "9876543210",
        "status": "active",
        "created_at": "2026-01-15T10:30:00Z",
        "updated_at": "2026-07-26T10:00:00Z"
    }
