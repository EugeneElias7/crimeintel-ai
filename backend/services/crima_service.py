import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from models.crima import QueryResponse, QueryResult
from services.llm_provider import LLMProviderFactory, LLMResponse
from services.grounding_validator import grounding_validator

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
        self, text: str, context: Optional[List[Dict[str, Any]]] = None
    ) -> QueryResponse:
        context = context or []

        intent, entities = await self.intent_service.classify(text)

        enriched_query = await self.context_service.merge(text, context, entities)

        total_found = 0
        results: List[QueryResult] = []
        sources: List[str] = []
        response_text = ""
        confidence_avg = 0.0
        context_records: List[Dict[str, Any]] = []

        if intent == "greeting":
            response_text = (
                "Hello! I am CRIMA, your Crime Intelligence Assistant. "
                "I can help you search for cases, view case details, "
                "look up suspects or evidence, and provide crime statistics. "
                "How can I assist you today?"
            )
            confidence_avg = 1.0
            sources = ["crima_knowledge"]

        elif intent == "case_detail":
            case_id = entities.get("case_id", "")
            if case_id:
                try:
                    case_data = await self.case_service.get_case(case_id)
                    context_records = [self._case_to_record(case_data)]
                    summary = (
                        f"Case {case_data['case_id']}: {case_data['crime_type']} "
                        f"at {case_data['location']}, {case_data['district']}. "
                        f"Status: {case_data['status']}. "
                        f"Filed by officer {case_data['officer']['display_name']}. "
                        f"Suspects: {case_data['suspect_count']}, Evidence items: {case_data['evidence_count']}."
                    )
                    results.append(
                        QueryResult(
                            case_id=case_data["case_id"],
                            crime_type=case_data["crime_type"],
                            location=case_data["location"],
                            date_filed=case_data["date_filed"],
                            status=case_data["status"],
                            confidence=0.95,
                            summary=summary,
                        )
                    )
                    total_found = 1
                    confidence_avg = 0.95
                    sources = [f"Cases/{case_id}"]
                    response_text = await self._generate_grounded_response(
                        text, context_records, intent, entities
                    )
                    if not response_text or response_text.startswith("Insufficient"):
                        response_text = summary
                except ValueError as e:
                    response_text = f"Case {case_id} was not found in the system."
                    confidence_avg = 0.0
                    sources = []
            else:
                response_text = "Please specify a case ID to view details."
                confidence_avg = 0.0

        elif intent == "statistics":
            try:
                analytics = await self._get_analytics_summary()
                context_records = [{"summary": analytics.get("summary", ""), "case_id": "analytics"}]
                response_text = await self._generate_grounded_response(
                    text, context_records, intent, entities
                )
                if not response_text or response_text.startswith("Insufficient"):
                    response_text = analytics.get("summary", "")
                total_found = analytics.get("total_cases", 0)
                confidence_avg = 0.9
                sources = ["analytics_service"]
            except Exception as e:
                logger.error("Failed to get analytics: %s", e)
                response_text = "Unable to retrieve crime statistics at this time."
                confidence_avg = 0.0

        else:
            try:
                crime_type = entities.get("crime_type")
                locations = entities.get("locations", [])
                persons = entities.get("persons", [])
                date_ref = entities.get("date_ref")

                structured_results = await self._structured_retrieval(
                    crime_type=crime_type,
                    locations=locations,
                    persons=persons,
                    date_ref=date_ref,
                    k=10
                )

                if structured_results:
                    for case_data, score in structured_results:
                        context_records.append(self._case_to_record(case_data))
                        results.append(
                            QueryResult(
                                case_id=case_data["case_id"],
                                crime_type=case_data["crime_type"],
                                location=case_data["location"],
                                date_filed=case_data["date_filed"],
                                status=case_data["status"],
                                confidence=round(score, 4),
                                summary=(
                                    f"{case_data['crime_type']} at {case_data['location']}, "
                                    f"{case_data['district']} - {case_data['status']}"
                                ),
                            )
                        )
                        sources.append(f"Cases/{case_data['case_id']}")
                else:
                    embedding = await self.embedding_service.generate(enriched_query)
                    similar = await self.faiss_service.search(embedding, k=10)

                    if similar:
                        id_mapping = await self.faiss_service.get_id_mapping()
                        for idx, score in similar:
                            case_id = id_mapping.get(idx)
                            if not case_id:
                                continue
                            try:
                                case_data = await self.case_service.get_case(case_id)
                                if crime_type and case_data.get("crime_type") != crime_type:
                                    continue
                                if locations:
                                    loc_match = any(
                                        loc.lower() in case_data.get("location", "").lower()
                                        or loc.lower() in case_data.get("district", "").lower()
                                        for loc in locations
                                    )
                                    if not loc_match:
                                        continue
                                context_records.append(self._case_to_record(case_data))
                                results.append(
                                    QueryResult(
                                        case_id=case_data["case_id"],
                                        crime_type=case_data["crime_type"],
                                        location=case_data["location"],
                                        date_filed=case_data["date_filed"],
                                        status=case_data["status"],
                                        confidence=round(score, 4),
                                        summary=(
                                            f"{case_data['crime_type']} at {case_data['location']}, "
                                            f"{case_data['district']} - {case_data['status']}"
                                        ),
                                    )
                                )
                                sources.append(f"Cases/{case_id}")
                            except ValueError:
                                continue

                total_found = len(results)
                if results:
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
                                "I could not find any cases matching your query. "
                                "Try being more specific or using different keywords."
                            )
                            confidence_avg = 0.1
                else:
                    response_text = (
                        "No matching cases found in the database. "
                        "Try being more specific or using different keywords."
                    )
                    confidence_avg = 0.05
                    total_found = 0

            except Exception as e:
                logger.error("Embedding/FAISS search failed: %s", e)
                response_text = (
                    "I encountered an issue while searching the case database. "
                    "Please try again later."
                )
                confidence_avg = 0.0

        self._history.append({
            "role": "user",
            "text": text,
            "timestamp": datetime.utcnow().isoformat(),
        })
        self._history.append({
            "role": "assistant",
            "text": response_text,
            "timestamp": datetime.utcnow().isoformat(),
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

        response_validation = grounding_validator.validate_response(
            result.answer, context_records, intent
        )
        if not response_validation["valid"]:
            return response_validation["fallback_message"]

        return result.answer

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

        filters = {}
        if crime_type:
            filters["crime_type"] = crime_type
        if locations:
            filters["location_like"] = locations[0]
        if date_ref:
            filters["date_filed"] = date_ref

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