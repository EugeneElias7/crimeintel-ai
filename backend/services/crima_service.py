from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging
import uuid

from models.crima import QueryResponse, QueryResult
from services.llm_provider import LLMProviderFactory, LLMResponse
from services.grounding_validator import grounding_validator
from services.conversation_manager import conversation_manager
from services.retrieval_service import retrieval_service
from models.query_plan import QueryPlan
from services.intent_service import IntentService

logger = logging.getLogger(__name__)


class CRIMAService:
    def __init__(
        self,
        intent_service: Any,
        embedding_service: Any,
        faiss_service: Any,
        context_service: Any,
        case_service: Any,
    ) -> None:
        self.intent_service = intent_service
        self.embedding_service = embedding_service
        self.faiss_service = faiss_service
        self.context_service = context_service
        self.case_service = case_service
        self._history: List[Dict[str, str]] = []

    async def process_query(
        self, text: str, context: Optional[List[Dict[str, Any]]] = None, session_id: str = "default"
    ) -> QueryResponse:
        context = context or []

        # Classify intent with session context
        intent, entities = await self.intent_service.classify(text, session_id)

        # Update conversation context
        conversation_manager.add_to_history("default", "user", text)
        conversation_manager.add_to_history("default", "assistant", "", {"intent": intent})

        enriched_query = await self.context_service.merge(text, context, entities)

        total_found = 0
        results: List[QueryResult] = []
        sources: List[str] = []
        response_text = ""
        confidence_avg = 0.0
        context_records: List[Dict[str, Any]] = []

        # Handle greeting intent - no retrieval needed
        if intent == "greeting":
            response_text = (
                "Hello! I am CRIMA, your Crime Intelligence Assistant. "
                "I can help you search for cases, view case details, "
                "look up suspects or evidence, analyze crime trends, "
                "and provide crime statistics. How can I assist you today?"
            )
            return QueryResponse(
                response=response_text,
                results=[],
                intent=intent,
                confidence_avg=1.0,
                total_found=0,
                sources=["crima_knowledge"],
                entities=entities,
            )

        # Handle case_detail with invalid/missing case_id
        if intent == "case_detail" and (not entities.get("case_id") or entities.get("case_id") == "INVALID"):
            response_text = (
                "I couldn't find a valid FIR/Case ID in your query. "
                "Please provide a valid FIR number (e.g., FIR-2024-000001) "
                "or ask me to search for cases by location, crime type, or other criteria."
            )
            return QueryResponse(
                response=response_text,
                results=[],
                intent=intent,
                confidence_avg=0.1,
                total_found=0,
                sources=[],
                entities=entities,
            )

        enriched_query = await self.context_service.merge(text, context, entities)

        total_found = 0
        results: List[QueryResult] = []
        sources: List[str] = []
        response_text = ""
        confidence_avg = 0.0
        context_records: List[Dict[str, Any]] = []

        # Create query plan
        # Extract first location from entities (entities has 'locations' list, QueryPlan expects 'location' string)
        locations = entities.get("locations", [])
        primary_location = locations[0] if locations else None
        
        query_plan = QueryPlan(
            text=text,
            intent=intent,
            crime_type=entities.get("crime_type"),
            location=primary_location,
            district=entities.get("district"),
            status=entities.get("status"),
            date_from=entities.get("date_from"),
            date_to=entities.get("date_to"),
            person=entities.get("person"),
            limit=20,
            offset=0,
            case_id=entities.get("case_id"),
        )

        # Retrieve relevant cases
        retrieved_cases = await retrieval_service.retrieve(query_plan)

        # Build context records from retrieved cases
        for case in retrieved_cases:
            context_records.append(self._case_to_record(case))

        # Prepare results for response
        for case in retrieved_cases[:10]:  # Limit to top 10
            if case.get("type") == "statistics":
                # Handle statistics response specially
                results.append(
                    QueryResult(
                        case_id="",
                        crime_type="Statistics",
                        location="",
                        date_filed="",
                        status="",
                        confidence=1.0,
                        summary=f"Total cases: {case.get('total_cases', 0)}, Open: {case.get('open_cases', 0)}, Closed: {case.get('closed_cases', 0)}, Clearance rate: {case.get('clearance_rate', 0)}%",
                    )
                )
            else:
                results.append(
                    QueryResult(
                        case_id=case.get("case_id", ""),
                        crime_type=case.get("crime_type", ""),
                        location=case.get("location", ""),
                        date_filed=case.get("date_filed", ""),
                        status=case.get("status", ""),
                        confidence=case.get("retrieval_score", case.get("similarity_score", 0.9)),
                        summary=self._case_to_record(case).get("summary", ""),
                    )
                )

        total_found = len(results)
        
        # Build specific zero-result message based on filters
        filter_parts = []
        if primary_location:
            filter_parts.append(f"location '{primary_location}'")
        if entities.get("crime_type"):
            filter_parts.append(f"crime type '{entities.get('crime_type')}'")
        if entities.get("status"):
            filter_parts.append(f"status '{entities.get('status')}'")
        
        filter_desc = ", ".join(filter_parts) if filter_parts else "your query"
        
        # Handle statistics intent specially
        if intent == "statistics" and results and results[0].crime_type == "Statistics":
            # Use the statistics summary directly
            stats = results[0].summary
            response_text = stats
            confidence_avg = 1.0
            # Parse total_cases from summary for total_found
            import re
            match = re.search(r'Total cases: (\d+)', stats)
            total_found = int(match.group(1)) if match else 0
        elif results:
            confidence_avg = round(
                sum(r.confidence for r in results) / len(results), 4
            )
            response_text = await self._generate_grounded_response(
                text, context_records, intent, entities
            )
            if not response_text or response_text.startswith("Insufficient"):
                if results:
                    response_text = (
                        f"I found {total_found} relevant case{'s' if total_found != 1 else ''} "
                        f"related to your query."
                    )
                else:
                    response_text = (
                        f"No cases matching {filter_desc} were found in the available records."
                    )
                    confidence_avg = 0.1
        else:
            response_text = (
                f"No cases matching {filter_desc} were found in the available records."
            )
            confidence_avg = 0.05
            total_found = 0

        # Update conversation history
        conversation_manager.add_to_history("default", "user", text, {"intent": intent})
        conversation_manager.add_to_history("default", "assistant", response_text or "", {
            "intent": intent,
            "entities": entities,
            "results_count": len(results)
        })

        return QueryResponse(
            response=response_text,
            results=results,
            intent=intent,
            confidence_avg=confidence_avg,
            total_found=total_found,
            sources=sources,
            entities=entities,
        )

    async def _generate_grounded_response(
        self,
        query: str,
        context_records: List[Dict[str, Any]],
        intent: str,
        entities: Dict[str, Any],
    ) -> str:
        context_validation = grounding_validator.validate_context(context_records)
        if not context_validation["valid"]:
            return context_validation["fallback_message"]

        result: LLMResponse = await LLMProviderFactory.generate_with_fallback(
            query, context_records, intent, entities
        )
        logger.info("CRIMA response from provider: %s (model: %s, fallback: %s)",
                    result.provider, result.model, result.metadata.get("fallback", False))

        # Handle LLM timeout or error - return grounded fallback instead of empty
        if result.metadata.get("error") == "timeout":
            logger.warning("LLM provider %s timed out, returning grounded fallback", result.provider)
            return self._build_grounded_fallback_response(query, context_records, intent, entities)
        
        if result.metadata.get("error") and not result.answer:
            logger.warning("LLM provider %s returned error: %s, returning grounded fallback", 
                         result.provider, result.metadata.get("error"))
            return self._build_grounded_fallback_response(query, context_records, intent, entities)

        response_validation = grounding_validator.validate_response(
            result.answer, context_records, intent
        )
        if not response_validation["valid"]:
            return response_validation["fallback_message"]

        return result.answer

    def _build_grounded_fallback_response(
        self,
        query: str,
        context_records: List[Dict[str, Any]],
        intent: str,
        entities: Dict[str, Any],
    ) -> str:
        """Build a grounded response using only retrieved database records when LLM fails."""
        if not context_records:
            return "Insufficient information was found in the available crime database."

        case_ids = [r.get("case_id", "Unknown") for r in context_records[:5]]
        crime_types = list(set(r.get("crime_type", "Unknown") for r in context_records))
        locations = list(set(r.get("location", "Unknown") for r in context_records))
        statuses = list(set(r.get("status", "Unknown") for r in context_records))

        if intent == "statistics":
            total = len(context_records)
            open_count = sum(1 for r in context_records if r.get("status") in ["open", "under_investigation"])
            closed_count = sum(1 for r in context_records if r.get("status") == "closed")
            return (
                f"Based on {total} retrieved cases: "
                f"{open_count} open, {closed_count} closed. "
                f"Crime types: {', '.join(crime_types[:5])}. "
                f"Locations: {', '.join(locations[:5])}. "
                f"Statuses: {', '.join(statuses[:5])}."
            )

        if intent in ["case_search", "location_query", "cross_reference"]:
            return (
                f"Found {len(context_records)} relevant case(s) for your query. "
                f"Case IDs: {', '.join(case_ids)}. "
                f"Crime types: {', '.join(crime_types[:5])}. "
                f"Locations: {', '.join(locations[:5])}. "
                f"Statuses: {', '.join(statuses[:5])}."
            )

        if intent == "case_detail" and entities.get("case_id"):
            case_id = entities["case_id"]
            matching = [r for r in context_records if r.get("case_id") == case_id]
            if matching:
                r = matching[0]
                return (
                    f"Case {r.get('case_id', case_id)}: {r.get('crime_type', 'Unknown')} "
                    f"at {r.get('location', 'Unknown')}, {r.get('district', 'Unknown')}. "
                    f"Status: {r.get('status', 'Unknown')}. "
                    f"Filed on: {r.get('date_filed', 'Unknown')}. "
                    f"Description: {r.get('description', 'No description available.')[:300]}"
                )
            return f"Case {case_id} was not found in the retrieved records."

        return (
            f"Retrieved {len(context_records)} case(s) related to your query. "
            f"Case IDs: {', '.join(case_ids)}. "
            f"Crime types: {', '.join(crime_types[:5])}. "
            f"Locations: {', '.join(locations[:5])}."
        )

    def _case_to_record(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "case_id": case_data.get("case_id", ""),
            "crime_type": case_data.get("crime_type", ""),
            "location": case_data.get("location", ""),
            "district": case_data.get("district", ""),
            "status": case_data.get("status", ""),
            "date_filed": case_data.get("date_filed", ""),
            "description": case_data.get("description", ""),
            "summary": (
                f"{case_data.get('crime_type', '')} at {case_data.get('location', '')}, "
                f"{case_data.get('district', '')} - {case_data.get('status', '')}"
            ),
        }

    async def get_history(self) -> list:
        return self._history

    async def clear_history(self) -> None:
        self._history.clear()

    async def _get_analytics_summary(self) -> dict:
        from services.analytics_service import AnalyticsService
        from adapters.sqlite_db import sqlite_db

        analytics_service = AnalyticsService(sqlite_db)
        overview = await analytics_service.get_overview()
        distribution = await analytics_service.get_distribution()

        top_crimes = []
        for item in distribution[:3]:
            top_crimes.append(f"{item['crime_type']} ({item['count']})")

        summary_parts = [
            f"Total cases: {overview['total_cases']}",
            f"Open cases: {overview['open_cases']}",
            f"Closed cases: {overview['closed_cases']}",
            f"Clearance rate: {overview['clearance_rate']}%",
        ]
        if top_crimes:
            summary_parts.append(f"Top crimes: {', '.join(top_crimes)}")

        return {
            "summary": ". ".join(summary_parts) + ".",
            "total_cases": overview["total_cases"],
        }

    async def _structured_retrieval(
        self,
        crime_type: Optional[str],
        locations: List[str],
        persons: List[str],
        date_ref: Optional[str],
        k: int = 10
    ) -> List[Tuple[Dict[str, Any], float]]:
        from adapters.sqlite_db import sqlite_db

        try:
            all_cases = await sqlite_db.get_all("Cases")
            if not all_cases:
                return []

            filtered = []
            for case in all_cases:
                if crime_type and case.get("crime_type") != crime_type:
                    continue
                if locations:
                    loc = locations[0].lower()
                    case_loc = (case.get("location") or "").lower()
                    case_district = (case.get("district") or "").lower()
                    if loc not in case_loc and loc not in case_district:
                        continue
                if date_ref and case.get("date_filed", "") < date_ref:
                    continue

                filtered.append(case)

            if persons:
                all_suspects = await sqlite_db.get_all("Suspects")
                person_names = [p.lower() for p in persons]
                matching_case_ids = set()
                for s in all_suspects:
                    suspect_name = (s.get("name") or "").lower()
                    if any(p in suspect_name for p in person_names):
                        matching_case_ids.add(s.get("case_id"))
                filtered = [c for c in filtered if (c.get("case_id") or c.get("ROWID")) in matching_case_ids]

            scored = []
            for case in filtered[:k]:
                scored.append((case, 0.9))
            return scored

        except Exception as e:
            logger.error("Structured retrieval failed: %s", e)
            return []