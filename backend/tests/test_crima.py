"""Tests for CRIMA AI service and intent classification."""

import pytest


class TestIntentService:
    @pytest.mark.asyncio
    async def test_case_search_intent(self):
        from services.intent_service import IntentService
        service = IntentService()
        intent, entities = await service.classify("Find theft cases in Bangalore")
        assert intent == "case_search"
        assert "theft" in str(entities)

    @pytest.mark.asyncio
    async def test_case_detail_intent(self):
        from services.intent_service import IntentService
        service = IntentService()
        intent, entities = await service.classify("Show details of case FIR-2026-000001")
        assert intent == "case_detail"
        assert "FIR-2026-000001" in str(entities)

    @pytest.mark.asyncio
    async def test_suspect_search_intent(self):
        from services.intent_service import IntentService
        service = IntentService()
        intent, entities = await service.classify("Find suspects named Ravi Kumar")
        assert intent == "suspect_search"
        assert "Ravi Kumar" in str(entities).lower() or "ravi" in str(entities).lower()

    @pytest.mark.asyncio
    async def test_summarize_intent(self):
        from services.intent_service import IntentService
        service = IntentService()
        intent, entities = await service.classify("Summarize case FIR-2026-000001")
        assert intent == "summarization"

    @pytest.mark.asyncio
    async def test_statistics_intent(self):
        from services.intent_service import IntentService
        service = IntentService()
        intent, entities = await service.classify("How many cases this month?")
        assert intent == "statistics"

    @pytest.mark.asyncio
    async def test_location_query(self):
        from services.intent_service import IntentService
        service = IntentService()
        intent, entities = await service.classify("Cases near MG Road")
        assert intent == "location_query"

    @pytest.mark.asyncio
    async def test_greeting(self):
        from services.intent_service import IntentService
        service = IntentService()
        intent, entities = await service.classify("Hello")
        assert intent == "greeting"

    @pytest.mark.asyncio
    async def test_fallback_to_case_search(self):
        from services.intent_service import IntentService
        service = IntentService()
        intent, entities = await service.classify("Something completely random query")
        assert intent == "case_search"

    @pytest.mark.asyncio
    async def test_empty_query(self):
        from services.intent_service import IntentService
        service = IntentService()
        with pytest.raises(ValueError):
            await service.classify("")


class TestContextService:
    @pytest.mark.asyncio
    async def test_save_and_get_history(self):
        from services.context_service import ContextService
        import uuid
        user_id = f"usr_test_{uuid.uuid4().hex[:8]}"
        service = ContextService()
        # Clear any existing data for this user
        await service.clear(user_id)
        await service.save(user_id, "Find theft cases", "Found 10 cases")
        await service.save(user_id, "Show me more", "Here are more details")
        history = await service.get_history(user_id)
        # Check that we have exactly 2 user messages and 2 assistant responses
        user_messages = [h for h in history if h["role"] == "user"]
        assistant_messages = [h for h in history if h["role"] == "assistant"]
        assert len(user_messages) == 2
        assert len(assistant_messages) == 2
        assert history[0]["role"] == "user"

    @pytest.mark.asyncio
    async def test_clear_history(self):
        from services.context_service import ContextService
        service = ContextService()
        await service.save("usr_001", "Test query", "Test response")
        await service.clear("usr_001")
        history = await service.get_history("usr_001")
        assert len(history) == 0

    @pytest.mark.asyncio
    async def test_sliding_window(self):
        from services.context_service import ContextService
        service = ContextService()
        for i in range(10):
            await service.save("usr_001", f"Query {i}", f"Response {i}")
        history = await service.get_history("usr_001")
        assert len(history) <= 10


class TestCRIMAService:
    @pytest.mark.asyncio
    async def test_greeting_response(self, mocker):
        from services.crima_service import CRIMAService
        mock_intent = mocker.AsyncMock()
        mock_intent.classify.return_value = ("greeting", {})
        mock_embedding = mocker.AsyncMock()
        mock_faiss = mocker.AsyncMock()
        mock_context = mocker.AsyncMock()
        mock_case = mocker.AsyncMock()
        service = CRIMAService(mock_intent, mock_embedding, mock_faiss, mock_context, mock_case)
        result = await service.process_query("Hello", [])
        assert "hello" in result.response.lower()

    @pytest.mark.asyncio
    async def test_empty_response_on_no_results(self, mocker):
        from services.crima_service import CRIMAService
        mock_intent = mocker.AsyncMock()
        mock_intent.classify.return_value = ("case_search", {"crime_type": "unknown"})
        mock_embedding = mocker.AsyncMock()
        mock_embedding.generate.return_value = [0.1] * 384
        mock_faiss = mocker.AsyncMock()
        mock_faiss.search.return_value = []
        mock_context = mocker.AsyncMock()
        mock_context.merge.return_value = "test query"
        mock_case = mocker.AsyncMock()
        service = CRIMAService(mock_intent, mock_embedding, mock_faiss, mock_context, mock_case)
        result = await service.process_query("Find unknown crime type", [])
        assert result.total_found == 0
        assert len(result.results) == 0
