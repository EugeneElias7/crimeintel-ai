"""Tests for CaseService."""

import pytest
from utils.helpers import generate_case_id, validate_file_extension, validate_file_size


class TestHelpers:
    def test_generate_case_id_format(self):
        case_id = generate_case_id()
        assert case_id.startswith("FIR-")
        parts = case_id.split("-")
        assert len(parts) == 3
        assert parts[2].isdigit()
        assert len(parts[2]) == 6

    def test_generate_case_id_increment(self):
        id1 = generate_case_id()
        id2 = generate_case_id()
        assert id1 != id2

    def test_validate_file_extension_valid(self):
        assert validate_file_extension("document.pdf") is True
        assert validate_file_extension("photo.jpeg") is True
        assert validate_file_extension("photo.jpg") is True
        assert validate_file_extension("image.png") is True
        assert validate_file_extension("video.mp4") is True

    def test_validate_file_extension_invalid(self):
        assert validate_file_extension("script.exe") is False
        assert validate_file_extension("data.zip") is False
        assert validate_file_extension("document.doc") is False

    def test_validate_file_size_valid(self):
        assert validate_file_size(1024) is True
        assert validate_file_size(25 * 1024 * 1024) is True

    def test_validate_file_size_invalid(self):
        assert validate_file_size(30 * 1024 * 1024) is False


class TestCaseService:
    @pytest.mark.asyncio
    async def test_list_cases_empty(self, mock_db):
        from services.case_service import CaseService
        service = CaseService(mock_db)
        mock_db.get_all.return_value = []
        result = await service.list_cases(page=1, limit=20, filters={})
        assert result["total"] == 0
        assert result["data"] == []

    @pytest.mark.asyncio
    async def test_list_cases_with_data(self, mock_db, sample_case_data):
        from services.case_service import CaseService
        service = CaseService(mock_db)
        cases_data = [sample_case_data]
        mock_db.get_all.return_value = cases_data
        mock_db.query.return_value = []
        result = await service.list_cases(page=1, limit=20, filters={})
        assert result["total"] == 1
        assert len(result["data"]) == 1
        assert result["data"][0]["case_id"] == "FIR-2026-000001"

    @pytest.mark.asyncio
    async def test_get_case_not_found(self, mock_db):
        from services.case_service import CaseService
        service = CaseService(mock_db)
        mock_db.get.return_value = None
        result = await service.get_case("NONEXISTENT")
        assert result is None

    @pytest.mark.asyncio
    async def test_create_case(self, mock_db):
        from services.case_service import CaseService
        from models.case import CaseCreate
        service = CaseService(mock_db)
        mock_db.get_all.return_value = []
        mock_db.insert.return_value = "row_001"
        case_data = CaseCreate(
            fir_number="KSP-TEST-001",
            crime_type="theft",
            date_filed="2026-07-26",
            location="Test Location",
            district="Bangalore Urban",
            description="Test case",
            officer_id="usr_001"
        )
        result = await service.create_case(case_data)
        assert result["case_id"].startswith("FIR-")
        assert result["status"] == "open"

    @pytest.mark.asyncio
    async def test_delete_case(self, mock_db, sample_case_data):
        from services.case_service import CaseService
        service = CaseService(mock_db)
        mock_db.get.return_value = sample_case_data
        await service.delete_case("FIR-2026-000001")
        mock_db.update.assert_called_once()
